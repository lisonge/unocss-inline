# What's Changed

- BREAKING: `unocss-inline/style` now exports `createUnoStyle()` instead of a style element; call it on the client and replace `cloneNode(true)` calls with new factory calls.
- feat: allow importing `unocss-inline/style` during SSR/SSG without accessing the DOM; CSS is still attached on the client.
- fix: share UnoCSS HMR updates across independently created style elements, including elements created after the stylesheet loads.
- BREAKING: require Vite 8.3 or later within Vite 8.
