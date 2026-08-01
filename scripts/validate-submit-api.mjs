import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const submit = require('../api/submit.js');
const submitPageScript = readFileSync(new URL('../assets/js/commit-page.js', import.meta.url), 'utf8');

if (/\b(?:localStorage|sessionStorage)\b/.test(submitPageScript)) {
  throw new Error('提交页不应在浏览器中持久化邮箱、联系方式等申请资料。');
}

async function request(body, method = 'POST', ip = '127.0.0.1') {
  const result = { statusCode: 0, body: null };
  const response = {
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(payload) {
      result.body = payload;
      return result;
    }
  };
  await submit({ method, body, headers: { 'x-forwarded-for': ip } }, response);
  return result;
}

const base = {
  siteName: '示例工具',
  siteUrl: 'https://example.com/',
  category: '常用工具',
  description: '用于接口校验的示例网站。',
  email: 'test@example.com',
  company: ''
};

const methodResult = await request({}, 'GET', 'test-method');
if (methodResult.statusCode !== 405) throw new Error('非 POST 请求未被拒绝。');

const categoryResult = await request({ ...base, category: '不存在的分类' }, 'POST', 'test-category');
if (categoryResult.statusCode !== 400) throw new Error('非法分类未被拒绝。');

const honeypotResult = await request({ ...base, company: 'bot' }, 'POST', 'test-honeypot');
if (honeypotResult.statusCode !== 400) throw new Error('机器人蜜罐字段未生效。');

const validResult = await request(base, 'POST', 'test-valid');
if (validResult.statusCode !== 503) throw new Error('未配置邮件服务时没有返回可预期状态。');

console.log('Submit flow valid: no browser persistence, method, category allowlist, honeypot, and service configuration checks passed.');
