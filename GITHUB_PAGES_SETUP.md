# GitHub Pages Setup Instructions

## ⚠️ CRITICAL: Enable GitHub Pages First

**You MUST enable GitHub Pages in your repository settings BEFORE the workflow can run.**

## Prerequisites

1. **Repository must be Public** (for free GitHub accounts)
   - Go to Settings → General → Danger Zone
   - If private, change to Public (free accounts can't use Pages on private repos)

2. **You must be the repository owner** or have admin access

## Step-by-Step Instructions

### Step 1: Make Repository Public (if needed)

1. Go to: https://github.com/lakshmi200128/Legal-Template-Chatfill/settings
2. Scroll to "Danger Zone"
3. If repository is private, click "Change visibility" → "Make public"

### Step 2: Enable GitHub Pages

1. **Go to your repository Settings:**
   - Visit: https://github.com/lakshmi200128/Legal-Template-Chatfill/settings/pages

2. **Configure GitHub Pages:**
   - Scroll down to the **"Pages"** section (in the left sidebar)
   - Under **"Build and deployment"**:
     - **Source:** Select **"GitHub Actions"** (NOT "Deploy from a branch")
     - Click **"Save"**

3. **Verify Pages is enabled:**
   - You should see "Your site is ready to be published" or a confirmation
   - The Pages section should show "GitHub Actions" as the source
   - You should see a green checkmark or "Enabled" status

### Step 2: Run the Workflow

After enabling Pages, you can:

1. **Automatic:** The workflow will run automatically on the next push to `main`
2. **Manual:** Go to the **Actions** tab → Select **"Deploy to GitHub Pages"** → Click **"Run workflow"**

### Step 3: Access Your Site

Once the workflow completes successfully, your site will be available at:
- **URL:** `https://lakshmi200128.github.io/Legal-Template-Chatfill/`

## Troubleshooting

### Error: "Get Pages site failed" or "Not Found"

**Cause:** GitHub Pages is not enabled in repository settings.

**Solution:**
1. Go to Settings → Pages
2. Select "GitHub Actions" as the source
3. Click Save
4. Run the workflow again

### Error: "Resource not accessible by integration"

**Cause:** The workflow doesn't have permission to enable Pages automatically.

**Solution:**
- Enable Pages manually in Settings (as described above)
- The workflow cannot auto-enable Pages due to GitHub's permission system

### Workflow Runs But Site Doesn't Work

**Important:** This app has API routes that require server-side processing. GitHub Pages only serves static files, so:
- ✅ The UI will load
- ❌ Upload functionality will NOT work
- ❌ Download functionality will NOT work

**Solution:** Deploy to Vercel instead for full functionality (see `DEPLOYMENT.md`)

## Quick Links

- **Repository Settings:** https://github.com/lakshmi200128/Legal-Template-Chatfill/settings
- **Pages Settings:** https://github.com/lakshmi200128/Legal-Template-Chatfill/settings/pages
- **Actions:** https://github.com/lakshmi200128/Legal-Template-Chatfill/actions

