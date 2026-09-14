# unocss-inline

customize [unocss](https://unocss.dev/integrations/vite#global-default) css side effect

## Installation

```shell
pnpm add unocss-inline
```

## Usage

old usage

```ts
// vite.config.ts
import unocss from 'unocss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [unocss()],
});
```

```ts
// main.ts
import 'virtual:uno.css';
```

---

new usage -> [unocss-example](./unocss-example)

```ts
// vite.config.ts
import unocss from 'unocss/vite';
import unocssInline from 'unocss-inline';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [unocss(), unocssInline()],
});
```

```ts
// main.ts
import createUnoStyle from 'unocss-inline/style';

const shadowRoot = document.body
  .appendChild(document.createElement('div'))
  .attachShadow({ mode: 'open' });
shadowRoot.appendChild(createUnoStyle());

const style2 = createUnoStyle(); // independent element, also with HMR support
```

## SSR / SSG

Importing `unocss-inline/style` is safe on the server. Call `createUnoStyle()` only
in the browser, for example inside Vue's `onMounted`. Calling it without a
browser document throws an error. It does not add CSS to server-rendered HTML;
styles are inserted when the client creates and attaches the element.

Each call returns a new element. During development, elements created by the
factory share UnoCSS HMR updates. Use another `createUnoStyle()` call instead of
`cloneNode()` when you need another element with live updates.

The default export was previously a style element. Replace direct use of that
element, or `unoStyle.cloneNode(true)`, with `createUnoStyle()`.
