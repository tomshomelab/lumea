import { readFileSync, writeFileSync, mkdirSync, createWriteStream, renameSync } from 'fs';
import { get as httpsGet } from 'https';
import { get as httpGet } from 'http';

const html = readFileSync('index.html', 'utf8');

// ── 1. Figma CDN assets ────────────────────────────────────────────────────
const figmaRegex = /https:\/\/www\.figma\.com\/api\/mcp\/asset\/([a-f0-9-]+)/g;
const figmaUrls = [...new Set([...html.matchAll(figmaRegex)].map(m => m[0]))];
console.log(`Found ${figmaUrls.length} Figma asset URLs`);
mkdirSync('assets', { recursive: true });

// ── 2. Google Fonts ────────────────────────────────────────────────────────
const gfontsLinkRegex = /<link[^>]+href=["'](https:\/\/fonts\.googleapis\.com[^"']+)["'][^>]*>/g;
const gfontsImportRegex = /@import\s+url\(['"]?(https:\/\/fonts\.googleapis\.com[^'")]+)['"]?\)/g;
const gfontsUrls = [...new Set([
  ...[...html.matchAll(gfontsLinkRegex)].map(m => m[1]),
  ...[...html.matchAll(gfontsImportRegex)].map(m => m[1]),
])];
console.log(`Found ${gfontsUrls.length} Google Fonts URLs`);

// ── Helpers ────────────────────────────────────────────────────────────────
function download(url, dest, followRedirects = 3) {
  return new Promise((resolve, reject) => {
    const getter = url.startsWith('https') ? httpsGet : httpGet;
    getter(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if ((res.statusCode === 301 || res.statusCode === 302) && followRedirects > 0) {
        return download(res.headers.location, dest, followRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const file = createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const getter = url.startsWith('https') ? httpsGet : httpGet;
    getter(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

let updatedHtml = html;
let success = 0, failed = 0;

// ── Download Figma assets ──────────────────────────────────────────────────
function detectExt(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return '.png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return '.jpg';
  if (buf[0] === 0x47 && buf[1] === 0x49) return '.gif';
  if (buf[0] === 0x52 && buf[1] === 0x49) return '.webp';
  const text = buf.slice(0, 512).toString('utf8');
  if (text.includes('<svg') || text.includes('<?xml')) return '.svg';
  return '';
}

for (const url of figmaUrls) {
  const assetId = url.split('/').pop();
  const tmpPath = `assets/${assetId}`;
  try {
    await download(url, tmpPath);
    const buf = readFileSync(tmpPath);
    const ext = detectExt(buf);
    const localPath = ext ? tmpPath + ext : tmpPath;
    if (ext) renameSync(tmpPath, localPath);
    updatedHtml = updatedHtml.replaceAll(url, localPath);
    console.log(`✓ figma: ${assetId}${ext}`);
    success++;
  } catch (e) {
    console.error(`✗ figma: ${assetId}: ${e.message}`);
    failed++;
  }
}

// ── Download Google Fonts ──────────────────────────────────────────────────
if (gfontsUrls.length > 0) {
  mkdirSync('fonts', { recursive: true });
  let combinedCss = '';

  for (const gfontsUrl of gfontsUrls) {
    try {
      let css = await fetchText(gfontsUrl);

      // Find all woff2/woff font file URLs inside the CSS
      const fontFileRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
      const fontFiles = [...css.matchAll(fontFileRegex)].map(m => m[1]);

      for (const fontUrl of fontFiles) {
        const fileName = fontUrl.split('/').pop().split('?')[0];
        const localFontPath = `fonts/${fileName}`;
        try {
          await download(fontUrl, localFontPath);
          css = css.replaceAll(fontUrl, fileName);
          console.log(`✓ font file: ${fileName}`);
          success++;
        } catch (e) {
          console.error(`✗ font file: ${fileName}: ${e.message}`);
          failed++;
        }
      }

      combinedCss += css + '\n';
    } catch (e) {
      console.error(`✗ Google Fonts CSS: ${e.message}`);
      failed++;
    }
  }

  writeFileSync('fonts/fonts.css', combinedCss, 'utf8');
  console.log('✓ fonts/fonts.css written');

  // Remove Google Fonts <link> tags
  updatedHtml = updatedHtml.replace(
    /<link[^>]+href=["']https:\/\/fonts\.googleapis\.com[^"']*["'][^>]*>/g,
    ''
  );
  // Remove @import Google Fonts
  updatedHtml = updatedHtml.replace(
    /@import\s+url\(['"]?https:\/\/fonts\.googleapis\.com[^'")]*['"]?\);?/g,
    ''
  );
  // Inject local fonts.css before </head>
  if (!updatedHtml.includes('fonts/fonts.css')) {
    updatedHtml = updatedHtml.replace(
      '</head>',
      '  <link rel="stylesheet" href="fonts/fonts.css">\n</head>'
    );
  }
}

writeFileSync('index.html', updatedHtml, 'utf8');
console.log(`\nDone: ${success} downloaded, ${failed} failed`);
console.log('index.html updated with local asset paths');
