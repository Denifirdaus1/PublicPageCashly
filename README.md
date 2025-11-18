# PublicPageCashly

Dashboard Next.js untuk menampilkan tabungan kelompok dari Supabase tanpa login/CRUD. Data dibaca langsung via anon key sehingga selalu terbaru di deployment serverless (Vercel).

## Environment

Salin `.env.local.example` ke `.env.local` dan isi kredensial Supabase:

```bash
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_KEY` (anon/publishable)

## Jalankan lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000 untuk melihat dashboard (responsif mobile/desktop).

## Build & lint

```bash
npm run lint
npm run build
```

## Deploy

- Gunakan tombol "Deploy to Vercel" atau hubungkan repo ke Vercel.
- Set environment variables yang sama di Project Settings → Environment Variables.
