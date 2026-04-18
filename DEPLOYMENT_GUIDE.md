# Deployment Guide for GrowthOS AI

If you are deploying this application to Vercel or GitHub Pages, follow these critical steps to ensure the AI tools and Firebase features work correctly.

## 1. Firebase Authentication (Authorized Domains) - **CRITICAL STEP**

Firebase Auth will block login attempts from new domains (like Vercel or GitHub Pages) by default. You MUST do this manually:

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project: `gen-lang-client-0000812465`.
3.  Go to **Authentication** (sidebar) > **Settings** (tab) > **Authorized Domains** (sidebar).
4.  Add your exact production domain:
    *   **Vercel:** `growth-os-ai.vercel.app`
    *   **AI Studio Preview:** `ais-dev-byqoegw6scucd7fp6dxj5o-349495182505.asia-southeast1.run.app`
    *   **GitHub Pages:** `<your-username>.github.io`
    *   **Local Preview:** `localhost`

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

## 4. Troubleshooting Common Issues

### "Not Working" or Loading Indefinitely
*   **Missing API Key:** If tools show an error about missing keys, ensure `GEMINI_API_KEY` is set in your hosting provider's environment variables dashboard **AND** you have redeployed.
*   **Login Fails:** Check if you added the domain to Firebase (Step 1). The app now displays a specific error message on the landing page if this happens.
*   **404 on Refresh:** Since this is a Single Page Application (SPA), refreshing on a page like `/tools` might cause a 404. We have switched to **HashRouter** to fix this. Your URLs will now look like `site.com/#/tools`, which is highly compatible with GitHub Pages.

### Firebase "Database not found"
If you see errors related to Firestore, ensure that you have initialized a Firestore database in your Firebase project and that the database ID matches `ai-studio-fa9cb849-d36c-40ae-b748-05e4aab7e40f`.

### Deployment to GitHub Pages
1. Ensure your repository settings allow GitHub Actions to deploy.
2. Use a standard Vite deployment action. The `vite.config.ts` will handle the subpath automatically.
