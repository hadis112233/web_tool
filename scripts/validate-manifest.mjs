import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const manifest = JSON.parse(await readFile('manifest.webmanifest', 'utf8'));
const errors = [];
const requiredFields = ['id', 'name', 'short_name', 'description', 'start_url', 'scope', 'display', 'theme_color'];

for (const field of requiredFields) {
  if (!manifest[field]) errors.push(`PWA 清单缺少字段：${field}`);
}

for (const icon of manifest.icons || []) {
  const path = resolve(decodeURIComponent(icon.src.replace(/^\//, '')));
  try {
    await access(path);
  } catch {
    errors.push(`PWA 图标不存在：${icon.src}`);
    continue;
  }

  if (icon.type === 'image/png' && /^\d+x\d+$/.test(icon.sizes || '')) {
    const image = await readFile(path);
    const width = image.readUInt32BE(16);
    const height = image.readUInt32BE(20);
    if (`${width}x${height}` !== icon.sizes) {
      errors.push(`PWA 图标尺寸不符：${icon.src} 声明 ${icon.sizes}，实际 ${width}x${height}`);
    }
  }
}

if (!manifest.icons?.some(icon => icon.type === 'image/png' && icon.sizes === '192x192')) {
  errors.push('PWA 清单缺少 192x192 PNG 图标');
}
if (!manifest.icons?.some(icon => icon.type === 'image/png' && icon.sizes === '512x512')) {
  errors.push('PWA 清单缺少 512x512 PNG 图标');
}

if (errors.length) throw new Error(errors.join('\n'));
console.log(`PWA manifest valid: ${manifest.icons.length} icons.`);
