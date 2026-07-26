module.exports = async function telemetry(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (process.env.TELEMETRY_ENABLED !== 'true') return res.status(204).end();
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const event = String(body.event || '').slice(0, 40);
  const value = Number(body.value);
  if (!event || !Number.isFinite(value)) return res.status(400).end();
  console.log(JSON.stringify({ type: 'hadis-telemetry', event, value, path: String(body.path || '').slice(0, 120) }));
  return res.status(204).end();
};
