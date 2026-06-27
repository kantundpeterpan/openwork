# OpenWork Server

Filesystem-backed API for OpenWork remote clients. This package provides the OpenWork server layer described in `apps/app/pr/openwork-server.md` and is intentionally independent from the desktop app.

## Quick start

```bash
npm install -g openwork-server
openwork-server --workspace /path/to/workspace --approval auto
```

`openwork-server` ships as a compiled binary, so Bun is not required at runtime.

Or from source:

```bash
pnpm --filter openwork-server dev -- \
  --workspace /path/to/workspace \
  --approval auto
```

The server logs the client token and host token on boot when they are auto-generated.

Add `--verbose` to print resolved config details on startup. Use `--version` to print the server version and exit.

## Config file

Defaults to `~/.config/openwork/server.json` (override with `OPENWORK_SERVER_CONFIG` or `--config`).

```json
{
  "host": "127.0.0.1",
  "port": 8787,
  "approval": { "mode": "manual", "timeoutMs": 30000 },
  "workspaces": [
    {
      "path": "/Users/susan/Finance",
      "name": "Finance",
      "workspaceType": "local",
      "baseUrl": "http://127.0.0.1:4096",
      "directory": "/Users/susan/Finance"
    }
  ],
  "corsOrigins": ["http://localhost:5173"]
}
```

## Environment variables

### Server configuration

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_HOST` | `127.0.0.1` | HTTP listen address |
| `OPENWORK_PORT` | `8787` | HTTP listen port |
| `OPENWORK_SERVER_CONFIG` | `~/.config/openwork/server.json` | Path to config JSON |
| `OPENWORK_TOKEN` | auto-generated `shortId()` | Client bearer token |
| `OPENWORK_HOST_TOKEN` | auto-generated `shortId()` | Host approval token |
| `OPENWORK_APPROVAL_MODE` | `manual` | `manual` or `auto` |
| `OPENWORK_APPROVAL_TIMEOUT_MS` | `30000` | Approval timeout in ms |
| `OPENWORK_CORS_ORIGINS` | `*` | Comma-separated origins or `*` |
| `OPENWORK_WORKSPACES` | — | JSON array or comma-separated paths |
| `OPENWORK_READONLY` | `false` | Disable all writes |
| `OPENWORK_LOG_FORMAT` | `pretty` | Log output format |
| `OPENWORK_LOG_REQUESTS` | `true` | Log HTTP requests |

### OpenCode connection

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_OPENCODE_BASE_URL` | — | Remote OpenCode base URL |
| `OPENWORK_OPENCODE_DIRECTORY` | — | Remote workspace directory |
| `OPENWORK_OPENCODE_USERNAME` | — | Remote OpenCode username |
| `OPENWORK_OPENCODE_PASSWORD` | — | Remote OpenCode password |

### Managed OpenCode (spawn & control)

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_MANAGE_OPENCODE` | — | Set to `"1"` to enable managed OpenCode |
| `OPENWORK_MANAGED_OPENCODE_CWD` | workspace path | Working directory for managed OpenCode |
| `OPENWORK_OPENCODE_BIN` | `opencode` | Path to OpenCode binary |
| `OPENWORK_DEV_MODE` | — | Set to `"1"` to enable dev mode |
| `OPENWORK_UI_CONTROL_DISCOVERY` | — | UI control discovery URL |

### Server URL / Token (injected into managed OpenCode)

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_SERVER_URL` | — | Server URL for managed OpenCode |
| `OPENWORK_SERVER_TOKEN` | — | Server token for managed OpenCode |

### Storage / data paths

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_DATA_DIR` | `~/.openwork/openwork-server` | Data directory |
| `OPENWORK_RUNTIME_DB` | `{configDir}/runtime.sqlite` | Runtime SQLite database path |
| `OPENWORK_TOKEN_STORE` | `{configDir}/tokens.json` | Scoped token store path |
| `OPENWORK_ENV_STORE` | `~/.config/openwork/env.json` (Linux) / `APPDATA/openwork/env.json` (Win) | Environment store path |

### Sandbox / capabilities

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_SANDBOX_ENABLED` | inferred from backend | Enable sandbox |
| `OPENWORK_SANDBOX_BACKEND` | `none` | `docker`, `container`, or `none` |
| `OPENWORK_INBOX_ENABLED` | `true` | Enable file inbox |
| `OPENWORK_INBOX_MAX_BYTES` | `50000000` (50 MB) | Max inbox upload size |
| `OPENWORK_OUTBOX_ENABLED` | `true` | Enable file outbox |
| `OPENWORK_TOY_UI` | `true` | Serve toy UI static assets |
| `OPENWORK_BROWSER_PROVIDER` | `none` (disabled) | Browser automation provider |

