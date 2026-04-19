import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  pty: {
    spawn: ({ id, command, cwd }: { id: string; command?: string; cwd?: string }) => ipcRenderer.invoke('pty-spawn', { id, command, cwd }),
    write: (id: string, data: string) => ipcRenderer.send('pty-write', { id, data }),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.send('pty-resize', { id, cols, rows }),
    kill: (id: string) => ipcRenderer.send('pty-kill', id),
    onData: (id: string, cb: (data: string) => void) => {
      const listener = (_: any, data: string) => cb(data);
      ipcRenderer.on(`pty-data-${id}`, listener);
      return () => ipcRenderer.removeListener(`pty-data-${id}`, listener);
    },
    onExit: (id: string, cb: (code: number) => void) => {
      const listener = (_: any, code: number) => cb(code);
      ipcRenderer.on(`pty-exit-${id}`, listener);
      return () => ipcRenderer.removeListener(`pty-exit-${id}`, listener);
    },
    getBuffer: (id: string) => ipcRenderer.invoke('pty-get-buffer', id),
  },
  setup: {
    checkCli: (command: string) => ipcRenderer.invoke('check-cli', command),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    checkFileExists: (path: string) => ipcRenderer.invoke('check-file-exists', path),
    writeCoordinationFile: (folder: string, agents: any[]) => ipcRenderer.invoke('write-coordination-file', { folder, agents }),
    runInstall: (id: string, command: string, cwd?: string) => ipcRenderer.invoke('run-install', { id, command, cwd }),
    onInstallOutput: (id: string, cb: (data: string) => void) => {
      const listener = (_: any, data: string) => cb(data);
      ipcRenderer.on(`install-output-${id}`, listener);
      return () => ipcRenderer.removeListener(`install-output-${id}`, listener);
    },
  },
  db: {
    getWorkspaces: () => ipcRenderer.invoke('db-get-workspaces'),
    saveWorkspaces: (workspaces: any[]) => ipcRenderer.invoke('db-save-workspaces', workspaces),
    getSessions: () => ipcRenderer.invoke('db-get-sessions'),
    saveSessions: (sessions: any, workspaces: any[]) => ipcRenderer.invoke('db-save-sessions', { sessions, workspaces }),
    togglePlugin: (id: string, name: string, installed: boolean) => ipcRenderer.invoke('db-toggle-plugin', { id, name, installed }),
    getPlugins: () => ipcRenderer.invoke('db-get-plugins'),
    setSetting: (key: string, value: string) => ipcRenderer.invoke('db-set-setting', { key, value }),
    getSetting: (key: string) => ipcRenderer.invoke('db-get-setting', key),
    clearAll: () => ipcRenderer.invoke('db-clear-all'),
  },
  system: {
    getStats: () => ipcRenderer.invoke('get-system-stats'),
  },
  clipboard: {
    write: (text: string) => ipcRenderer.invoke('clipboard-write', text),
  },
  broadcast: (sessionIds: string[], data: string) => ipcRenderer.send('pty-broadcast', { sessionIds, data }),
  glass: {
    isSupported: () => ipcRenderer.invoke('glass:isSupported'),
    enable: () => ipcRenderer.invoke('glass:enable'),
    disable: () => ipcRenderer.invoke('glass:disable'),
  },
});
