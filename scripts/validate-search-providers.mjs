import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const errors = [];
const retiredTemplates = [
  'https://www.ciku5.com/s?wd=',
  'https://www.12306.cn/?',
  'https://www.qunar.com/?',
  'https://sou.zhaopin.com/jobs/searchresult.ashx?kw=',
  'https://search.51job.com/?',
  'https://www.lagou.com/jobs/list_'
];
const expectedTemplates = new Map([
  ['type-zhaopin', 'https://sou.zhaopin.com/?kw='],
  ['type-51job', 'https://we.51job.com/pc/search?keyword='],
  ['type-lagou', 'https://www.lagou.com/wn/jobs?kd=']
]);
const testKeyword = '前端 开发';
const encodedKeyword = encodeURIComponent(testKeyword);

const searchBlock = index.match(/<div id="search-list"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/)?.[0] || '';
if (!searchBlock) errors.push('找不到首页搜索提供商区域。');

const inputs = [...searchBlock.matchAll(/<input\b[^>]*\btype="radio"[^>]*>/g)].map((match) => match[0]);
const ids = new Set();
const templates = new Set();
for (const input of inputs) {
  const id = input.match(/\bid="([^"]+)"/)?.[1] || '';
  const rawValue = input.match(/\bvalue\s*=\s*"([^"]+)"/)?.[1] || '';
  const value = rawValue.replaceAll('&amp;', '&');
  if (!id || ids.has(id)) errors.push(`搜索提供商 ID 缺失或重复：${id || '未知'}`);
  if (!value.startsWith('https://')) errors.push(`搜索模板必须使用 HTTPS：${id}`);
  if (templates.has(value)) errors.push(`搜索模板重复：${value}`);
  if (/(^|[^&])&(?!amp;)/.test(rawValue)) errors.push(`搜索模板包含未转义的 &：${id}`);
  try {
    const searchUrl = new URL(value + encodedKeyword);
    if (!searchUrl.href.includes(encodedKeyword)) errors.push(`搜索模板没有保留测试关键词：${id}`);
  } catch {
    errors.push(`搜索模板无法生成有效地址：${id}`);
  }
  ids.add(id);
  templates.add(value);
}

for (const [id, template] of expectedTemplates) {
  if (!ids.has(id) || !templates.has(template)) errors.push(`搜索模板缺失或未升级：${id}`);
}
for (const template of retiredTemplates) {
  if (templates.has(template)) errors.push(`仍在使用已失效或误导的搜索模板：${template}`);
}

const labelTargets = [...searchBlock.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)].map((match) => match[1]);
for (const target of labelTargets) {
  if (!ids.has(target)) errors.push(`搜索标签指向不存在的选项：${target}`);
}
if (inputs.length < 20) errors.push(`搜索提供商数量异常：${inputs.length}`);

if (errors.length) {
  console.error(`搜索提供商校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Search providers valid: ${inputs.length} HTTPS templates, current job-search routes, and valid label targets.`);
}
