import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const telemetry = require('../api/telemetry.js');
const originalEnabled = process.env.TELEMETRY_ENABLED;
const originalLog = console.log;

async function request(body, method = 'POST', extraHeaders = {}) {
  const result = { statusCode: 0, headers: {}, ended: false };
  const response = {
    setHeader(name, value) {
      result.headers[name.toLowerCase()] = String(value);
      return this;
    },
    status(code) {
      result.statusCode = code;
      return this;
    },
    end() {
      result.ended = true;
      return result;
    }
  };
  await telemetry({ method, body, headers: { 'content-type': 'application/json', ...extraHeaders } }, response);
  return result;
}

try {
  delete process.env.TELEMETRY_ENABLED;
  const disabled = await request('{bad json');
  if (disabled.statusCode !== 204) throw new Error('遥测关闭时不应解析或存储请求。');

  process.env.TELEMETRY_ENABLED = 'true';
  const method = await request({}, 'GET');
  if (method.statusCode !== 405 || method.headers.allow !== 'POST') throw new Error('遥测接口的方法限制不完整。');
  if (method.headers['cache-control'] !== 'no-store') throw new Error('遥测响应未禁止缓存。');

  if ((await request('{bad json')).statusCode !== 400) throw new Error('损坏的遥测 JSON 未被安全拒绝。');
  if ((await request({}, 'POST', { 'content-type': 'application/xml' })).statusCode !== 415) throw new Error('未知遥测媒体类型未被拒绝。');
  if ((await request({ event: 'lcp', value: 1000, path: '/' }, 'POST', { 'content-length': '3000' })).statusCode !== 413) {
    throw new Error('过大的遥测请求未被拒绝。');
  }
  if ((await request({ event: 'lcp', value: 1000, path: '/', unused: 'x'.repeat(3000) })).statusCode !== 413) {
    throw new Error('未声明长度的过大遥测请求未被拒绝。');
  }
  if ((await request({ event: 'unknown', value: 1000, path: '/' })).statusCode !== 400) throw new Error('未知遥测事件未被拒绝。');
  if ((await request({ event: 'lcp', value: 130000, path: '/' })).statusCode !== 400) throw new Error('异常遥测数值未被拒绝。');

  let logged = '';
  console.log = (value) => { logged = String(value); };
  const valid = await request(JSON.stringify({ event: 'lcp', value: 1234, path: '/about/' }), 'POST', { 'content-type': 'text/plain;charset=UTF-8' });
  if (valid.statusCode !== 204 || !valid.ended) throw new Error('有效遥测事件未被接受。');
  const payload = JSON.parse(logged);
  if (payload.type !== 'hadis-telemetry' || payload.event !== 'lcp' || payload.path !== '/about/') {
    throw new Error('遥测日志内容不完整。');
  }
} finally {
  console.log = originalLog;
  if (originalEnabled === undefined) delete process.env.TELEMETRY_ENABLED;
  else process.env.TELEMETRY_ENABLED = originalEnabled;
}

console.log('Telemetry API valid: opt-in privacy, request boundaries, event validation, and safe malformed JSON handling passed.');
