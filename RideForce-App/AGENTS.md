# RideForce Platform Guidelines

## Navigation Pointers
- Spec: `docs/SPEC.md` (architecture, schema, user stories)
- Verification: `scripts/verify.sh` (end-to-end black-box verification)
- Git Root: Parent directory `../` (`software-development`)

## Environment Rules & Gotchas
- **Non-Interactive Tooling**: Prefix Homebrew and CLI package installations with `NONINTERACTIVE=1` to prevent interactive confirmation pauses.
- **Container Health Probes**: In Alpine runtime images, target explicit IPv4 `http://127.0.0.1:<port>` for healthchecks because `localhost` resolves to IPv6 `::1`.
- **Docker API Versioning**: When running Testcontainers on Docker Engine 29+, pass `-Dapi.version=1.44` or configure `~/.testcontainers.properties` with the local Docker socket.