### API keys / credentials

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_OPENAI_REALTIME_API_KEY` | — | OpenAI Realtime API key |
| `OPENAI_REALTIME_API_KEY` | — | Fallback OpenAI Realtime key |
| `OPENAI_API_KEY` | — | Fallback OpenAI API key |
| `OPENWORK_OPENAI_IMAGE_API_KEY` | — | OpenAI image generation key |
| `GOOGLE_WORKSPACE_OAUTH_CLIENT_ID` | — | Google Workspace OAuth client ID |
| `GOOGLE_WORKSPACE_OAUTH_CLIENT_SECRET` | — | Google Workspace OAuth client secret |
| `OPENWORK_GOOGLE_WORKSPACE_OAUTH_CLIENT_ID` | — | OpenWork-prefixed OAuth client ID |
| `OPENWORK_GOOGLE_WORKSPACE_OAUTH_CLIENT_SECRET` | — | OpenWork-prefixed OAuth client secret (legacy) |
| `OPENWORK_GOOGLE_WORKSPACE_TOKEN_BROKER_URL` | — | Token broker URL for Google Workspace |
| `GOOGLE_WORKSPACE_TOKEN_BROKER_URL` | — | Fallback token broker URL |
| `OPENWORK_GOOGLE_WORKSPACE_ALLOW_PLAINTEXT_VAULT` | — | Allow plaintext credential vault |
| `OPENWORK_ENCRYPTION_KEY` | auto-generated vault key | Encryption key for credential vault |

### Runtime control / cloud workers

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_CONTROL_BASE_URL` | — | Cloud control plane base URL |
| `OPENWORK_CONTROL_TOKEN` | — | Cloud control plane token |

### MCP sync

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_MCP_SYNC_RETRY_DELAY_MS` | `750` | MCP sync retry delay in ms |

### GitHub plugin bundle

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_GITHUB_API_BASE` | `https://api.github.com` | GitHub API base URL |
| `OPENWORK_GITHUB_RAW_BASE` | `https://raw.githubusercontent.com` | GitHub raw content base URL |

### OpenCode database (internal)

| Variable | Default | Description |
|---|---|---|
| `OPENCODE_DB` | XDG data dirs | OpenCode database path |
| `OPENCODE_CHANNEL` | `local` | OpenCode update channel |
| `OPENCODE_DISABLE_CHANNEL_DB` | — | Disable channel-scoped DB |

### Docs / knowledge

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_DOCS_DIR` | searched relative paths | Documentation directory |

### Observability / debug

| Variable | Default | Description |
|---|---|---|
| `OPENWORK_RUN_ID` | auto-generated `shortId()` | Unique run identifier |
| `OPENWORK_DEV_LOG_FILE` | — | Dev log file path |

### Standard OS environment variables (used for path resolution)

| Variable | Description |
|---|---|
| `APPDATA` | Windows app data directory |
| `XDG_DATA_HOME` | Linux XDG data directory |
| `XDG_CONFIG_HOME` | Linux XDG config directory |
| `HOME` | User home directory |

## Endpoints

- `GET /health`
- `GET /status`
- `GET /capabilities`
- `GET /whoami`
- `GET /workspaces`
- `GET /workspace/:id/config`
- `PATCH /workspace/:id/config`
- `GET /workspace/:id/events`
- `POST /workspace/:id/engine/reload`
- `GET /workspace/:id/plugins`
- `POST /workspace/:id/plugins`
- `DELETE /workspace/:id/plugins/:name`
- `GET /workspace/:id/skills`
- `POST /workspace/:id/skills`
- `GET /workspace/:id/mcp`
- `POST /workspace/:id/mcp`
- `DELETE /workspace/:id/mcp/:name`
- `GET /workspace/:id/commands`
- `POST /workspace/:id/commands`
- `DELETE /workspace/:id/commands/:name`
- `GET /workspace/:id/audit`
- `GET /workspace/:id/export`
- `POST /workspace/:id/import/preview`
- `POST /workspace/:id/import`

Token management (host/owner auth):

- `GET /tokens`
- `POST /tokens` (body: `{ "scope": "owner"|"collaborator"|"viewer", "label"?: string }`)
- `DELETE /tokens/:id`

Inbox/outbox:

- `POST /workspace/:id/inbox` (multipart upload into `.opencode/openwork/inbox/`)
- `GET /workspace/:id/artifacts`
- `GET /workspace/:id/artifacts/:artifactId`
- `POST /workspace/:id/files/sessions`
- `POST /files/sessions/:sessionId/renew`
- `DELETE /files/sessions/:sessionId`
- `GET /files/sessions/:sessionId/catalog/snapshot`
- `GET /files/sessions/:sessionId/catalog/events`
- `POST /files/sessions/:sessionId/read-batch`
- `POST /files/sessions/:sessionId/write-batch`
- `POST /files/sessions/:sessionId/ops`

Toy UI (static assets served by the server):

- `GET /ui`
- `GET /w/:id/ui`
- `GET /ui/assets/*`

OpenCode proxy:

- `GET|POST|... /opencode/*`
- `GET|POST|... /w/:id/opencode/*`

OpenCode Router proxy:

- `GET|POST|... /opencode-router/*`
- `GET|POST|... /w/:id/opencode-router/*`

Auth policy:
- `GET /opencode-router/health` requires client auth.
- All other `/opencode-router/*` endpoints require host/owner auth.

## Approvals

All writes are gated by host approval.

Host APIs accept either:

- `X-OpenWork-Host-Token: <token>` (legacy host token), or
- `Authorization: Bearer <token>` where the token scope is `owner`.

Approvals endpoints:

- `GET /approvals`
- `POST /approvals/:id` with `{ "reply": "allow" | "deny" }`

Set `OPENWORK_APPROVAL_MODE=auto` to auto-approve during local development.
