# Build & Dev Guide

## Quick Reference

```bash
pnpm dev              # Full Electron desktop app (dev mode)
pnpm dev:ui           # Vite UI only → http://localhost:5173
pnpm build            # Build server + UI for Electron packaging
pnpm test:e2e         # Run end-to-end tests
pnpm typecheck        # TypeScript type-check app package
```

---

## Prerequisites

| Dependency | Minimum Version | Check |
|-----------|----------------|-------|
| Node.js | — | `node --version` |
| pnpm | 10.27.0 | `pnpm --version` |
| Bun | 1.3.9 | `bun --version` |
| Rust + Cargo | stable | `rustc --version` |
| Tauri CLI | — | `cargo tauri --version` |
| OpenCode CLI | — | `opencode version` |

### Platform-specific

- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux**: WebKitGTK 4.1 dev (`pkg-config --libs webkit2gtk-4.1`)
  ```bash
  # Arch
  sudo pacman -S --needed webkit2gtk-4.1
  # Ubuntu/Debian
  sudo apt install libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev
  ```

### One-time setup

```bash
git checkout dev
git pull --ff-only origin dev
pnpm install
```

---

## Running Dev Versions

### Full desktop app (Electron)

```bash
pnpm dev
```

This single command:
1. Prepares sidecar binaries and helpers
2. Builds `openwork-server` (TypeScript → JS)
3. Starts the Vite dev server on `http://localhost:5173`
4. Launches Electron with `OPENWORK_DEV_MODE=1`

Dev mode uses an isolated OpenCode state directory (`~/.openwork/openwork-orchestrator-dev/`) so your personal OpenCode config is untouched.

**Custom port:** `PORT=3000 pnpm dev`

**CDP debugging:** `OPENWORK_ELECTRON_REMOTE_DEBUG_PORT=9823 pnpm dev` — exposes Chrome DevTools Protocol at `http://127.0.0.1:9823`

### UI only (browser)

```bash
pnpm dev:ui
```

Runs the Vite dev server without Electron. Open `http://localhost:5173` in any browser.

Note: this only serves the UI. It needs a running server to connect to — use `pnpm dev` for the full stack or point it at an existing server.

### UI component demo

```bash
pnpm dev:ui-demo
```

Isolated component library at `http://localhost:3333`.

### Den stack (backend services)

```bash
# Full local Den stack (MySQL + API + Web + Worker Proxy + Inference)
pnpm dev:den

# Individual services
pnpm dev:den:api       # Den API → port 8790
pnpm dev:den:web       # Den Web → port 3005
pnpm dev:den:inference # Inference → port 8791
```

Requires Docker for MySQL.

### Two-instance Electron demo

```bash
pnpm dev:electron:two
```

Spawns two Electron windows — one admin, one consumer — for testing Den multi-user flows.

### Headless web dev

```bash
pnpm dev:headless-web
```

Web-only dev mode with the orchestrator.

---

## Building Binaries

### Desktop app (packaged Electron)

```bash
# Build all prerequisites (server + UI)
pnpm build

# Package into a distributable binary
pnpm --filter @openwork/desktop package:electron
```

Outputs to `apps/desktop/dist-electron/`:
| OS | Format | Filename |
|----|--------|----------|
| macOS | `.dmg`, `.zip` | `openwork-darwin-{arch}-{version}.{dmg,zip}` |
| Linux | `.AppImage`, `.tar.gz` | `openwork-linux-{arch}-{version}.{AppImage,tar.gz}` |
| Windows | `.exe` (NSIS) | `openwork-win32-{arch}-{version}.exe` |

**Unpacked build** (for testing without packaging):
```bash
pnpm --filter @openwork/desktop package:electron:dir
```

### CLI binaries

These produce single-file compiled binaries (via `bun build --compile`). Each supports cross-compilation for all platforms.

```bash
# Server binary
pnpm --filter openwork-server build:bin
# → apps/server/dist/bin/openwork-server

# Orchestrator binary (the `openwork` CLI)
pnpm --filter openwork-orchestrator build:bin
# → apps/orchestrator/dist/bin/openwork

# OpenCode router binary (Slack/Telegram bridge)
pnpm --filter opencode-router build:bin
# → apps/opencode-router/dist/bin/opencode-router
```

