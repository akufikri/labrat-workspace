# 🔐 LabRat Feature: Multi-Credential & Per-Terminal Environment

## 🧠 Overview

Fitur ini memungkinkan LabRat menjalankan multiple AI agents secara paralel dengan **API key yang berbeda di setiap terminal**.

Ini adalah core differentiator yang memungkinkan:

> **1 app → multiple agents → multiple identities → parallel execution tanpa rate limit bottleneck**

---

## 🎯 Problem

Secara default:

* CLI seperti Claude Code hanya menggunakan **1 API key global**
* Tidak bisa scale agent secara paralel
* Mudah kena rate limit

---

## 💡 Solution

LabRat menggunakan:

> **Per-terminal environment injection**

Sehingga setiap terminal memiliki:

* API key berbeda
* Environment terisolasi
* Identitas agent yang independen

---

## 🧱 Core Concept

### 1. Terminal = 1 Process

Setiap terminal dijalankan sebagai child process menggunakan `node-pty`.

```ts
pty.spawn(shell, [], {
  env: process.env
})
```

---

### 2. Environment Per Process

* Default: inherit dari parent
* Bisa dioverride saat spawn

👉 Ini memungkinkan setiap terminal punya API key berbeda

---

## 🔥 Use Case

| Terminal | API Key |
| -------- | ------- |
| T1       | KEY_A   |
| T2       | KEY_B   |
| T3       | KEY_C   |
| T4       | KEY_D   |

---

## ⚙️ Implementation

### Credential Model

```ts
type Credential = {
  id: string
  provider: 'claude'
  apiKey: string
}
```

---

### Spawn Terminal dengan API Key

```ts
import pty from 'node-pty'

function createTerminal(credential: Credential) {
  return pty.spawn('bash', [], {
    env: {
      ...process.env,
      ANTHROPIC_API_KEY: credential.apiKey
    }
  })
}
```

---

### UI Flow

```
User pilih:
  → Agent: Claude
  → Credential: KEY_B

↓
LabRat spawn terminal
↓
Inject env KEY_B
↓
Agent jalan dengan identity tersebut
```

---

## 🔌 CLI Compatibility

Sebagian besar AI CLI membaca API key dari environment:

```bash
export ANTHROPIC_API_KEY=xxx
```

👉 Tidak perlu modifikasi CLI

---

## ⚠️ Challenges

### 1. Security

* Jangan expose API key ke frontend
* Simpan di secure storage (keytar)

---

### 2. Config Conflict

Beberapa CLI menyimpan config di:

```
~/.config
```

Solusi:

```bash
HOME=/tmp/labrat/session-1
```

---

### 3. Rate Limit

* 1 key → bottleneck
* multiple key → scalable parallel execution

---

## 🚀 Advanced Features

### Credential Pool

```ts
type CredentialPool = {
  provider: 'claude'
  keys: string[]
}
```

---

### Auto Assignment

```ts
function getNextKey() {
  return pool[index++ % pool.length]
}
```

---

### Agent Scaling

```
User klik "Run 5 agents"
↓
LabRat assign 5 key berbeda
↓
Spawn 5 terminal
```

---

## 💡 Product Value

Fitur ini memungkinkan positioning:

> **"Run multiple AI agents with different API keys in parallel"**

---

## 🎯 Future Enhancements

* Credential Manager UI
* Auto load balancing
* Usage tracking per API key
* Cost estimation per agent

---

## 🧠 Conclusion

✔ Multi credential = supported
✔ Per-terminal env = core mechanism
✔ Strong differentiator untuk LabRat

👉 Ini mengubah LabRat dari:

* multi terminal app

Menjadi:

* **multi-agent execution system**
