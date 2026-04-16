# 🐀 LabRat MVP Specification

## 🧠 Overview

**LabRat** adalah desktop-based *Agent Orchestration Environment* yang memungkinkan developer menjalankan banyak AI agent secara paralel dalam satu workspace.

Berbeda dari terminal biasa, LabRat berfokus pada:

* Parallel execution
* Agent management
* Task-driven automation

---

## 🎯 Problem Statement

Developer yang menggunakan AI coding agents (Claude Code, GPT CLI, dll) mengalami:

* ❌ Sulit menjalankan banyak agent sekaligus
* ❌ Tidak ada visibility antar agent
* ❌ Workflow masih manual & repetitive
* ❌ Tidak ada orchestration / automation antar agent

---

## 💡 Solution

LabRat menyediakan:

> **1 workspace → multiple agents → parallel execution → centralized control**

---

## 🚀 MVP Scope

### ✅ Core Features (Wajib)

#### 1. Multi-Terminal System

* Multiple terminal dalam 1 window
* Tab-based (v1), grid optional (v2)
* Tiap terminal independent process

**Tech:**

* xterm.js (UI)
* node-pty (process)

---

#### 2. Agent Runner

* User bisa menjalankan:

  * Claude Code
  * OpenAI CLI
  * Custom script

**Behavior:**

* Terminal = representasi 1 agent
* Agent dijalankan via command

Contoh:

```bash
claude-code
npm run agent
python agent.py
```

---

#### 3. Session Management

* Create / kill terminal
* Rename terminal
* Basic session tracking

---

#### 4. Workspace System (Basic)

```ts
type Workspace = {
  id: string
  name: string
  terminals: TerminalSession[]
}
```

* 1 workspace = 1 project
* Tidak perlu persistence di MVP awal

---

#### 5. Simple UI

* Sidebar: list terminal
* Main: active terminal
* Button:

  * New terminal
  * Kill terminal

---

## ⚡ MVP+ (Differentiator Early Stage)

> Ini yang bikin LabRat beda dari sekadar “multi terminal app”

---

### 🔥 6. Agent Preset System

User bisa pilih agent tanpa manual setup:

Contoh:

* "Claude Dev"
* "GPT Fixer"
* "Test Runner"

```ts
type AgentPreset = {
  name: string
  command: string
  env?: Record<string, string>
}
```

---

### 🔥 7. Auto-Run Agent

Saat terminal dibuat:

* langsung menjalankan agent

Contoh:

```bash
labrat run claude
```

---

### 🔥 8. Terminal Labeling

Setiap terminal punya:

* nama agent
* status (running / idle)

---

## 🧠 MVP Improvement vs BridgeSpace

### 1. Lightweight First

BridgeSpace:

* berat & kompleks

LabRat:

* fokus minimal → fast & smooth

---

### 2. CLI-First Philosophy

BridgeSpace:

* UI-heavy

LabRat:

* CLI-friendly + extensible

---

### 3. Developer-Oriented

LabRat fokus ke:

* fleksibilitas
* extensibility
* scripting

---

## 🧪 Post-MVP (Phase 2)

### 🔥 1. Split / Grid Layout

* 2x2, 3x3 terminal grid
* drag & resize

---

### 🔥 2. Workspace Persistence

* restore terminal session
* auto reopen agents

---

### 🔥 3. Task → Agent Execution

User bisa:

* define task
* klik → run agent

```ts
type Task = {
  name: string
  command: string
}
```

---

### 🔥 4. Command Templates

* reusable command
* quick run

---

## 🧬 Phase 3 (REAL Differentiator)

> Ini yang bikin LabRat jadi “next-level”

---

### 🚀 1. Agent Orchestration System

```ts
type Workflow = {
  steps: Step[]
}

type Step = {
  agent: string
  input: string
  dependsOn?: string[]
}
```

Contoh:

1. Agent A → generate code
2. Agent B → test
3. Agent C → fix

---

### 🚀 2. Agent Status Tracking

* running
* success
* failed

---

### 🚀 3. Observability

* log per agent
* execution timeline
* resource usage

---

### 🚀 4. Agent Chaining (Auto Flow)

* output agent A → input agent B

---

## 🧱 Tech Stack

### Desktop

* Electron
* React

### State

* Zustand

### Terminal

* xterm.js
* node-pty

### Optional

* SQLite (future persistence)

---

## 🏗️ High-Level Architecture

```
UI (React + xterm.js)
        ↓
Terminal Manager
        ↓
node-pty (process layer)
        ↓
AI Agent CLI (Claude / GPT / custom)
```

---

## 📦 MVP Deliverables

* [ ] Electron app running
* [ ] 1 working terminal
* [ ] Multi-terminal support
* [ ] Agent manual run
* [ ] Basic UI (sidebar + terminal)

---

## ⏱️ Estimasi Timeline

| Phase                | Durasi   |
| -------------------- | -------- |
| Setup Electron + UI  | 1–2 hari |
| Terminal integration | 2–3 hari |
| Multi-terminal       | 2 hari   |
| Agent runner         | 1–2 hari |

👉 Total MVP: **~7–10 hari**

---

## 💣 Key Success Metric

* User bisa menjalankan ≥ 3 agent paralel tanpa friction
* Tidak ada crash saat multi-terminal
* UX terasa lebih cepat dari tmux/manual setup

---

## 🧠 Final Insight

Kalau berhenti di MVP:

> LabRat = “better terminal”

Kalau lanjut ke Phase 3:

> LabRat = **Agent Operating System**
