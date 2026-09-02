# Deployment Guide

This project is automatically deployed to Netlify.

## 🚀 Netlify Configuration

The deployment is configured in `netlify.toml` with the following settings:

### Build Settings

```toml
[build]
  command = "npm run parse-readme && npm run build"
  publish = "dist"
```

**Build Process:**
1. Parse README.md to generate JSON files
2. Build React app with Vite
3. Output to `dist` directory

### Node Version

```toml
[build.environment]
  NODE_VERSION = "20"
```

### SPA Routing

React Router is configured with a redirect rule:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures all routes are handled by React Router.

## 📦 Build Command Explained

```bash
npm run parse-readme && npm run build
```

1. **`npm run parse-readme`** - Generates JSON files from README.md
2. **`npm run build`** - Builds the React app with Vite

## 🔄 Deployment Workflow

### Automatic Deployments

**Production:**
- Triggers on push to `main` branch
- Netlify automatically builds and deploys
- Available at: https://mossaique.netlify.app/

**Preview Deployments:**
- Created for every pull request
- Test changes before merging
- Temporary URL provided in PR comments

### Manual Deployment

You can also trigger manual deployments from Netlify dashboard:
1. Go to https://app.netlify.com
2. Select your site
3. Click "Trigger deploy" → "Deploy site"

## 🔒 Security Headers

The following security headers are configured:

```toml
X-Frame-Options = "DENY"
X-XSS-Protection = "1; mode=block"
X-Content-Type-Options = "nosniff"
Referrer-Policy = "strict-origin-when-cross-origin"
```

## ⚡ Performance

### Asset Caching

Static assets (JS, CSS, images) are cached for 1 year:
```toml
Cache-Control = "public, max-age=31536000, immutable"
```

### JSON Caching

JSON data files are cached for 1 hour with revalidation:
```toml
Cache-Control = "public, max-age=3600, must-revalidate"
```

## 🐛 Troubleshooting

### Build Fails

**Issue:** "npm run parse-readme failed"
- **Solution:** Check README.md format
- **Solution:** Ensure all links have proper format: `[Title](URL): Description`

**Issue:** "npm run build failed"
- **Solution:** Check for TypeScript/linting errors
- **Solution:** Run `npm run build` locally to debug

### Routes Not Working

**Issue:** 404 on direct route access (e.g., `/category/color`)
- **Solution:** Ensure `netlify.toml` has the redirect rule
- **Solution:** Clear Netlify cache and redeploy

### Outdated Content

**Issue:** JSON files not updating
- **Solution:** Ensure GitHub Actions ran successfully
- **Solution:** Manually run `npm run parse-readme` and commit
- **Solution:** Trigger a Netlify rebuild

## 📊 Build Times

Typical build times:
- ⚡ **Parser:** ~2 seconds (24 categories, 292 resources)
- 🏗️ **Vite Build:** ~10-15 seconds
- ✅ **Total:** ~15-20 seconds

## 🔗 Useful Links

- **Live Site:** https://mossaique.netlify.app/
- **Netlify Dashboard:** https://app.netlify.com/sites/mossaique
- **GitHub Repository:** https://github.com/selfishprimate/mossaique
- **GitHub Actions:** https://github.com/selfishprimate/mossaique/actions

## 💡 Tips

1. **Preview Deployments:** Use pull requests to preview changes before merging
2. **Deploy Notifications:** Enable Slack/Discord notifications in Netlify settings
3. **Environment Variables:** Add in Netlify dashboard if needed (none required currently)
4. **Custom Domain:** Configure in Netlify DNS settings if you have one
5. **Analytics:** Enable Netlify Analytics for traffic insights

---

**Questions?** Check the Netlify documentation or open an issue on GitHub.
