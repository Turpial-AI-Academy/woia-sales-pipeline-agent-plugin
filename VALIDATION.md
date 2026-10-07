# Validation

This dependency-free thin provider has no repository bootstrap/doctor, checksum
generator or container lanes. Generic manifest, skill, safety and portable archive
checks are owned by Ecosystem v0.5.4 `plugin:certify-thin --repo <path>` against a
clean candidate; do not claim absent tasks were executed.

`pnpm test` runs the provider negative/compatibility tests. `pnpm run ci:fast`
checks the helper syntax and all tests. `pnpm run release:check` requires a clean
tree, whitespace validity and all tests. Official thin certification validates
version, manifests, skills, links, root safety, payload and portable archive and
reruns provider tests. Preserve the native provider MIT license blob unchanged from the published baseline. The audited migrated-provider canonical-license rule does not apply to this native provider.

The tests cover scope, authentication/authority, exact accepted patch, source-map,
revision, UNKNOWN effects, field allowlists, immutable domain references and the
unchanged legacy graph CLI. They do not qualify a live CRM/write adapter, atomic
CAS store, real business authority, Operator E2E or Production Ready.
