# Publishing to npm

This repository is configured to automatically publish to npm when you create a GitHub release.

## Setup (One-time)

1. **Get an npm token:**
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

## How to Publish

### Option 1: Create a GitHub Release (Recommended)

1. Update version in `package.json`:
   ```bash
   npm version patch  # or minor, or major
   ```

2. Push the tag:
   ```bash
   git push --follow-tags
   ```

3. Create a GitHub release:
   - Go to: https://github.com/patrixr/pi-psql/releases/new
   - Select the tag you just pushed
   - Add release notes
   - Click "Publish release"

4. The workflow will automatically:
   - Run tests
   - Publish to npm
   - Create a summary with installation instructions

### Option 2: Manual Workflow Dispatch

1. Go to: https://github.com/patrixr/pi-psql/actions/workflows/publish.yml

2. Click "Run workflow"

3. Optionally specify a version (or leave empty to use current `package.json` version)

4. Click "Run workflow"

## Verify Publication

After publishing, verify at:
- npm: https://www.npmjs.com/package/pi-psql
- Installation: `pi install npm:pi-psql`

## Troubleshooting

**"401 Unauthorized"** - NPM_TOKEN is invalid or missing
- Regenerate token: `npm token create --cidr=0.0.0.0/0`
- Update GitHub secret

**"403 Forbidden"** - Package name already taken or you don't have access
- Check package name in `package.json`
- Verify npm account has publish rights

**"You cannot publish over the previously published versions"**
- Update version in `package.json` before publishing
