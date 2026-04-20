# Publishing to npm

This repository uses **npm Trusted Publishing** (recommended) or classic npm tokens.

## Setup Method 1: Trusted Publishing (Recommended)

No secrets needed! Uses GitHub's OIDC to authenticate.

### First-time Setup

1. **Do initial manual publish:**
   ```bash
   cd ~/Code/pi-psql
   npm login
   npm publish
   ```

2. **Enable Trusted Publishing on npm:**
   - Go to: https://www.npmjs.com/package/pi-psql/access
   - Click "Publishing" tab
   - Enable "Require two-factor authentication or automation tokens to publish"
   - Under "Automation", click "Add GitHub Actions"
   - Fill in:
     - **Repository:** `patrixr/pi-psql`
     - **Workflow:** `publish.yml`
     - **Environment:** (leave blank)
   - Click "Add"

3. **Done!** Future publishes will use OIDC automatically.

### How to Publish (with Trusted Publishing)

```bash
# Update version
npm version patch  # or minor/major

# Push tags
git push --follow-tags

# Create GitHub release
# Go to: https://github.com/patrixr/pi-psql/releases/new
# The workflow will automatically publish to npm via OIDC
```

---

## Setup Method 2: Classic NPM Token (Fallback)

If Trusted Publishing doesn't work, use a classic token.

### Setup

1. **Get an npm automation token:**
   ```bash
   npm login
   npm token create --cidr=0.0.0.0/0
   ```
   
2. **Add the token to GitHub:**
   - Go to: https://github.com/patrixr/pi-psql/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: (paste your npm token)
   - Click "Add secret"

### How to Publish (with Token)

Same as above - the workflow will use the token if Trusted Publishing isn't set up.

---

## Publishing Process

### Via GitHub Release (Recommended)

1. Update version:
   ```bash
   npm version patch  # or minor, or major
   git push --follow-tags
   ```

2. Create release:
   - Go to: https://github.com/patrixr/pi-psql/releases/new
   - Select the tag you just pushed
   - Add release notes
   - Click "Publish release"

3. Workflow automatically:
   - Runs tests
   - Publishes to npm
   - Creates summary

### Manual Workflow Dispatch

1. Go to: https://github.com/patrixr/pi-psql/actions/workflows/publish.yml
2. Click "Run workflow"
3. Optionally specify version
4. Click "Run workflow"

---

## Verify Publication

- npm: https://www.npmjs.com/package/pi-psql
- Install: `pi install npm:pi-psql`

---

## Troubleshooting

### "403 Forbidden" with Trusted Publishing

**Cause:** Trusted Publishing not configured on npm

**Fix:**
1. Go to https://www.npmjs.com/package/pi-psql/access
2. Add GitHub Actions automation (see setup above)

### "401 Unauthorized" 

**Cause:** No NPM_TOKEN and Trusted Publishing not set up

**Fix:** Choose one:
- Set up Trusted Publishing (recommended)
- Add NPM_TOKEN secret

### "npm ERR! need auth" with 2FA

**Cause:** Using classic token with 2FA required

**Fix:** Use Trusted Publishing instead (no 2FA issues)

### "You cannot publish over previously published versions"

**Cause:** Version already exists

**Fix:** Update version in `package.json`:
```bash
npm version patch
```
