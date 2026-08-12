import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const submit = require('../api/submit.js');
const submitPageScript = readFileSync(new URL('../assets/js/commit-page.js', import.meta.url), 'utf8');

if (/\b(?:localStorage|sessionStorage)\b/.test(submitPageScript)) {
  throw new Error('提交页不应在浏览器中持久化邮箱、联系方式等申请资料。');
}

async function request(body, method = 'POST', ip = '127.0.0.1', extraHeaders = {}) {
  const result = { statusCode: 0, body: null, headers: {} };
  const response = {
    setHeader(name, value) {
      result.headers[name.toLowerCase()] = String(value);
      return this;
    },
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(payload) {
      result.body = payload;
      return result;
    }
  };
  await submit({ method, body, headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...extraHeaders } }, response);
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
if (methodResult.headers.allow !== 'POST') throw new Error('405 响应缺少 Allow 头。');
if (methodResult.headers['cache-control'] !== 'no-store') throw new Error('接口响应未禁止缓存。');

const mediaTypeResult = await request(base, 'POST', 'test-media-type', { 'content-type': 'text/plain' });
if (mediaTypeResult.statusCode !== 415) throw new Error('非 JSON 请求未返回 415。');

const oversizedResult = await request(base, 'POST', 'test-oversized', { 'content-length': '9000' });
if (oversizedResult.statusCode !== 413) throw new Error('过大的请求体未返回 413。');

const oversizedBodyResult = await request({ ...base, unused: 'x'.repeat(9000) }, 'POST', 'test-oversized-body');
if (oversizedBodyResult.statusCode !== 413) throw new Error('未声明长度的过大请求体未返回 413。');

const malformedResult = await request('{bad json', 'POST', 'test-malformed');
if (malformedResult.statusCode !== 400) throw new Error('损坏的 JSON 未被安全拒绝。');

const categoryResult = await request({ ...base, category: '不存在的分类' }, 'POST', 'test-category');
if (categoryResult.statusCode !== 400) throw new Error('非法分类未被拒绝。');

const honeypotResult = await request({ ...base, company: 'bot' }, 'POST', 'test-honeypot');
if (honeypotResult.statusCode !== 400) throw new Error('机器人蜜罐字段未生效。');

const validResult = await request(base, 'POST', 'test-valid');
if (validResult.statusCode !== 503) throw new Error('未配置邮件服务时没有返回可预期状态。');

let rateLimitResult;
for (let index = 0; index < 6; index += 1) rateLimitResult = await request(base, 'POST', 'test-rate-limit');
if (rateLimitResult.statusCode !== 429 || !/^\d+$/.test(rateLimitResult.headers['retry-after'] || '')) {
  throw new Error('频率限制未返回 429 和 Retry-After。');
}

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.SUBMISSION_FROM_EMAIL;
let capturedRequest;
try {
  process.env.RESEND_API_KEY = 'test-api-key';
  process.env.SUBMISSION_FROM_EMAIL = 'Hadis <submit@example.com>';

  globalThis.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return { ok: true };
  };
  const successResult = await request(base, 'POST', 'test-success');
  if (successResult.statusCode !== 200) throw new Error('邮件服务成功时接口未返回 200。');
  if (capturedRequest?.url !== 'https://api.resend.com/emails') throw new Error('邮件服务地址错误。');
  if (!capturedRequest.options.signal || capturedRequest.options.signal.aborted) {
    throw new Error('邮件服务请求未配置有效的超时信号。');
  }
  const emailPayload = JSON.parse(capturedRequest.options.body);
  if (emailPayload.reply_to !== base.email || !emailPayload.subject.includes(base.siteName)) {
    throw new Error('邮件服务请求内容不完整。');
  }

  globalThis.fetch = async () => ({ ok: false });
  const rejectedResult = await request(base, 'POST', 'test-rejected');
  if (rejectedResult.statusCode !== 502) throw new Error('邮件服务拒绝请求时未返回 502。');

  globalThis.fetch = async () => { throw new Error('network unavailable'); };
  const failedResult = await request(base, 'POST', 'test-network-error');
  if (failedResult.statusCode !== 502) throw new Error('邮件服务连接异常时未返回 502。');
} finally {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalApiKey;
  if (originalFrom === undefined) delete process.env.SUBMISSION_FROM_EMAIL;
  else process.env.SUBMISSION_FROM_EMAIL = originalFrom;
}

console.log('Submit flow valid: media type, body limit, privacy, validation, rate controls, delivery, timeout, and failure handling passed.');