**Cross-platform builds** (all targets: darwin-arm64/x64, linux-x64/arm64, windows-x64):
```bash
pnpm --filter openwork-server build:bin:all
pnpm --filter openwork-orchestrator build:bin:all
pnpm --filter opencode-router build:bin:all
```

### UI build only (static assets)

```bash
pnpm build:ui
# → apps/app/dist/  (index.html, overlay.html, bundled JS/CSS)
```

When building for Electron embedding, the script sets `OPENWORK_ELECTRON_BUILD=1` so Vite emits relative paths (`./assets/...`) instead of absolute paths.

### Den Web build

```bash
pnpm build:web
# → ee/apps/den-web/.next/
```

---

## Build Pipeline Details

### What `pnpm build` does

The root `build` script runs `node scripts/build.mjs`, which effectively runs `pnpm --filter @openwork/desktop build`. That in turn runs `electron-build.mjs` which:

1. Prepares sidecar binaries (`prepare-sidecar.mjs`)
2. Prepares computer-use helpers (`prepare-computer-use-helper.mjs`)
3. Builds `openwork-server` (TypeScript compile)
4. Builds `@openwork/app` with `OPENWORK_ELECTRON_BUILD=1` (Vite)
5. Copies `constants.json` next to server dist + patches the import path
6. Copies server dist into `apps/desktop/server/dist/`
7. Validates all Electron `.mjs` files

### What `pnpm dev` does

The root `dev` script runs `electron-dev.mjs` which:

1. Prepares sidecars and helpers
2. Builds `openwork-server` (TypeScript)
3. If Vite is not already running, launches it (`pnpm -w dev:ui`)
4. Waits for Vite to be ready
5. Launches Electron pointing at the Vite dev server

### Turbo pipeline

