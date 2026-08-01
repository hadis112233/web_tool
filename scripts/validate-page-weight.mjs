import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const indexBytes = fs.statSync('index.html').size;
const errors = [];
const catalogMatch = index.match(/<!-- SITE_CATALOG_START -->([\s\S]*?)<!-- SITE_CATALOG_END -->/);

if (!catalogMatch) {
  errors.push('首页缺少网站目录生成区。');
} else {
  const catalogBlock = catalogMatch[1];
  const lineCount = catalogBlock.split(/\r?\n/).length;
  if (lineCount > 50) errors.push(`网站目录标记仍过于松散：${lineCount} 行。`);
  if (/\bdata-id=""|\bdata-url=/.test(catalogBlock)) {
    errors.push('网站目录仍包含空属性或重复网址属性。');
  }
}

if (indexBytes > 135_000) {
  errors.push(`首页 HTML 体积过大：${indexBytes} bytes。`);
}

if (errors.length) {
  console.error(`页面体积校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Page weight valid: index.html ${indexBytes} bytes.`);
}
