const MAX_LENGTHS = {
  siteName: 50,
  siteUrl: 2048,
  category: 80,
  description: 200,
  keywords: 200,
  email: 254,
  contact: 200
};
const attempts = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_TRACKED_CLIENTS = 5000;
const catalog = require('../data/sites.json');
const ALLOWED_CATEGORIES = new Set([...catalog.categories.map((category) => category.name), '其他']);

function text(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch (_) {
    return false;
  }
}

module.exports = async function submit(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const forwarded = String((req.headers || {})['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  if (!attempts.has(forwarded) && attempts.size >= MAX_TRACKED_CLIENTS) {
    attempts.delete(attempts.keys().next().value);
  }
  const recent = (attempts.get(forwarded) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) return res.status(429).json({ error: '提交过于频繁，请稍后再试。' });
  recent.push(now);
  attempts.set(forwarded, recent);

  let body = req.body || {};
  try { if (typeof body === 'string') body = JSON.parse(body || '{}'); }
  catch (_) { return res.status(400).json({ error: '提交数据格式错误。' }); }
  if (body.company) return res.status(400).json({ error: 'Invalid submission' });

  const form = Object.fromEntries(Object.entries(MAX_LENGTHS).map(([key, max]) => [key, text(body[key], max)]));
  if (!form.siteName || !form.category || !form.description || !form.email || !validUrl(form.siteUrl)) {
    return res.status(400).json({ error: '请完整填写有效的网站信息。' });
  }
  if (!ALLOWED_CATEGORIES.has(form.category)) {
    return res.status(400).json({ error: '请选择有效的网站分类。' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return res.status(400).json({ error: '请输入有效的联系邮箱。' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SUBMISSION_FROM_EMAIL;
  const to = process.env.SUBMISSION_TO_EMAIL || 'wwd118932@gmail.com';
  if (!apiKey || !from) {
    return res.status(503).json({ error: '收录服务暂未配置，请使用邮件方式提交。' });
  }

  const lines = [
    ['网站名称', form.siteName], ['网站网址', form.siteUrl], ['申请分类', form.category],
    ['网站描述', form.description], ['关键词', form.keywords || '未填写'],
    ['联系邮箱', form.email], ['其他联系方式', form.contact || '未填写']
  ];
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: form.email,
      subject: `【网址收录申请】${form.siteName}`,
      text: lines.map(([label, value]) => `${label}：${value}`).join('\n')
    })
  });
  if (!response.ok) return res.status(502).json({ error: '提交服务暂时不可用，请稍后重试。' });
  return res.status(200).json({ ok: true });
};
