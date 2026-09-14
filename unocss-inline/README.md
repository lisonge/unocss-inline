# unocss-inline

customize [unocss](https://unocss.dev/integrations/vite#global-default) css side effect

<https://github.com/lisonge/unocss-inline>

```ts
import createUnoStyle from 'unocss-inline/style';

// Run in the browser after creating your shadow root.
shadowRoot.appendChild(createUnoStyle());
```

Importing the factory is safe during SSR/SSG. Call it only on the client, such
as in Vue's `onMounted`; calling it without a browser document throws an error.
Server-rendered HTML does not receive CSS from this API.

Each call creates a separate element with HMR support. The default export is
now a function: replace the old style object or `cloneNode(true)` calls with
`createUnoStyle()` calls. Native clones do not subscribe to HMR updates.
