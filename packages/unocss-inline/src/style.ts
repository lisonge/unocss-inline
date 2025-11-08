const unoStyle = document.createElement('style');
unoStyle.textContent = '/*__UNOCSS_INLINE_STYLE_PLACEHOLDER__*/';
export default unoStyle;

if (import.meta.hot) {
  (async () => {
    while (!document.body) {
      // document.body may be null when tampermonkey run-at document-start
      await new Promise((r) => setTimeout(r));
    }
    const iframe = document.body.appendChild(document.createElement('iframe'));
    iframe.setAttribute('data-vite-dev-id', 'unocss-inline/style');
    iframe.style.display = 'none';
    const subDocument = iframe.contentDocument!;
    const script = subDocument.createElement('script');
    script.type = 'module';
    script.src = new URL('/__uno.css', import.meta['url']).href; // compat https://github.com/lisonge/vite-plugin-monkey
    subDocument.head.appendChild(script);
    const unocssStyle = await (async () => {
      const t = Date.now() + 10_000;
      while (Date.now() < t) {
        await new Promise((r) => setTimeout(r, 100));
        const style = subDocument.head.querySelector('style');
        if (style) {
          return style;
        }
      }
    })();
    if (!unocssStyle) {
      throw new Error('Failed to find unocss style in iframe document');
    }
    const cloneStyles = [unoStyle];
    const syncStyle = () => {
      cloneStyles.forEach((style) => {
        style.textContent = unocssStyle.textContent;
        Array.from(unocssStyle.attributes).forEach((attr) => {
          unoStyle.setAttribute(attr.name, attr.value);
        });
      });
    };
    syncStyle();
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
    new MutationObserver(syncStyle).observe(unocssStyle, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  })();
}
