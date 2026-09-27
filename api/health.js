module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  return res.status(200).json({
    ok: true,
    service: 'mie-ayam-chatbot',
    aiConfigured: Boolean(process.env.OLLAMA_API_KEY),
    provider: 'Ollama Cloud',
    model: process.env.OLLAMA_MODEL || 'qwen3-vl:235b-cloud',
    timestamp: new Date().toISOString()
  });
};
