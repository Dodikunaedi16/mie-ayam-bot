# Mie Ayam Chatbot — Vercel + Ollama Cloud

Project ini sudah disiapkan untuk deployment langsung ke Vercel.

Tidak perlu:
- Express server
- `ollama serve`
- Ollama lokal di laptop/VPS
- database untuk history percakapan dasar

Arsitektur:

```text
Browser
  ↓
Vercel Static Frontend
  ↓
Vercel Function /api/chat
  ↓
Ollama Cloud API
  ↓
Model Ollama Cloud
```

## 1. Buat API key Ollama

Buat API key pada akun Ollama kamu. API key digunakan server-side dan tidak pernah ditaruh di HTML/JavaScript frontend.

## 2. Environment Variables di Vercel

Buka:

`Vercel → Project → Settings → Environment Variables`

Tambahkan:

```text
NAMA_WARUNG=Mie Ayam Sahabat
NAMA_WARUNG_WA=Mie Ayam Sahabat
WHATSAPP_NUMBER=6283867050282
OLLAMA_API_KEY=API_KEY_OLLAMA_KAMU
OLLAMA_URL=https://ollama.com
OLLAMA_MODEL=qwen3-vl:235b-cloud
```

`OLLAMA_API_KEY` adalah satu-satunya variabel yang wajib untuk AI.

> Jangan memasukkan API key ke `index.html`, `NEXT_PUBLIC_*`, GitHub, atau chat frontend.

## 3. Deploy ke Vercel

1. Upload repository ini ke GitHub.
2. Di Vercel pilih **Add New → Project**.
3. Import repository tersebut.
4. Framework Preset: **Other**.
5. Build Command: kosong.
6. Output Directory: kosong.
7. Klik **Deploy**.
8. Setelah Environment Variables ditambahkan, lakukan **Redeploy**.

Vercel otomatis mengenali:
- `public/` sebagai file frontend.
- `api/chat.js` sebagai serverless function.
- `api/config.js` sebagai endpoint konfigurasi frontend.
- `api/menu.js` sebagai endpoint menu.
- `api/health.js` sebagai health check.

## 4. Mengubah menu

Edit `menu.js`:

```js
{
  nama: "Nama Menu",
  harga: 15000,
  deskripsi: "Deskripsi singkat",
  kategori: "reguler"
}
```

Tidak perlu mengubah `api/chat.js`. Daftar menu otomatis dimasukkan ke system prompt chatbot.

## 5. Mengubah model

Ubah `OLLAMA_MODEL` di Vercel sesuai model cloud yang tersedia di akun Ollama kamu.

Contoh:

```text
qwen3-vl:235b-cloud
gemma4:cloud
gpt-oss:120b-cloud
```

Ketersediaan, harga, dan batas penggunaan model dapat berubah. Periksa akun Ollama sebelum memilih model produksi.

## 6. WhatsApp dan QRIS

Nomor WhatsApp dan nama warung dibaca dari Environment Variables:

```text
NAMA_WARUNG_WA
WHATSAPP_NUMBER
```

Gambar QRIS tetap berada di:

```text
public/qris.jpg
```

## 7. Perbedaan dari versi lokal

Versi lama memakai:

```text
localhost:11434
Express
memory server untuk history
```

Versi Vercel memakai:

```text
Vercel Functions
Ollama Cloud API
history dikirim dari browser ke function
```

Dengan demikian function tidak membutuhkan proses server yang hidup terus.