The monorepo uses [Turborepo](https://turbo.build). Key config in `turbo.json`:

- `build` tasks declare `dependsOn: ["^build"]` — building a package builds its dependencies first
- `dev` and `dev:local` tasks are `persistent: true` (long-running servers)
- All `dev:*` tasks pass through a shared set of environment variables

---

## How OpenWork Starts

At runtime, the OpenWork desktop app bootstraps like this:

```
Electron main process
  → Starts openwork-orchestrator (CLI host)
    → Starts opencode serve (agent runtime)
    → Starts openwork-server (API)
    → Optionally starts opencode-router (messaging bridge)
  → Loads the Vite-built UI in a BrowserWindow
    → UI connects to openwork-server via @opencode-ai/sdk/v2/client
    → SSE streaming for real-time updates
```

In **host mode**, everything runs locally. The orchestrator manages the lifecycle.
In **client mode**, the UI connects to a remote OpenCode server by URL.

---

## Environment Variables

### Server connection (web UI)

| Variable | Default | Description |
|---|---|---|
| `VITE_OPENWORK_URL` | — | Base URL of the OpenWork API server (e.g. `http://localhost:8787`) |
| `VITE_OPENWORK_PORT` | — | Port override for the OpenWork server |
| `VITE_OPENWORK_TOKEN` | — | Client bearer token for the server |
| `VITE_OPENWORK_HOST_TOKEN` | — | Host approval token (for remote desktop connections) |

### Deployment & version

| Variable | Default | Description |
|---|---|---|
| `VITE_OPENWORK_DEPLOYMENT` | `desktop` | `"desktop"` or `"web"` — controls UI behavior |
| `VITE_OPENWORK_APP_VERSION` | `"0.0.0"` | App version string injected at build time |

### Analytics & feedback

| Variable | Default | Description |
|---|---|---|
| `VITE_OPENWORK_POSTHOG_KEY` | `phc_4YnPTlDVYPjgwKvLuNxhbHjV5kadgvd7XLzVHWnCXAI` | PostHog project API key |
| `VITE_OPENWORK_POSTHOG_HOST` | `https://us.i.posthog.com` | PostHog ingestion host |
| `VITE_OPENWORK_FEEDBACK_URL` | `https://openworklabs.com/feedback` | Feedback form URL |

### OpenCode & Den cloud

| Variable | Default | Description |
|---|---|---|
| `VITE_OPENCODE_URL` | `http://127.0.0.1:4096` | Override for the OpenCode server URL |
| `VITE_DEN_BASE_URL` | `https://app.openworklabs.com` | Den cloud authentication base URL |
| `VITE_DEN_API_BASE_URL` | falls back to `VITE_DEN_BASE_URL` | Den cloud API base URL |
| `VITE_DEN_REQUIRE_SIGNIN` | `false` | Set to `"1"`/`"true"` to force sign-in |

### Dev & profiling

| Variable | Default | Description |
|---|---|---|
| `VITE_OPENWORK_PROFILER` | `false` | Set to `"1"` to enable React Profiler overlay |
| `VITE_ALLOWED_HOSTS` | — | Comma-separated additional hosts for Vite dev server |
| `PORT` | `5173` | Vite dev server port |
| `OPENWORK_PUBLIC_HOST` | — | Public hostname for Vite dev server allowed hosts |
| `OPENWORK_DEV_MODE` | — | Set to `"1"` by dev scripts for dev-specific behavior |

### Build / Electron packaging

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_ELECTRON_BUILD` | — | Set to `"1"` during Electron packaging; Vite emits relative asset paths for `file://` |
| `OPENWORK_ELECTRON_REMOTE_DEBUG_PORT` | — | CDP remote debugging port for Electron (e.g. `9823`) |

### Migration release (v0.12.0)

| Variable | Default | Description |
|---|---|---|
| `VITE_OPENWORK_MIGRATION_RELEASE` | — | Set to `"1"` to show the Tauri-to-Electron migration prompt |
| `VITE_OPENWORK_MIGRATION_VERSION` | — | Migration version string |
| `VITE_OPENWORK_MIGRATION_MAC_ARM64_URL` | — | Download URL for macOS ARM64 build |
| `VITE_OPENWORK_MIGRATION_MAC_X64_URL` | — | Download URL for macOS x64 build |
| `VITE_OPENWORK_MIGRATION_WINDOWS_X64_URL` | — | Download URL for Windows x64 build |
| `VITE_OPENWORK_MIGRATION_LINUX_ARM64_URL` | — | Download URL for Linux ARM64 build |
| `VITE_OPENWORK_MIGRATION_LINUX_X64_URL` | — | Download URL for Linux x64 build |

### Scripts & testing

| Variable | Default | Description |
|---|---|---|
| `OPENCODE_SERVER_PASSWORD` | — | Password for Basic Auth to OpenCode server |
| `OPENCODE_SERVER_USERNAME` | `opencode` | Username for Basic Auth (only used with password set) |
| `CDP_URL` | `http://127.0.0.1:9825` | Chrome DevTools Protocol endpoint for voice automation tests |

### Vite built-in (`import.meta.env.*`)

| Variable | Description |
|---|---|
| `import.meta.env.DEV` | `true` when running in Vite dev mode |
| `import.meta.env.PROD` | `true` in production builds |
| `import.meta.env.BASE_URL` | Vite `base` path (`"/"` in dev/web, `"./"` in Electron builds) |

Standard Vite convention: all `VITE_*` variables are available to browser code via `import.meta.env.*`. Variables without the `VITE_` prefix are only available at build time in `vite.config.ts` or Node.js scripts.

---

## Troubleshooting

### Linux / Wayland crashes

```bash
WEBKIT_DISABLE_DMABUF_RENDERER=1 pnpm dev
# or
WEBKIT_DISABLE_COMPOSITING_MODE=1 pnpm dev
```

### Missing OpenCode CLI

Download from [opencode.ai](https://opencode.ai) or:

```bash
curl -fsSL https://opencode.ai/install | sh
```

### Clean rebuild

```bash
pnpm install --frozen-lockfile
pnpm build
```

### Export debug logs

From the running app: Settings → Debug → Export runtime debug report + developer logs.
