import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const navigation = fs.readFileSync('assets/js/index-page.js', 'utf8');
const customStyle = fs.readFileSync('assets/css/custom-style.css', 'utf8');
const errors = [];

for (const markup of ['id="sidebar"', 'id="sidebar-switch"', 'aria-controls="sidebar"', 'aria-expanded="false"']) {
  if (!index.includes(markup)) errors.push(`首页缺少侧栏无障碍标记：${markup}`);
}

for (const markup of [
  'class="super-search-fm" role="search" aria-label="网页搜索"',
  'enterkeyhint="search" autocapitalize="none" spellcheck="false"'
]) {
  if (!index.includes(markup)) errors.push(`首页搜索框缺少移动端或语义标记：${markup}`);
}

if (/style=["'][^"']*outline\s*:\s*(?:0|none)/i.test(index)) {
  errors.push('首页仍通过行内样式隐藏键盘焦点轮廓。');
}
for (const markup of [
  'a[href]:focus-visible',
  'outline: 3px solid #fff !important',
  'box-shadow: 0 0 0 5px #1d4ed8 !important',
  '@media(forced-colors:active)',
  'outline: 3px solid Highlight !important'
]) {
  if (!customStyle.includes(markup)) errors.push(`首页缺少全局键盘焦点可见性：${markup}`);
}

const enhancements = fs.readFileSync('assets/js/site-enhancements.js', 'utf8');
for (const markup of ['type="search"', 'enterkeyhint="search"', 'spellcheck="false"']) {
  if (!enhancements.includes(markup)) errors.push(`站内筛选框缺少移动端搜索标记：${markup}`);
}

for (const behavior of [
  'function syncSidebarAccessibility()',
  'sidebar.inert = isHidden',
  "sidebar.setAttribute('aria-hidden', isHidden ? 'true' : 'false')",
  "sidebarSwitch.setAttribute('aria-expanded', isOpen ? 'true' : 'false')",
  "firstLink.focus()",
  "closeSidebar(true)"
]) {
  if (!navigation.includes(behavior)) errors.push(`侧栏脚本缺少无障碍行为：${behavior}`);
}

if (errors.length) {
  console.error(`侧栏无障碍校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Navigation accessibility valid: mobile sidebar, search semantics, and keyboard focus indicators passed.');
}
