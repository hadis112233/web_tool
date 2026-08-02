import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const navigation = fs.readFileSync('assets/js/index-page.js', 'utf8');
const errors = [];

for (const markup of ['id="sidebar"', 'id="sidebar-switch"', 'aria-controls="sidebar"', 'aria-expanded="false"']) {
  if (!index.includes(markup)) errors.push(`首页缺少侧栏无障碍标记：${markup}`);
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
  console.log('Navigation accessibility valid: hidden mobile sidebar is inert and focus state is synchronized.');
}
