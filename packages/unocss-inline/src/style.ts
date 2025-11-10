const unoStyle = document.createElement('style');
unoStyle.textContent = '/*__UNOCSS_INLINE_STYLE_PLACEHOLDER__*/';
export default unoStyle;

if (import.meta.hot) {
  let unocssStyle: HTMLStyleElement;
  const cloneStyles = [unoStyle];
  const syncStyle = () => {
    if (!unocssStyle) return;
    cloneStyles.forEach((style) => {
      style.textContent = unocssStyle.textContent;
      Array.from(unocssStyle.attributes).forEach((attr) => {
        unoStyle.setAttribute(attr.name, attr.value);
      });
    });
  };
  const overrideClone = (style: HTMLStyleElement) => {
    const cloneFn = style.cloneNode;
    style.cloneNode = function (subtree?: boolean) {
      const cloned = cloneFn.call(this, subtree) as HTMLStyleElement;
      if (subtree) {
        cloneStyles.push(cloned);
        overrideClone(cloned);
      }
      return cloned;
    };
  };
  overrideClone(unoStyle);
  (async () => {
    // document.body may be null when tampermonkey run-at document-start
    while (!document.body) {
      await new Promise((r) => setTimeout(r));
    }
    const iframe = document.body.appendChild(document.createElement('iframe'));
    iframe.setAttribute('data-vite-dev-id', 'unocss-inline/style');
    iframe.style.display = 'none';
    const subDocument = iframe.contentDocument!;
    const script = subDocument.createElement('script');
    script.type = 'module';
    // compat https://github.com/lisonge/vite-plugin-monkey
    script.src = new URL('/__uno.css', import.meta['url']).href;
    subDocument.head.appendChild(script);
    unocssStyle = await (async () => {
      const t = Date.now() + 10_000;
      while (Date.now() < t) {
        await new Promise((r) => setTimeout(r, 100));
        const style = subDocument.head.querySelector('style');
        if (style) {
          return style;
        }
      }
      throw new Error('Failed to find unocss style in iframe document');
    })();
    syncStyle();
    new MutationObserver(syncStyle).observe(unocssStyle, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  })();
}
