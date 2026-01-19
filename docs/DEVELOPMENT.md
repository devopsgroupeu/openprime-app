# OpenPrime App - Automated Development Workflow

## 🎯 Overview

This project uses automated tooling for:

- ✅ **Conventional Commits** - Standardized commit messages
- ✅ **Automated Versioning** - Semantic versioning based on commits
- ✅ **Changelog Generation** - Auto-generated CHANGELOG.md
- ✅ **GitHub Releases** - Automatic release creation with notes
- ✅ **Pre-commit Hooks** - Code quality checks before commits
- ✅ **CI/CD** - Automated testing, building, and Docker publishing

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Pre-commit Hooks

```bash
# Install pre-commit (Python required)
pip install pre-commit

# Install git hooks
pre-commit install --hook-type commit-msg
pre-commit install --hook-type pre-commit
```

### 3. Make Your First Commit

```bash
# Use interactive commit helper
npm run commit

# Or manually with conventional format
git commit -m "feat: add new feature"
```

---

## 📝 Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Description             | Version Bump      | Example                            |
| ---------- | ----------------------- | ----------------- | ---------------------------------- |
| `feat`     | New feature             | **MINOR** (0.x.0) | `feat: add user authentication`    |
| `fix`      | Bug fix                 | **PATCH** (0.0.x) | `fix: resolve login timeout issue` |
| `perf`     | Performance improvement | **PATCH**         | `perf: optimize database queries`  |
| `docs`     | Documentation only      | **PATCH**         | `docs: update API documentation`   |
| `refactor` | Code refactoring        | **PATCH**         | `refactor: simplify auth logic`    |
| `build`    | Build system changes    | **PATCH**         | `build: upgrade webpack to v5`     |
| `ci`       | CI/CD changes           | No release        | `ci: add codecov integration`      |
| `test`     | Adding/updating tests   | No release        | `test: add unit tests for auth`    |
| `chore`    | Other changes           | No release        | `chore: update dependencies`       |
| `revert`   | Revert previous commit  | **PATCH**         | `revert: undo feature X`           |

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or `!` after type/scope for **MAJOR** version bump:

```bash
feat!: redesign authentication system

BREAKING CHANGE: Old auth tokens are no longer valid
```

### Examples

```bash
# Feature with scope
feat(auth): add OAuth2 authentication

# Bug fix
fix: correct calculation in pricing component

# Documentation
docs: add deployment guide to README

# Breaking change (MAJOR version bump)
feat!: migrate to React 19

BREAKING CHANGE: React 18 is no longer supported
```

---

## 🛠️ Available Scripts

### Development

```bash
npm start           # Start development server
npm test            # Run tests in watch mode
npm run build       # Create production build
```

### Code Quality

```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors
npm run format      # Format code with Prettier
npm run format:check # Check code formatting
```

### Commits

```bash
npm run commit      # Interactive commit helper (Commitizen)
```

### Release (CI/CD only)

```bash
npm run semantic-release  # Run semantic release (GitHub Actions)
```

---

## 🔄 Automated Workflows

### On Pull Request

**Workflow**: `.github/workflows/ci.yml`

1. ✅ **Lint & Test**
   - Format validation
   - ESLint checks
   - Unit tests with coverage
   - Build verification

2. ✅ **PR Title Validation**
   - Ensures PR titles follow conventional commits
   - Example: `feat: add new dashboard component`

### On Push to `main` or `dev`

**Workflow**: `.github/workflows/release.yml`

1. ✅ **Test & Build**
   - Run full test suite
   - Build production bundle

2. ✅ **Semantic Release**
   - Analyze commits since last release
   - Determine version bump (major/minor/patch)
   - Generate CHANGELOG.md
   - Create GitHub release with notes
   - Tag repository with version

3. ✅ **Docker Build & Push**
   - Build multi-platform Docker image (amd64, arm64)
   - Push to GitHub Container Registry
   - Tag with version and `latest`

---

## 🔒 Pre-commit Hooks

**Framework**: Python `pre-commit` (configured in `.pre-commit-config.yaml`)

### Automatic Checks

1. **Code Quality**
   - Remove trailing whitespace
   - Fix end-of-file issues
   - Validate YAML/JSON syntax
   - Check for large files
   - Detect private keys/AWS credentials

2. **Formatting**
   - Prettier for JS/JSX/JSON/CSS/Markdown
   - Auto-format on commit

3. **Linting**
   - ESLint for JavaScript/React code
   - Auto-fix where possible

4. **Commit Message**
   - Commitlint validates conventional commit format
   - Rejects non-compliant messages

### Update Hooks

```bash
# Update to latest versions
pre-commit autoupdate

# Run manually on all files
pre-commit run --all-files
```

---

## 📦 Release Process

### Automatic (Recommended)

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make commits: `npm run commit` or `git commit -m "feat: ..."`
3. Push and create PR
4. Merge to `main` → **Automated release triggers**

### What Happens Automatically

```
Commits → Semantic Release → Version Bump → CHANGELOG → GitHub Release → Docker Image
```

### Version Examples

```bash
# Current version: 1.2.3

# Patch release (1.2.4)
fix: resolve navigation bug

# Minor release (1.3.0)
feat: add dark mode support

# Major release (2.0.0)
feat!: redesign entire UI

BREAKING CHANGE: Old theme system removed
```

---

## 🏷️ Versioning Strategy

Following [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
  2  .  1  .  0

MAJOR: Breaking changes (feat! or BREAKING CHANGE:)
MINOR: New features (feat:)
PATCH: Bug fixes, docs, refactors (fix:, docs:, refactor:, etc.)
```

### Branch Strategy

- `main` - Production releases (stable)
- `dev` - Development releases (pre-release/beta)
- `feature/*` - Feature branches

---

## 📚 Configuration Files

| File                            | Purpose                        |
| ------------------------------- | ------------------------------ |
| `.releaserc.json`               | Semantic Release configuration |
| `.commitlintrc.json`            | Commit message linting rules   |
| `.prettierrc.json`              | Code formatting rules          |
| `.prettierignore`               | Files to skip formatting       |
| `.pre-commit-config.yaml`       | Pre-commit hooks configuration |
| `.github/workflows/release.yml` | Automated release workflow     |
| `.github/workflows/ci.yml`      | PR validation workflow         |

---

## 🐛 Troubleshooting

### Pre-commit hooks not running

```bash
# Reinstall hooks
pre-commit uninstall
pre-commit install --hook-type commit-msg
pre-commit install --hook-type pre-commit
```

### Commit message rejected

Ensure your commit follows conventional commits:

```bash
# ❌ Wrong
git commit -m "Added new feature"

# ✅ Correct
git commit -m "feat: add user profile page"
```

### Skip CI on a commit

```bash
git commit -m "chore: update docs [skip ci]"
```

---

## 📖 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Pre-commit Framework](https://pre-commit.com/)
- [Commitlint](https://commitlint.js.org/)
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)

---

## 🎉 Benefits

✅ **No manual versioning** - Automated based on commits
✅ **Consistent commit history** - Enforced conventional commits
✅ **Auto-generated changelogs** - Always up-to-date
✅ **GitHub integration** - Releases, tags, and notes
✅ **Code quality** - Pre-commit checks prevent bad code
✅ **CI/CD pipeline** - Test, build, and deploy automatically
✅ **Docker automation** - Tagged images for every release
