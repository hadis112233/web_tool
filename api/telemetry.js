module.exports = async function telemetry(req, res) {
  res.setHeader?.('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return res.status(405).end();
  }
  if (process.env.TELEMETRY_ENABLED !== 'true') return res.status(204).end();

  const headers = req.headers || {};
  const contentType = String(headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!['application/json', 'text/plain'].includes(contentType)) return res.status(415).end();
  const contentLength = Number(headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > 2048) return res.status(413).end();

  let body = req.body || {};
  try {
    const actualBytes = Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body), 'utf8');
    if (actualBytes > 2048) return res.status(413).end();
  } catch (_) {
    return res.status(400).end();
  }
  try { if (typeof body === 'string') body = JSON.parse(body || '{}'); }
  catch (_) { return res.status(400).end(); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).end();
  const event = String(body.event || '').slice(0, 40);
  const value = Number(body.value);
  const pagePath = String(body.path || '').slice(0, 120);
  if (event !== 'lcp' || !Number.isFinite(value) || value < 0 || value > 120000 || !pagePath.startsWith('/')) {
    return res.status(400).end();
  }
  console.log(JSON.stringify({ type: 'hadis-telemetry', event, value, path: pagePath }));
  return res.status(204).end();
};
