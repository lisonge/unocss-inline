let registerStyle: ((style: HTMLStyleElement) => void) | undefined;

export default function createUnoStyle(): HTMLStyleElement {
  if (typeof document === 'undefined') {
    throw new Error(
      'unocss-inline: createUnoStyle() requires a browser document. Call it after mounting on the client.'
    );
  }

  const style = document.createElement('style');
  style.textContent = '/*__UNOCSS_INLINE_STYLE_PLACEHOLDER__*/';
  registerStyle?.(style);
  return style;
}

if (import.meta.hot) {
  const styles = new Set<WeakRef<HTMLStyleElement>>();
  let iframe: HTMLIFrameElement | undefined;
  let bodyObserver: MutationObserver | undefined;
  let styleObserver: MutationObserver | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let started = false;

  const syncStyles = () => {
    const source = iframe?.contentDocument?.head.querySelector('style');
    if (!source) return;
    clearTimeout(timeout);
    for (const ref of styles) {
      const style = ref.deref();
      if (!style) {
        styles.delete(ref);
        continue;
      }
      style.textContent = source.textContent;
      for (const attr of source.attributes) {
        style.setAttribute(attr.name, attr.value);
      }
    }
  };

  const start = () => {
    // document.body may be absent at userscript document-start.
    if (!document.body) {
      bodyObserver = new MutationObserver(() => {
        if (document.body) {
          bodyObserver?.disconnect();
          start();
        }
      });
      bodyObserver.observe(document, { childList: true, subtree: true });
      return;
    }

    iframe = document.body.appendChild(document.createElement('iframe'));
    iframe.setAttribute('data-vite-dev-id', 'unocss-inline/style');
    iframe.style.display = 'none';
    const subDocument = iframe.contentDocument!;
    styleObserver = new MutationObserver(syncStyles);
    styleObserver.observe(subDocument.head, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    const script = subDocument.createElement('script');
    script.type = 'module';
    // Keep the stylesheet URL relative to the host for vite-plugin-monkey.
    script.src = new URL('/__uno.css', import.meta['url']).href;
    timeout = setTimeout(() => {
      console.error('unocss-inline: Failed to find UnoCSS style in iframe document');
    }, 10_000);
    subDocument.head.appendChild(script);
  };

  registerStyle = (style) => {
    styles.add(new WeakRef(style));
    if (!started) {
      started = true;
      start();
    }
    syncStyles();
  };

  import.meta.hot.dispose(() => {
    registerStyle = undefined;
    clearTimeout(timeout);
    bodyObserver?.disconnect();
    styleObserver?.disconnect();
    iframe?.remove();
    styles.clear();
  });
}
