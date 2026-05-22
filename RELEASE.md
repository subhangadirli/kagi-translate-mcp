# Release checklist

This document describes the recommended steps to prepare and publish a release.

Prereqs
- A maintainer account with `NPM_TOKEN` saved in GitHub Secrets for publishing.
- A GPG key for signing tags (optional, but recommended).

Local checklist
1. Ensure CI is green on the target branch (`master` or release branch).
2. Update `CHANGELOG.md` with the Unreleased entry and notable changes.
3. Bump `package.json` version (semantic versioning).
   - Example: `npm version patch -m "Release v%s"`
4. Run the full test suite locally:

```bash
npm ci
npm run typecheck
npm run build
npm test
```

5. Verify package contents:

```bash
npm pack --dry-run
```

6. Create an annotated, signed tag (recommended):

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

Publishing
- The repository includes a GitHub Actions workflow (`.github/workflows/publish.yml`) which publishes to npm when a tag matching `v*.*.*` is pushed and `NPM_TOKEN` exists as a secret.
- If you prefer manual publish, create the tarball and `npm publish --access public` with `NODE_AUTH_TOKEN` or `NPM_TOKEN` in environment.

Signing
- To sign the git tag with GPG: `git tag -s vX.Y.Z -m "Release vX.Y.Z"` then push tag.

Post-release
- Confirm package appears on npm and that the tarball contains `dist/`.
- Create a GitHub release and attach release notes derived from `CHANGELOG.md`.
