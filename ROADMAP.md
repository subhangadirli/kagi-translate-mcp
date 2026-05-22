# Roadmap

This is a simple to-do list for making kagi-translate-mcp more production-ready.

## To Do

- None — all planned hardening tasks completed in this branch. See **Done** below for details.

## Done

- [x] Core MCP server wiring is in place.
- [x] TypeScript typechecking passes.
- [x] The main retry-handling bug in the Kagi client has been fixed.
- [x] Add unit tests for `src/kagi/client.ts` covering non-retryable 4xx errors.
- [x] Add unit tests for `src/kagi/client.ts` covering retryable 429 and 5xx responses.
- [x] Add unit tests for `src/kagi/client.ts` covering invalid JSON responses.
- [x] Add unit tests for `src/kagi/client.ts` covering unexpected response shapes.
- [x] Add tests for each tool registration module.
- [x] Confirm input mapping and error formatting in the tool tests.
- [x] Run `npm ci`, `npm run typecheck`, and `npm run build` on every pull request.
- [x] Add a PR status check so regressions are visible before merge.
- [x] Keep the publish workflow limited to version tags.
- [x] Document the known Kagi request and response fields in `README.md`.
- [x] Add fixtures for representative Kagi responses.
- [x] Ensure errors keep the original HTTP status and useful API body details.
- [x] Fail clearly when Kagi returns a new or incompatible payload shape.
- [x] Keep structured logging on stderr only.
- [x] Add request metadata to logs when it helps debugging.
- [x] Verify logs stay safe for MCP stdio transport.
- [x] Add a changelog entry for meaningful behavior changes.
- [x] Publish from tagged commits only.
- [x] Verify the package contents before release.
- [x] Re-run the build and typecheck locally before tagging.
- [x] Add a smoke test that exercises the built server locally.
- [x] Add a mock Kagi transport for deterministic integration tests.
- [x] Expose a small health or version command if the deployment pattern needs it.

## Next Steps

- [ ] Enforce lint failures in CI (remove `|| true` and fix reported issues).
- [ ] Run `npm audit` and upgrade vulnerable dependencies; update lockfile.
- [ ] Add deterministic integration tests using an HTTP mock Kagi server.
 - [x] Add deterministic integration tests using an HTTP mock Kagi server.
- [ ] Harden and tighten zod schemas; add unit tests asserting failures for bad shapes.
- [x] Harden and tighten zod schemas; add unit tests asserting failures for bad shapes.
- [ ] Add runtime health, metrics (Prometheus), and structured logging export.
- [ ] Document release checklist, signing, and secure publish steps.
- [ ] Add vulnerability scans and CI gating (Dependabot, Snyk, CodeQL).
- [ ] Add container image build and deployment smoke tests.
