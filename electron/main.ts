import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import * as path from 'path';
import * as pty from 'node-pty';
import * as os from 'os';
import { exec } from 'child_process';
import { dbService } from './db';

let mainWindow: BrowserWindow | null = null;
const ptyProcesses: Map<string, pty.IPty> = new Map();

// Fix PATH on macOS when launched from Dock (process.env.PATH is minimal)
if (process.platform === 'darwin' || process.platform === 'linux') {
  try {
    const shell = process.env.SHELL || '/bin/zsh';
    const { execSync } = require('child_process');
    const shellPath = execSync(`${shell} -l -c 'echo $PATH'`, { encoding: 'utf8', timeout: 3000 }).trim();
    if (shellPath) process.env.PATH = shellPath;
  } catch (_) {}
}

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devIconPath = path.join(__dirname, '../assets/image/logo.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0a0c',
    icon: isDev ? devIconPath : undefined,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev && process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(devIconPath);
  }

  // Allow storage, clipboard, and notification permissions
  mainWindow.webContents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowed = ['storage', 'clipboard-read', 'clipboard-sanitized-write', 'notifications', 'fullscreen'];
    callback(allowed.includes(permission));
  });

  // Persist storage (IndexedDB, localStorage) without prompt
  mainWindow.webContents.session.setPermissionCheckHandler((_wc, permission) => {
    const allowed = ['storage', 'clipboard-read', 'clipboard-sanitized-write', 'notifications', 'fullscreen'];
    return allowed.includes(permission);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    ptyProcesses.forEach((p) => p.kill());
    ptyProcesses.clear();
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// PTY IPC handlers
ipcMain.handle('pty-spawn', (event, { id, command, args, cwd }) => {
  const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/zsh');
  
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: cwd || os.homedir(),
    env: process.env as any,
  });

  ptyProcesses.set(id, ptyProcess);

  // If a command is provided, write it to the pty after a short delay to ensure shell is ready
  if (command) {
    setTimeout(() => {
      ptyProcess.write(`${command}\r`);
    }, 500);
  }

  ptyProcess.onData((data) => {
    if (mainWindow) {
      mainWindow.webContents.send(`pty-data-${id}`, data);
    }
  });

  ptyProcess.onExit((exitCode) => {
    if (mainWindow) {
      mainWindow.webContents.send(`pty-exit-${id}`, exitCode);
    }
    ptyProcesses.delete(id);
  });

  return true;
});

ipcMain.on('pty-write', (event, { id, data }) => {
  const ptyProcess = ptyProcesses.get(id);
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

ipcMain.on('pty-resize', (event, { id, cols, rows }) => {
  const ptyProcess = ptyProcesses.get(id);
  if (ptyProcess) {
    ptyProcess.resize(cols, rows);
  }
});

ipcMain.on('pty-kill', (event, id) => {
  const ptyProcess = ptyProcesses.get(id);
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcesses.delete(id);
  }
});

// Setup IPC handlers
ipcMain.handle('check-cli', (_, command: string) => {
  return new Promise<boolean>((resolve) => {
    const checkCmd = process.platform === 'win32' ? `where ${command}` : `which ${command}`;
    exec(checkCmd, (err) => resolve(!err));
  });
});

ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Project Folder',
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('clipboard-write', (_, text: string) => {
  clipboard.writeText(text);
});

ipcMain.handle('check-file-exists', (_, filePath: string) => {
  const fs = require('fs');
  return fs.existsSync(filePath);
});

// Broadcast a message to multiple PTY sessions
ipcMain.on('pty-broadcast', (_, { sessionIds, data }: { sessionIds: string[]; data: string }) => {
  sessionIds.forEach((id) => {
    const ptyProcess = ptyProcesses.get(id);
    if (ptyProcess) ptyProcess.write(data);
  });
});

// Write agent coordination file to project folder
ipcMain.handle('write-coordination-file', (_, { folder, agents }: { folder: string; agents: Array<{ name: string; command: string }> }) => {
  const fs = require('fs');
  const path2 = require('path');
  const dir = path2.join(folder, '.labrat');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const agentList = agents.map((a, i) =>
    `- Terminal #${i + 1}: **${a.name}** (\`${a.command || 'shell'}\`)`
  ).join('\n');

  const content = `# LabRat Agent Coordination
> Auto-generated by LabRat. Do not edit manually.

## Active Agents
${agentList}

## Coordination Rules
- Announce which files/directories you own before starting
- Avoid editing the same file as another agent simultaneously
- Use comments/commits to signal task boundaries
- Read this file on startup to understand the team structure

## Communication
To broadcast a message to all agents, use the LabRat broadcast bar in the header.
`;

  fs.writeFileSync(path2.join(dir, 'context.md'), content, 'utf8');
  return true;
});

ipcMain.handle('run-install', (_, { id, command, cwd }: { id: string; command: string; cwd?: string }) => {
  return new Promise<{ success: boolean; output: string }>((resolve) => {
    const child = exec(command, { shell: process.env.SHELL || '/bin/bash', cwd: cwd || os.homedir() });
    let output = '';

    child.stdout?.on('data', (data: string) => {
      output += data;
      mainWindow?.webContents.send(`install-output-${id}`, data.toString());
    });

    child.stderr?.on('data', (data: string) => {
      output += data;
      mainWindow?.webContents.send(`install-output-${id}`, data.toString());
    });

    child.on('close', (code) => {
      resolve({ success: code === 0, output });
    });

    child.on('error', (err) => {
      resolve({ success: false, output: err.message });
    });
  });
});

// Database IPC handlers
ipcMain.handle('db-get-workspaces', () => dbService.getWorkspaces());
ipcMain.handle('db-save-workspaces', (_, workspaces) => dbService.saveWorkspaces(workspaces));
ipcMain.handle('db-get-sessions', () => dbService.getAllSessions());
ipcMain.handle('db-save-sessions', (_, { sessions, workspaces }) => dbService.saveAllSessions(sessions, workspaces));
ipcMain.handle('db-toggle-plugin', (_, { id, name, installed }) => dbService.togglePlugin(id, name, installed));
ipcMain.handle('db-get-plugins', () => dbService.getInstalledPlugins());
ipcMain.handle('db-set-setting', (_, { key, value }) => dbService.setSetting(key, value));
ipcMain.handle('db-get-setting', (_, key) => dbService.getSetting(key));
ipcMain.handle('db-clear-all', () => dbService.clearData());

// System stats handler
ipcMain.handle('get-system-stats', () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const load = os.loadavg();
  const cpus = os.cpus();
  
  return {
    memory: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usagePercent: (usedMem / totalMem) * 100
    },
    cpu: {
      load: load[0], // 1 minute load average
      cores: cpus.length,
      model: cpus[0].model
    },
    uptime: os.uptime(),
    platform: os.platform()
  };
});
