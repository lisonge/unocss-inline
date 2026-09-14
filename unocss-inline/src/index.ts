import { Visitor, type Plugin, type Rolldown } from 'vite';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import MagicString from 'magic-string';
import * as htmlparser2 from 'htmlparser2';

const unocssSuffix = '/__uno.css';
const placeholder = '/*__UNOCSS_INLINE_STYLE_PLACEHOLDER__*/';

export default function unocssInline(): Plugin[] {
  const stylePath = realpathSync(
    fileURLToPath(import.meta.resolve('unocss-inline/style'))
  ).replaceAll('\\', '/');
  let preserveSymlinks = false;
  const cssSet = new Set<string>();
  return [
    {
      name: 'unocss-inline:build',
      apply(config, { command }) {
        return command === 'build' && !config.build?.ssr;
      },
      applyToEnvironment(environment) {
        return environment.config.consumer === 'client';
      },
      enforce: 'post',
      configResolved(config) {
        preserveSymlinks = config.resolve.preserveSymlinks;
        const cssPostPlugin = config.plugins.find(
          (i) => i.name === 'vite:css-post'
        ) as Plugin | undefined;
        if (!cssPostPlugin) return;
        const handleCss = (code: string, id: string) => {
          if (id.endsWith(unocssSuffix) && !code.startsWith(`#--unocss--{`)) {
            cssSet.add(code);
            return '';
          }
          return code;
        };
        if ('handler' in cssPostPlugin.transform!) {
          const original = cssPostPlugin.transform.handler;
          cssPostPlugin.transform.handler = async function (code, id, options) {
            const isClient = this.environment.config.consumer === 'client';
            return original.call(this, isClient ? handleCss(code, id) : code, id, options);
          };
        } else {
          const original = cssPostPlugin.transform!;
          cssPostPlugin.transform = async function (code, id, options) {
            const isClient = this.environment.config.consumer === 'client';
            return original.call(this, isClient ? handleCss(code, id) : code, id, options);
          };
        }
      },
      transform(code, id) {
        let filePath = id.split('?')[0];
        if (preserveSymlinks && filePath !== stylePath && !filePath.startsWith('\0')) {
          try {
            filePath = realpathSync(filePath).replaceAll('\\', '/');
          } catch {
            // Virtual module IDs need not correspond to files on disk.
          }
        }
        if (filePath === stylePath) {
          const ms = new MagicString(code);
          ms.append(`\nimport "uno.css";`);
          return {
            code: ms.toString(),
            map: ms.generateMap(),
          };
        }
        // avoid vite build error
        if (id.endsWith(unocssSuffix)) {
          return '';
        }
      },
      renderChunk(code) {
        if (!code.includes(placeholder)) return;
        const cssCodeStr = JSON.stringify(Array.from(cssSet).join('\n'));
        const ms = new MagicString(code);
        new Visitor({
          Literal(node) {
            if (node.value === placeholder) {
              ms.overwrite(node.start, node.end, cssCodeStr);
            }
          },
        }).visit(this.parse(code));
        return { code: ms.toString(), map: ms.generateMap() };
      },
      generateBundle(_, bundle) {
        const htmlFiles: Rolldown.OutputAsset[] = [];
        Object.values(bundle).forEach((chunk) => {
          if (chunk.type === 'asset' && chunk.fileName.endsWith('.html')) {
            htmlFiles.push(chunk);
          }
        });
        if (!htmlFiles.length) return;
        const cssFiles: Rolldown.OutputAsset[] = [];
        Object.entries(bundle).forEach(([fileName, chunk]) => {
          if (
            chunk.type === 'asset' &&
            chunk.fileName.endsWith('.css') &&
            chunk.source.length === 0
          ) {
            cssFiles.push(chunk);
            delete bundle[fileName];
          }
        });
        if (!cssFiles.length) return;
        htmlFiles.forEach((htmlFile) => {
          const doc = htmlparser2.parseDocument(htmlFile.source.toString(), {
            withStartIndices: true,
            withEndIndices: true,
          });
          const links = htmlparser2.DomUtils.findAll(
            (n) =>
              n.name === 'link' &&
              n.attribs.rel === 'stylesheet' &&
              typeof n.attribs.href === 'string' &&
              cssFiles.some((css) =>
                n.attribs.href.endsWith('/' + css.fileName)
              ),
            doc
          );
          if (!links.length) return;
          const ms = new MagicString(htmlFile.source.toString());
          links.forEach((link) => {
            ms.update(link.startIndex!, link.endIndex! + 1, '');
          });
          htmlFile.source = ms.toString();
        });
      },
    },
  ];
}
