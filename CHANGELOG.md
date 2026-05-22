# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
- Added test coverage for Kagi client retry handling and unexpected response shapes.
- Added tool registration tests and representative Kagi response fixtures.
- Added a CI workflow for pull requests and pushes to `master`.
- Improved client logging with safe request metadata.
- Documented the current Kagi request and response assumptions in the README.

## [0.1.0] - Initial preparation
- Initial package files and build configuration

## [0.1.2] - 2026-05-22
- Bumped package version to `0.1.2` and created release tag `v0.1.2`.
- Migrate developer workflow to `pnpm`: added `pnpm-lock.yaml` and `packageManager`.
- Updated CI workflows to use `pnpm` and `pnpm/action-setup` for reproducible installs.
- Updated `README.md` and added `DEVELOPMENT.md` documenting `pnpm` usage.
