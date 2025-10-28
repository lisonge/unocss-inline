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

new usage -> [playground/example](./playground/example)

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
import unoStyle from 'unocss-inline/style'; // with hmr support

const shadowRoot = document.body
  .appendChild(document.createElement('div'))
  .attachShadow({ mode: 'open' });
shadowRoot.appendChild(unoStyle);

const style2 = unoStyle.cloneNode(true); // also hmr support
```
