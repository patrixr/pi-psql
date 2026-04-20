# Publishing to npm

This repository uses **semantic-release** with conventional commits for automated versioning and publishing.

## How It Works

1. **Commit with conventional format** (see below)
2. **Push to main** branch
3. **semantic-release automatically:**
   - Analyzes commits since last release
   - Determines version bump (patch/minor/major)
   - Updates package.json and CHANGELOG.md
   - Creates git tag
   - Publishes to npm
   - Creates GitHub release

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

### Patch Release (1.0.0 → 1.0.1)
```bash
git commit -m "fix: resolve connection timeout issue"
git commit -m "perf: improve query execution speed"
```

### Minor Release (1.0.0 → 1.1.0)
```bash
git commit -m "feat: add support for connection pooling"
git commit -m "feat(query): add --explain flag for query plans"
```

### Major Release (1.0.0 → 2.0.0)
```bash
git commit -m "feat!: remove deprecated cli.js interface

BREAKING CHANGE: The cli.js interface has been removed. Use launch-connection-manager.js instead."
```

Or use the footer:
```bash
git commit -m "feat: redesign connection storage

BREAKING CHANGE: Connection format changed, requires re-adding connections"
```

### Other Types (no release)
```bash
git commit -m "docs: update README examples"
git commit -m "chore: update dependencies"
git commit -m "style: fix code formatting"
git commit -m "refactor: simplify crypto module"
git commit -m "test: add integration tests"
git commit -m "ci: update workflow permissions"
```

## Publishing Process

### 1. Make Changes
```bash
# Work on your feature
git checkout -b feat/my-feature

# Make commits with conventional format
git commit -m "feat: add new awesome feature"
git commit -m "fix: handle edge case in query parser"
git commit -m "docs: update feature documentation"
```

### 2. Merge to Main
```bash
# Push feature branch
git push origin feat/my-feature

# Create PR and merge to main
# OR merge directly if you prefer
git checkout main
git merge feat/my-feature
git push origin main
```

### 3. Automatic Release
The release workflow will:
1. Analyze commits: `feat` → minor, `fix` → patch, `BREAKING CHANGE` → major
2. Determine new version (e.g., 1.2.0 → 1.3.0)
3. Update package.json to 1.3.0
4. Generate CHANGELOG.md entry
5. Commit changes: `chore(release): 1.3.0 [skip ci]`
6. Create tag: `v1.3.0`
7. Publish to npm
8. Create GitHub release with changelog

### 4. Verify
- npm: https://www.npmjs.com/package/pi-psql
- GitHub: https://github.com/patrixr/pi-psql/releases
- Install: `pi install npm:pi-psql@latest`

## Examples

### Bug Fix Release
```bash
git commit -m "fix: prevent duplicate connections in list"
git push origin main
# → 1.0.0 → 1.0.1
```

### Feature Release
```bash
git commit -m "feat: add connection health check command"
git push origin main
# → 1.0.1 → 1.1.0
```

### Breaking Change Release
```bash
git commit -m "feat!: rename server.js to launch-connection-manager.js

BREAKING CHANGE: Users must update scripts to use new filename"
git push origin main
# → 1.1.0 → 2.0.0
```

### Multiple Changes
```bash
git commit -m "feat: add connection timeout option"
git commit -m "fix: handle SSL certificate validation"
git commit -m "docs: add timeout configuration example"
git push origin main
# → Combines all, creates minor release (feat takes precedence)
# → 2.0.0 → 2.1.0
```

## Setup (One-time)

### npm Trusted Publishing (Recommended)

1. **First publish** (if not done):
   ```bash
   npm login
   npm publish
   ```

2. **Enable Trusted Publishing:**
   - Go to: https://www.npmjs.com/package/pi-psql/access
   - Click "Publishing" tab
   - Enable "Require two-factor authentication or automation tokens to publish"
   - Under "Automation", click "Add GitHub Actions"
   - Repository: `patrixr/pi-psql`
   - Workflow: `release.yml`
   - Environment: (leave blank)

3. **Done!** No NPM_TOKEN secret needed.

### Classic Token (Fallback)

If Trusted Publishing doesn't work:

1. Create automation token:
   ```bash
   npm login
   npm token create --cidr=0.0.0.0/0
   ```

2. Add to GitHub:
   - Go to: https://github.com/patrixr/pi-psql/settings/secrets/actions
   - Add secret: `NPM_TOKEN`

## Commit Message Guidelines

### Structure
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature → minor release
- `fix`: Bug fix → patch release
- `perf`: Performance improvement → patch release
- `docs`: Documentation only → no release
- `style`: Formatting, missing semicolons → no release
- `refactor`: Code restructuring → no release
- `test`: Adding tests → no release
- `chore`: Maintenance → no release
- `ci`: CI/CD changes → no release

### Breaking Changes
Add `!` after type or `BREAKING CHANGE:` in footer → major release

### Scopes (optional)
Examples: `feat(core):`, `fix(query):`, `feat(ui):`

## Skipping Release

To commit without triggering a release:
```bash
git commit -m "chore: update dev dependencies [skip ci]"
```

Or use non-releasing types: `docs`, `chore`, `style`, `refactor`, `test`, `ci`

## Manual Release Trigger

Trigger release manually:
1. Go to: https://github.com/patrixr/pi-psql/actions/workflows/release.yml
2. Click "Run workflow"
3. Select branch: `main`
4. Click "Run workflow"

## Troubleshooting

### "Nothing to release"

**Cause:** No releasable commits since last release

**Fix:** Make sure commits use conventional format:
- ✅ `feat: add feature`
- ✅ `fix: bug fix`
- ❌ `added feature` (no type prefix)

### "Cannot push to protected branch"

**Cause:** semantic-release needs write permissions

**Fix:** Already configured in workflow (`contents: write`)

### "403 Forbidden" publishing to npm

**Cause:** Trusted Publishing not configured or NPM_TOKEN missing

**Fix:** See Setup section above

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [semantic-release](https://github.com/semantic-release/semantic-release)
- [Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
