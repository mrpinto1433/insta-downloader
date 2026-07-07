# 📥 Instagram Video Downloader

Ek simple web app — Instagram ka **Reel / Post / IGTV** link paste karo aur video download karo. Next.js par bana hai aur **Vercel** par 1-click deploy hota hai.

## Features
- Link paste → video preview → MP4 download
- Reels, Posts aur IGTV support
- Multiple fallback extraction methods (zyada reliable)
- Server proxy se force download (CORS issue nahi)
- Mobile-friendly UI

## ⚠️ Note
- Sirf **public** posts ke liye kaam karta hai. Private accounts support nahi.
- Instagram apni endpoints change/block karta rehta hai — kabhi kabhi method fail ho sakta hai.
- Copyright material download karna aap ki zimmedari hai.

## Local par chalana
```bash
npm install
npm run dev
# http://localhost:3000 kholein
```

## Vercel par deploy
1. Ye code GitHub repo mein push karein.
2. [vercel.com](https://vercel.com) → **New Project** → GitHub repo import karein.
3. Framework auto-detect (Next.js) → **Deploy** dabayein.
4. Ho gaya! Aapko live URL mil jayega.

Ya CLI se:
```bash
npm i -g vercel
vercel
```

## Kaise kaam karta hai
- `pages/index.js` — frontend (link input + download UI)
- `pages/api/download.js` — Instagram se direct video URL extract karta hai (3 fallback methods)
- `pages/api/file.js` — video ko proxy karke MP4 file force-download karata hai

## Tech
Next.js 14 · React 18 · Vercel serverless functions
