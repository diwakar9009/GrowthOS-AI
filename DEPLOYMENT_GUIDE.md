# Deployment Guide for GrowthOS AI

If you are deploying this application to Vercel or GitHub Pages, follow these critical steps to ensure the AI tools and Firebase features work correctly.

## 1. Firebase Authentication (Authorized Domains)

Firebase Auth will block login attempts from new domains (like Vercel or GitHub Pages) by default.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project: `gen-lang-client-0000812465`.
3.  Go to **Authentication** > **Settings** > **Authorized Domains**.
4.  Add your production domains:
    *   `growth-os-ai.vercel.app` (or your specific Vercel URL)
    *   `<your-username>.github.io` (if using GitHub Pages)

## 2. API Key Configuration (Vercel)

The AI tools require the `GEMINI_API_KEY` to be available during the build process.

1.  Go to your project on the [Vercel Dashboard](https://vercel.com).
2.  Navigate to **Settings** > **Environment Variables**.
3.  Add a new variable:
    *   **Key:** `GEMINI_API_KEY`
    *   **Value:** `[Your Gemini API Key]`
4.  **Important:** After adding the variable, you must trigger a **New Deployment** (Redeploy) for the key to be baked into the application.

## 3. GitHub Pages (Base Path)

The `vite.config.ts` has been updated to automatically detect your GitHub repository name and set the correct base path. If your site assets (CSS/JS) are not loading on GitHub Pages, ensure that:
1.  Your GitHub Action or deployment script is running `npm run build`.
2.  The `dist` folder is being deployed.

## 4. Environment Check

If the tools are still not working, check the browser console (F12).
*   If you see `API Key is missing`, follow Step 2.
*   If you see `Firebase: Error (auth/unauthorized-domain)`, follow Step 1.
