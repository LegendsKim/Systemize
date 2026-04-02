const fs = require('fs-extra');
const path = require('path');
const { minify: htmlMinify } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const { minify: jsMinify } = require('terser');

const DIST_DIR = path.join(__dirname, 'dist');

function sizeKB(str) {
  return (Buffer.byteLength(str, 'utf8') / 1024).toFixed(1);
}

async function build() {
  console.log('🚀 Starting Systemize Production Build...\n');
  await fs.emptyDir(DIST_DIR);

  // ── HTML ──────────────────────────────────────────────────
  console.log('📄 Minifying index.html...');
  const htmlRaw = await fs.readFile('index.html', 'utf8');
  const htmlMin = await htmlMinify(htmlRaw, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    minifyCSS: true,
    minifyJS: {
      compress: { drop_console: false },
      mangle: true
    },
    sortAttributes: true,
    sortClassName: true,
    useShortDoctype: true,
    collapseInlineTagWhitespace: false
  });
  await fs.writeFile(path.join(DIST_DIR, 'index.html'), htmlMin);
  console.log(`   ${sizeKB(htmlRaw)} KB → ${sizeKB(htmlMin)} KB  (${(100 - (Buffer.byteLength(htmlMin) / Buffer.byteLength(htmlRaw)) * 100).toFixed(0)}% reduction)`);

  // ── CSS ──────────────────────────────────────────────────
  console.log('🎨 Minifying index.css...');
  const cssRaw = await fs.readFile('index.css', 'utf8');
  const cssResult = new CleanCSS({
    level: {
      1: { all: true },
      2: { restructureRules: true, mergeSemantically: true, removeEmpty: true }
    }
  }).minify(cssRaw);
  await fs.writeFile(path.join(DIST_DIR, 'index.css'), cssResult.styles);
  console.log(`   ${sizeKB(cssRaw)} KB → ${sizeKB(cssResult.styles)} KB  (${(100 - (Buffer.byteLength(cssResult.styles) / Buffer.byteLength(cssRaw)) * 100).toFixed(0)}% reduction)`);

  // ── JS ───────────────────────────────────────────────────
  console.log('⚡ Minifying script.js...');
  const jsRaw = await fs.readFile('script.js', 'utf8');
  const jsResult = await jsMinify(jsRaw, {
    compress: {
      drop_console: false,
      passes: 2,
      dead_code: true,
      collapse_vars: true,
      reduce_vars: true
    },
    mangle: {
      toplevel: true
    },
    output: {
      comments: false
    }
  });
  if (jsResult.code) {
    await fs.writeFile(path.join(DIST_DIR, 'script.js'), jsResult.code);
    console.log(`   ${sizeKB(jsRaw)} KB → ${sizeKB(jsResult.code)} KB  (${(100 - (Buffer.byteLength(jsResult.code) / Buffer.byteLength(jsRaw)) * 100).toFixed(0)}% reduction)`);
  }

  // ── API Functions ────────────────────────────────────────
  console.log('📡 Copying api/ functions...');
  await fs.copy('api', path.join(DIST_DIR, 'api'));

  console.log('\n✅ Build completed! Output in /dist');
  
  // Total size
  const totalRaw = Buffer.byteLength(htmlRaw) + Buffer.byteLength(cssRaw) + Buffer.byteLength(jsRaw);
  const totalMin = Buffer.byteLength(htmlMin) + Buffer.byteLength(cssResult.styles) + Buffer.byteLength(jsResult.code || '');
  console.log(`📦 Total: ${(totalRaw / 1024).toFixed(1)} KB → ${(totalMin / 1024).toFixed(1)} KB  (${(100 - (totalMin / totalRaw) * 100).toFixed(0)}% total reduction)\n`);
}

build().catch(console.error);
