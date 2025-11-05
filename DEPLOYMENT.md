# Deployment Guide

## ⚠️ Important: GitHub Pages Limitations

**GitHub Pages only serves static files and does NOT support Next.js API routes.**

This application has API routes (`/api/upload` and `/api/download`) that require server-side processing. These will **NOT work** on GitHub Pages.

### Recommended: Deploy to Vercel

Vercel is the recommended platform for Next.js applications and fully supports:
- ✅ Server-side API routes
- ✅ Automatic deployments from GitHub
- ✅ Free tier with excellent performance
- ✅ Built-in CDN and edge functions

#### Quick Deploy to Vercel:

1. **Push your code to GitHub** (already done!)

2. **Go to [Vercel](https://vercel.com)** and sign in with GitHub

3. **Import your repository:**
   - Click "Add New..." → "Project"
   - Select `lakshmi200128/Legal-Template-Chatfill`
   - Click "Import"

4. **Configure project:**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)
   - Install Command: `npm install`

5. **Environment Variables (if needed):**
   - Add `NEXT_DISABLE_TURBO=1` if you encounter build issues

6. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app
   - You'll get a URL like: `https://legal-template-chatfill.vercel.app`

### Alternative: GitHub Pages (Limited Functionality)

If you still want to use GitHub Pages, you'll need to:

1. **Enable GitHub Pages in repository settings:**
   - Go to: https://github.com/lakshmi200128/Legal-Template-Chatfill/settings/pages
   - Under "Build and deployment":
     - Source: Select **"GitHub Actions"**
     - Click **Save**
   - The workflow will automatically enable Pages if needed

2. **The workflow will run automatically** on every push to `main` branch

3. **Your site will be available at:**
   - `https://lakshmi200128.github.io/Legal-Template-Chatfill/`

4. **⚠️ Important Limitation:** The upload and download features will NOT work because API routes require server-side processing. Only the static UI will work.

**⚠️ Important Setup Steps:**

1. **You MUST enable GitHub Pages manually first** (the workflow cannot do this automatically):
   - Go to: https://github.com/lakshmi200128/Legal-Template-Chatfill/settings/pages
   - Under "Build and deployment":
     - Source: Select **"GitHub Actions"**
     - Click **Save**
   
2. **After enabling Pages**, the workflow will run on the next push

3. **If you see "Resource not accessible by integration" error:**
   - This means Pages is not enabled yet
   - Go to Settings → Pages and enable it manually
   - The workflow cannot auto-enable Pages due to permissions

**Note:** This app has API routes which won't work on GitHub Pages. For full functionality, use Vercel instead.

### Other Deployment Options

- **Netlify:** Similar to Vercel, supports Next.js with API routes
- **Railway:** Good for full-stack Next.js apps
- **Render:** Supports Next.js with serverless functions
- **AWS Amplify:** Enterprise-grade hosting with Next.js support

## Current Status

✅ Repository is on GitHub: https://github.com/lakshmi200128/Legal-Template-Chatfill  
⏳ Ready for deployment to Vercel (recommended)

