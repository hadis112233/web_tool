import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const logoDir = path.join(root, 'assets/images/logos');
const sharePath = path.join(root, 'assets/images/hadis-share.png');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const errors = [];

const referencedLogos = new Set();
for (const match of index.matchAll(/(?:src|data-src)=["']([^"']+)["']/g)) {
  const cleanUrl = match[1].split(/[?#]/)[0].replace(/^\.\//, '');
  let decodedUrl = cleanUrl;
  try { decodedUrl = decodeURI(cleanUrl); } catch {}
  if (decodedUrl.startsWith('assets/images/logos/')) {
    referencedLogos.add(path.posix.basename(decodedUrl));
  }
}

const logoFiles = fs.readdirSync(logoDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name);
const orphanLogos = logoFiles.filter((name) => !referencedLogos.has(name)).sort();
if (orphanLogos.length) {
  errors.push(`存在首页未引用的站点图标：${orphanLogos.join(', ')}`);
}

if (!fs.existsSync(sharePath)) {
  errors.push('缺少社交分享图片 hadis-share.png。');
} else {
  const share = fs.readFileSync(sharePath);
  const pngSignature = '89504e470d0a1a0a';
  const width = share.length >= 24 ? share.readUInt32BE(16) : 0;
  const height = share.length >= 24 ? share.readUInt32BE(20) : 0;

  if (share.subarray(0, 8).toString('hex') !== pngSignature) {
    errors.push('社交分享图片不是有效的 PNG 文件。');
  }
  if (width !== 1200 || height !== 630) {
    errors.push(`社交分享图片尺寸错误：${width}×${height}，应为 1200×630。`);
  }
  if (share.length > 220_000) {
    errors.push(`社交分享图片体积过大：${share.length} bytes。`);
  }
}

if (errors.length) {
  console.error(`图片资源校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const shareBytes = fs.statSync(sharePath).size;
  console.log(`Image assets valid: ${logoFiles.length} referenced logos, share image ${shareBytes} bytes.`);
}
