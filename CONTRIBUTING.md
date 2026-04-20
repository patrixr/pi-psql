# Contributing to pi-psql

Thank you for your interest in contributing! This document provides guidelines for contributing to pi-psql.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone git@github.com:patrixr/pi-psql.git
   cd pi-psql
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Make the scripts executable:**
   ```bash
   chmod +x execute-query.js launch-connection-manager.js
   ```

4. **Test locally:**
   ```bash
   ./execute-query.js --help
   ./launch-connection-manager.js
   ```

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with semantic-release.

### Format
```
<type>(<scope>): <subject>
```

### Types
- `feat`: New feature (triggers minor release)
- `fix`: Bug fix (triggers patch release)
- `perf`: Performance improvement (triggers patch release)
- `docs`: Documentation changes (no release)
- `style`: Code style/formatting (no release)
- `refactor`: Code refactoring (no release)
- `test`: Tests (no release)
- `chore`: Maintenance (no release)

### Breaking Changes
Add `!` after type or include `BREAKING CHANGE:` in footer (triggers major release):
```bash
git commit -m "feat!: change connection storage format

BREAKING CHANGE: Existing connections must be re-added"
```

### Examples
```bash
# Patch release (1.0.0 → 1.0.1)
git commit -m "fix: handle timeout on slow connections"

# Minor release (1.0.0 → 1.1.0)
git commit -m "feat: add connection pooling support"

# Major release (1.0.0 → 2.0.0)
git commit -m "feat!: remove deprecated API

BREAKING CHANGE: Old connection format no longer supported"

# No release
git commit -m "docs: update installation instructions"
git commit -m "chore: update dependencies"
```

## Pull Request Process

1. **Create a feature branch:**
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes with conventional commits:**
   ```bash
   git commit -m "feat: add awesome feature"
   git commit -m "test: add tests for awesome feature"
   git commit -m "docs: document awesome feature"
   ```

3. **Push to your fork:**
   ```bash
   git push origin feat/my-feature
   ```

4. **Create Pull Request:**
   - Target branch: `main`
   - Include description of changes
   - Reference any related issues

5. **Automated checks:**
   - Tests must pass
   - Commits should follow conventional format

6. **Merge:**
   - Maintainers will merge when approved
   - semantic-release will automatically version and publish

## Testing

### Manual Testing
```bash
# Test help
./execute-query.js --help

# Test connection manager
./launch-connection-manager.js

# Test core modules
node -e "const core = require('./core'); console.log('OK');"
```

### Future: Automated Tests
We welcome contributions to add automated tests!

## Code Style

- Use consistent formatting
- Keep functions small and focused
- Add comments for complex logic
- Follow existing code patterns

## Documentation

When adding features:
- Update SKILL.md (for AI agents)
- Update README.md (for humans)
- Add examples where helpful
- Update CHANGELOG.md is automatic via semantic-release

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
