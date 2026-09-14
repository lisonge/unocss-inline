import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createSSRApp, h, onMounted } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { build, createBuilder } from 'vite';
import { presetWind3 } from 'unocss';
import UnoCSS from 'unocss/vite';
import unocssInline from '../src/index.ts';
import createUnoStyle from '../src/style.ts';

for (const preserveSymlinks of [false, true]) {
  test(`client builds inline CSS with preserveSymlinks=${preserveSymlinks}`, async () => {
    const result = await build({
      root: fileURLToPath(new URL('../../unocss-example/', import.meta.url)),
      configFile: false,
      logLevel: 'silent',
      resolve: { preserveSymlinks },
      plugins: [
        {
          name: 'test-style-entry',
          resolveId(id) {
            if (id === 'virtual:test-style-entry') return id;
          },
          load(id) {
            if (id === 'virtual:test-style-entry') {
              return 'export { default } from "unocss-inline/style";';
            }
          },
        },
        UnoCSS({ presets: [presetWind3()], safelist: ['text-red'] }),
        unocssInline(),
      ],
      build: {
        write: false,
        minify: false,
        rolldownOptions: {
          input: 'virtual:test-style-entry',
          preserveEntrySignatures: 'strict',
        },
      },
    });
    assert.ok('output' in result);
    const entry = result.output.find((item) => item.type === 'chunk' && item.isEntry);
    assert.ok(entry && entry.type === 'chunk');
    assert.match(entry.code, /--un-text-opacity/);
    assert.doesNotMatch(entry.code, /__UNOCSS_INLINE_STYLE_PLACEHOLDER__/);
  });
}

test('can import the factory without a DOM; creating a style requires a browser', () => {
  assert.equal(typeof document, 'undefined');
  assert.equal(typeof createUnoStyle, 'function');
  assert.throws(() => createUnoStyle(), /createUnoStyle.*browser/i);
});

test('SSR and repeated prerenders do not create browser resources', async () => {
  const render = () => renderToString(createSSRApp({
    setup() {
      onMounted(() => createUnoStyle());
      return () => h('main', 'SSR works');
    },
  }));
  assert.deepEqual(await Promise.all([render(), render()]), [
    '<main>SSR works</main>',
    '<main>SSR works</main>',
  ]);
});

test('Vite SSR builds keep the factory importable without injecting CSS', async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [unocssInline()],
    build: {
      ssr: fileURLToPath(new URL('../src/style.ts', import.meta.url)),
      write: false,
      minify: false,
    },
  });
  assert.ok('output' in result);
  assert.equal(result.output.filter((item) => item.type === 'asset').length, 0);
  const entry = result.output.find((item) => item.type === 'chunk' && item.isEntry);
  assert.ok(entry && entry.type === 'chunk');
  const built = await import(`data:text/javascript;base64,${Buffer.from(entry.code).toString('base64')}`);
  assert.equal(typeof built.default, 'function');
  assert.throws(() => built.default(), /createUnoStyle.*browser/i);
});

test('Vite server environments skip client CSS interception', async () => {
  const builder = await createBuilder({
    configFile: false,
    logLevel: 'silent',
    plugins: [unocssInline()],
    environments: {
      ssr: {
        consumer: 'server',
        build: {
          ssr: fileURLToPath(new URL('../src/style.ts', import.meta.url)),
          write: false,
        },
      },
    },
  });
  const result = await builder.build(builder.environments.ssr);
  assert.ok('output' in result);
  const entry = result.output.find((item) => item.type === 'chunk' && item.isEntry);
  assert.ok(entry && entry.type === 'chunk');
  const built = await import(`data:text/javascript;base64,${Buffer.from(entry.code).toString('base64')}`);
  assert.throws(() => built.default(), /createUnoStyle.*browser/i);
});
