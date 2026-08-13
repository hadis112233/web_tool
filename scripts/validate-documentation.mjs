import fs from 'node:fs';

const documents = [
  ['README.md', fs.readFileSync('README.md', 'utf8')],
  ['Readme-en.md', fs.readFileSync('Readme-en.md', 'utf8')]
];
const errors = [];

for (const [file, source] of documents) {
  for (const required of [
    'python -m http.server 8000',
    'nginx/web.008997.xyz.conf.example',
    'vercel.json',
    'node scripts/build-catalog.mjs'
  ]) {
    if (!source.includes(required)) errors.push(`${file} 缺少当前项目说明：${required}`);
  }
  if (/public,\s*(?:max-age=31536000,\s*)?immutable|expires\s+30d/i.test(source)) {
    errors.push(`${file} 仍建议对未版本化资源使用长期不可变缓存。`);
  }
  if (/直接用浏览器打开 index\.html|simply open index\.html/i.test(source)) {
    errors.push(`${file} 仍建议使用无法完整运行项目功能的 file:// 预览。`);
  }
}

if (errors.length) {
  console.error(`项目文档校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Documentation valid: local preview and deployment instructions match the maintained configuration files.');
}
