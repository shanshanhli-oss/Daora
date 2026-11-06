/** Bundle all app code, CSS and the Three.js runtime into a file:// friendly HTML document. */
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
const outfile='.daora-standalone.cjs';
await fs.mkdir(path.resolve('dist'),{recursive:true});
await build({
  entryPoints:['scripts/standalone-entry.js'],
  bundle:true,
  format:'iife',
  platform:'browser',
  target:'es2022',
  minify:true,
  legalComments:'inline',
  outfile,
});
let html=await fs.readFile('index.html','utf8');
const script=await fs.readFile(outfile,'utf8');
// Split the document from its native module, which cannot otherwise load through file://.
html=html.replace('<script type="module" src="/src/main.js"></script>',()=>`<script>${script.replaceAll('</script','<\\/script')}</script>`);
await fs.writeFile('dist/daora-standalone.html',html);
await fs.copyFile('dist/daora-standalone.html','daora-standalone.html');
await fs.unlink(outfile);
const bytes=(await fs.stat('dist/daora-standalone.html')).size;
console.log(`Standalone HTML: dist/daora-standalone.html (${(bytes/1024/1024).toFixed(2)} MB)`);
