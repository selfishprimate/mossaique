# Submit Feature Setup Guide

This guide explains how to set up the automated resource submission feature that creates pull requests via the website.

## Features

- ✅ Submit form modal on the website
- ✅ Automated PR creation to GitHub
- ✅ Category selection
- ✅ Optional submitter credit (name, GitHub username) - email is intentionally not collected, because PR bodies are public
- ✅ No manual GitHub access needed for users

## Setup Steps

### 1. Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → [Tokens (classic)](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Name it: `Curated Design Resources - PR Bot`
4. Set expiration: **No expiration** (or choose a long duration)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
     - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`

6. Click **"Generate token"**
7. **IMPORTANT**: Copy the token immediately (you won't be able to see it again!)

### 2. Add Token to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your **mossaique** site
3. Go to **Site settings** → **Environment variables**
4. Click **"Add a variable"**
5. Add:
   - **Key**: `GITHUB_TOKEN`
   - **Value**: Paste your GitHub token
   - **Scopes**: Select "All scopes" or choose specific deploy contexts

6. Click **"Save"**

### 3. Deploy

Once you've added the environment variable:

1. Push your code to GitHub
2. Netlify will automatically deploy
3. The submit form will now work!

## How It Works

```
User submits form
       ↓
Netlify Function receives data
       ↓
GitHub API:
  1. Creates new branch
  2. Updates README.md
  3. Creates Pull Request
       ↓
You review & merge PR
       ↓
Parse script runs automatically
       ↓
Resource appears on website
```

## Testing Locally

To test the function locally (optional):

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run dev server with functions
netlify dev
```

Set environment variable for local testing:
```bash
# Create .env file
echo "GITHUB_TOKEN=your_token_here" > .env
```

**Note**: Don't commit `.env` file to Git! It's already in `.gitignore`.

## Troubleshooting

### Token expired
- Generate a new token and update it in Netlify environment variables

### PR not created
- Check Netlify Function logs: Site settings → Functions → Logs
- Verify token has `repo` scope
- Ensure token hasn't expired

### Category not found
- Check that category ID matches those in `categories.js`
- Verify README.md has proper category headers

## Security Notes

- ✅ Token is stored securely in Netlify (not in code)
- ✅ Function only accepts POST requests
- ✅ Form validation prevents empty submissions
- ✅ All PRs require your manual review before merging
- ✅ Submitter information is optional

## Support

If you encounter issues, check:
1. Netlify Function logs
2. GitHub token permissions
3. README.md format matches expected structure

---

**Ready to go!** Users can now submit resources directly from the website. 🎉
