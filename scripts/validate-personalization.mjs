import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('assets/js/site-enhancements.js', 'utf8');
const errors = [];
const functionStart = source.indexOf('function cleanStoredUrls');
const functionTail = functionStart === -1 ? '' : source.slice(functionStart);
const functionEndMatch = functionTail.match(/\r?\n\r?\n\s*var favorites/);
const functionEnd = functionEndMatch ? functionStart + functionEndMatch.index : -1;

if (functionStart === -1 || functionEnd === -1) {
  errors.push('未找到收藏与最近访问清理函数。');
} else {
  const functionSource = source.slice(functionStart, functionEnd).trim();
  const cleanStoredUrls = vm.runInNewContext(`(${functionSource})`);
  const original = ['https://valid.example/', 'https://removed.example/', 'https://valid.example/', 'https://second.example/'];
  const available = new Set(['https://valid.example/', 'https://second.example/']);
  const cleaned = cleanStoredUrls(original, available, 12);
  const limited = cleanStoredUrls(original, available, 1);

  if (JSON.stringify(cleaned) !== JSON.stringify(['https://valid.example/', 'https://second.example/'])) {
    errors.push('本地网址清理未正确移除失效项或重复项。');
  }
  if (JSON.stringify(limited) !== JSON.stringify(['https://valid.example/'])) {
    errors.push('本地网址清理未正确限制记录数量。');
  }
  if (original.length !== 4) errors.push('本地网址清理不应修改输入数组。');
}

for (const behavior of [
  'writeFavorites(cleanedFavorites)',
  'writeRecent(cleanedRecent)',
  'favorites = cleanedFavorites',
  'recent = cleanedRecent',
  'removeStored(RECENT_KEY)'
]) {
  if (!source.includes(behavior)) errors.push(`个性化数据脚本缺少必要行为：${behavior}`);
}

if (errors.length) {
  console.error(`个性化数据校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Personalization data valid: stale and duplicate local URLs are removed with history limits preserved.');
}
