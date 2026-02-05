# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

RFD Site is Oxide Computer Company's web frontend for browsing, searching, and reading RFDs
(Requests for Discussion). Built with React Router v7 (formerly Remix). Can be deployed on
Vercel or run as a Deno container.

## Commands

### Development (Node/npm)

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build (react-router build)
npm run test         # Run unit tests with Vitest
npm run tsc          # Type check without emitting
npm run lint         # ESLint
npm run fmt          # Format with Prettier
npm run fmt:check    # Check formatting
npm run e2ec         # Run Playwright E2E tests (Chrome)
```

### Deno Runtime

```bash
deno task dev        # Dev server with Deno (requires build first)
deno task start      # Production server with Deno
deno task build      # Build using Deno's npm compatibility
deno task compile    # Compile to standalone binary
```

### Container Build (Podman)

```bash
podman build -t rfd-site .                    # Build container
podman run -p 3000:3000 rfd-site              # Run container
podman run -p 3000:3000 -e PORT=8080 rfd-site # Custom port
```

The Containerfile uses a multi-stage build:

1. Node stage: Builds the React Router app with npm
2. Deno stage: Compiles server.ts with embedded assets into a standalone binary
3. Scratch stage: Minimal final image with just the binary and CA certs

### Running a Single Test

```bash
npm run test -- path/to/file.test.ts           # Run specific test file
npm run test -- --grep "test name"             # Run tests matching pattern
npx playwright test --project=chrome test.ts   # Run specific E2E test
```

### Local RFD Authoring Mode

Preview RFDs from a local clone of the rfd repo:

```bash
LOCAL_RFD_REPO=~/oxide/rfd npm run dev
```

This mode reads RFD files directly from the specified directory without needing API
credentials.

## Architecture

### Data Flow: Local vs Remote Mode

The app operates in two modes controlled by `LOCAL_RFD_REPO` env var:

- **Local mode** (`app/services/rfd.local.server.ts`): Reads AsciiDoc files directly from a
  local rfd repo clone. Used for authoring/previewing.
- **Remote mode** (`app/services/rfd.remote.server.ts`): Fetches from the rfd-api backend.
  Used in production with OAuth authentication.

The unified interface in `app/services/rfd.server.ts` abstracts this, calling either backend
based on `isLocalMode()`.

### Routing

Uses React Router v7 file-based routing (`@react-router/fs-routes`). Routes are in
`app/routes/`:

- `_index.tsx` - RFD listing page
- `rfd.$slug.tsx` - Individual RFD view
- `auth.*.tsx` - OAuth flows (GitHub, Google)
- `api.*.tsx` - API endpoints

### Content Rendering

RFDs are written in AsciiDoc and rendered with `@oxide/react-asciidoc`. Custom block
renderers live in `app/components/AsciidocBlocks/` (Mermaid diagrams, syntax-highlighted
code listings, images).

### Path Alias

`~/` maps to `./app/` (configured in tsconfig.json).

## Key Dependencies

- `@oxide/react-asciidoc` - AsciiDoc renderer
- `@oxide/rfd.ts` - TypeScript client for rfd-api
- `@oxide/design-system` - Oxide's component library
- `@tanstack/react-query` - Data fetching for PR discussions
- `shiki` - Syntax highlighting
- `mermaid` - Diagram rendering
