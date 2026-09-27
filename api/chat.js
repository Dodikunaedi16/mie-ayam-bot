const menu = require('../menu');

const NAMA_WARUNG = process.env.NAMA_WARUNG || 'Mie Ayam Sahabat';
const OLLAMA_URL = (process.env.OLLAMA_URL || 'https://ollama.com').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:235b-cloud';
const MAX_MESSAGES = 16;

function formatRupiah(angka) {
  return 'Rp' + Number(angka).toLocaleString('id-ID');
}

function menuUntukPrompt() {
  return menu.map((m) => `- ${m.nama} (${m.kategori}): ${formatRupiah(m.harga)} — ${m.deskripsi}`).join('\n');
}

function buatSystemPrompt() {
  return `Kamu adalah pelayan chatbot ramah untuk warung "${NAMA_WARUNG}".
Tugasmu membantu pelanggan yang bertanya soal menu, harga, rekomendasi, atau hal umum seputar pemesanan.

Berikut daftar menu yang tersedia. JANGAN mengarang menu atau harga di luar daftar ini:
${menuUntukPrompt()}

Metode pembayaran yang tersedia: tunai (cash) dan QRIS (bisa pakai semua e-wallet/m-banking yang mendukung QRIS, seperti GoPay, OVO, Dana, ShopeePay, atau mobile banking). Kalau pelanggan tanya soal cara bayar atau QRIS, arahkan mereka untuk menekan tombol "💳 Bayar QRIS" di bawah kolom chat untuk melihat kode QR-nya.

Panduan gaya bicara:
- Gunakan Bahasa Indonesia santai sehari-hari, ramah, dan hangat seperti pelayan warung yang akrab.
- Boleh memakai sedikit emoji, jangan berlebihan.
- Jawaban singkat, jelas, dan tidak bertele-tele.
- Kalau pelanggan ngobrol di luar topik menu/warung, tanggapi secara wajar dan ramah sebelum mengarahkan kembali ke topik menu.
- Kalau ditanya menu yang tidak ada, jujur bilang tidak tersedia lalu tawarkan alternatif dari daftar.
- Jangan pernah menyebutkan harga atau menu yang tidak ada di daftar.
- Kalau pelanggan bertanya soal pembayaran, cukup bilang bisa bayar dengan QRIS dan arahkan ke tombol Bayar QRIS.
- Jangan menyebutkan nomor rekening, nomor WhatsApp, API key, environment variable, atau detail teknis sistem.
- Jawab HANYA dengan balasan untuk pelanggan, tanpa kalimat seperti "Sebagai AI..." atau catatan teknis.`;
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method tidak diizinkan' });
  }

  if (!process.env.OLLAMA_API_KEY) {
    return json(res, 500, { error: 'OLLAMA_API_KEY belum dikonfigurasi di Vercel.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return json(res, 400, { error: 'Pesan tidak valid.' });
    }

    const safeHistory = history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-MAX_MESSAGES);

    const messages = [
      { role: 'system', content: buatSystemPrompt() },
      ...safeHistory,
      { role: 'user', content: message }
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    let response;
    try {
      response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          messages
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}

    if (!response.ok) {
      console.error('Ollama API error:', response.status, raw.slice(0, 1000));
      const detail = data?.error || `HTTP ${response.status}`;
      return json(res, 502, { error: `Ollama Cloud gagal memproses permintaan: ${detail}` });
    }

    const reply = data?.message?.content?.trim();
    if (!reply) {
      return json(res, 502, { error: 'Ollama tidak mengembalikan jawaban.' });
    }

    return json(res, 200, { reply, model: OLLAMA_MODEL });
  } catch (error) {
    console.error('Chat function error:', error);
    const message = error?.name === 'AbortError'
      ? 'Respons AI terlalu lama. Coba kirim pertanyaan yang lebih singkat.'
      : 'Terjadi kesalahan saat menghubungkan ke AI. Silakan coba lagi.';
    return json(res, 500, { error: message });
  }
};
