<div align="center">
  <img src="banner.png" alt="LabRat Workspace" width="800" />
  <h3 align="center">LabRat Workspace</h3>

  <p align="center">
    Desktop Agent Orchestration Environment — run multiple AI agents in parallel, in one workspace.
    <br />
    <a href="#getting-started">Getting Started</a>
    ·
    <a href="#features">Features</a>
    ·
    <a href="#tech-stack">Tech Stack</a>
    <br />
    <br />
  </p>
</div>

## About

**LabRat** is a desktop application built with Electron for running multiple AI coding agents (Claude Code, GPT CLI, custom scripts) in parallel within a single workspace.

Instead of juggling multiple terminal windows or tmux sessions, LabRat gives you a centralized environment with full visibility across all your running agents.

> **Goal:** 1 workspace → multiple agents → parallel execution → centralized control

## Problem

Developers using AI coding agents face:

- No way to run multiple agents simultaneously without friction
- Zero visibility between agents running in separate windows
- Manual, repetitive workflow setup
- No orchestration between agents

## Features

### Available Now
- **Multi-terminal** — multiple independent terminals in one window, each running its own agent process
- **Agent Runner** — launch any AI agent CLI (Claude Code, OpenAI CLI, custom scripts) per terminal
- **Session Management** — create, kill, and rename terminals

### Roadmap
- Agent status tracking (running / success / failed)
- Per-agent log observability and execution timeline
- Agent chaining — pipe output of agent A into agent B
- Resource usage monitoring

## Getting Started

### Prerequisites

- Node.js 18+
- macOS / Windows / Linux

### Install

```bash
git clone https://github.com/fikrinurhakim/labrats.git
cd labrats
npm install
```

### Run (Development)

```bash
npm run dev
```

This starts both Vite (frontend) and Electron concurrently.

### Build

```bash
npm run build
```

Output: `release/` directory with platform-specific installer (`.dmg` on macOS, `.exe` on Windows, `.AppImage` on Linux).

## Tech Stack

| Layer     | Technology                        |
| --------- | --------------------------------- |
| Desktop   | Electron                          |
| Frontend  | React + TypeScript                |
| Build     | Vite                              |
| Terminal  | xterm.js + node-pty               |
| State     | Zustand                           |
| Storage   | SQLite (better-sqlite3)           |

## Architecture

```
UI (React + xterm.js)
        ↓
Terminal Manager
        ↓
node-pty (process layer)
        ↓
AI Agent CLI (Claude Code / GPT CLI / custom)
```

## Directory Structure

```
labrats/
├── src/                  # React frontend
│   ├── components/       # Shared UI components
│   ├── features/         # Feature modules
│   ├── platform/         # Platform-specific abstractions
│   ├── store/            # Zustand stores
│   └── styles/           # Global styles
├── electron/             # Electron main process
│   ├── main.ts           # App entry point
│   ├── preload.ts        # Preload script (context bridge)
│   └── db.ts             # SQLite setup
├── public/               # Static assets
└── assets/               # Images and icons
```

## License

MIT — see [LICENSE](LICENSE) for details.
