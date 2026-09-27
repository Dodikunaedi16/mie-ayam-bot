module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  return res.status(200).json({
    namaWarung: process.env.NAMA_WARUNG || 'Mie Ayam Sahabat',
    namaWarungWa: process.env.NAMA_WARUNG_WA || process.env.NAMA_WARUNG || 'Mie Ayam Sahabat',
    nomorWa: process.env.WHATSAPP_NUMBER || '6283867050282'
  });
};
