# Roadmap

This is a simple to-do list for making kagi-translate-mcp more production-ready.

## To Do

- [ ] Add unit tests for `src/kagi/client.ts` covering non-retryable 4xx errors.
- [ ] Add unit tests for `src/kagi/client.ts` covering retryable 429 and 5xx responses.
- [ ] Add unit tests for `src/kagi/client.ts` covering invalid JSON responses.
- [ ] Add unit tests for `src/kagi/client.ts` covering unexpected response shapes.
- [ ] Add tests for each tool registration module.
- [ ] Confirm input mapping and error formatting in the tool tests.
- [ ] Keep `npm run typecheck` as a required validation step.
- [ ] Run `npm ci`, `npm run typecheck`, and `npm run build` on every pull request.
- [ ] Keep the publish workflow limited to version tags.
- [ ] Add a PR status check so regressions are visible before merge.
- [ ] Add a lightweight lint step if lint rules are introduced.
- [ ] Document the known Kagi request and response fields in `README.md`.
- [ ] Add fixtures for representative Kagi responses.
- [ ] Fail clearly when Kagi returns a new or incompatible payload shape.
- [ ] Review whether the current response schemas are too permissive for production use.
- [ ] Keep structured logging on stderr only.
- [ ] Add request metadata to logs when it helps debugging.
- [ ] Ensure errors keep the original HTTP status and useful API body details.
- [ ] Verify logs stay safe for MCP stdio transport.
- [ ] Add a changelog entry for meaningful behavior changes.
- [ ] Publish from tagged commits only.
- [ ] Verify the package contents before release.
- [ ] Re-run the build and typecheck locally before tagging.
- [ ] Add a smoke test that exercises the built server locally.
- [ ] Add a mock Kagi transport for deterministic integration tests.
- [ ] Expose a small health or version command if the deployment pattern needs it.

## Done

- [x] Core MCP server wiring is in place.
- [x] TypeScript typechecking passes.
- [x] The main retry-handling bug in the Kagi client has been fixed.
