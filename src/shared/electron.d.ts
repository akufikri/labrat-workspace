export {};

declare global {
  interface Window {
    electron: {
      pty: {
        spawn: (opts: { id: string; command?: string; args?: string[]; cwd?: string }) => Promise<boolean>;
        write: (id: string, data: string) => void;
        resize: (id: string, cols: number, rows: number) => void;
        kill: (id: string) => void;
        onData: (id: string, cb: (data: string) => void) => () => void;
        onExit: (id: string, cb: (code: number) => void) => () => void;
        getBuffer: (id: string) => Promise<string>;
      };
      setup: {
        checkCli: (command: string) => Promise<boolean>;
        selectFolder: () => Promise<string | null>;
        checkFileExists: (filePath: string) => Promise<boolean>;
        runInstall: (id: string, command: string, cwd?: string) => Promise<{ success: boolean; output: string }>;
        onInstallOutput: (id: string, cb: (chunk: string) => void) => () => void;
        writeCoordinationFile: (folder: string, agents: Array<{ name: string; command: string }>) => Promise<boolean>;
      };
      db: {
        getWorkspaces: () => Promise<any[]>;
        saveWorkspaces: (workspaces: any[]) => Promise<void>;
        getSessions: () => Promise<any[]>;
        saveSessions: (sessions: any, workspaces: any[]) => Promise<void>;
        togglePlugin: (id: string, name: string, installed: boolean) => Promise<void>;
        getPlugins: () => Promise<any[]>;
        setSetting: (key: string, value: string) => Promise<void>;
        getSetting: (key: string) => Promise<string | null>;
        clearAll: () => Promise<void>;
      };
      system: {
        getStats: () => Promise<{
          memory: { total: number; free: number; used: number; usagePercent: number };
          cpu: { load: number; cores: number; model: string };
          uptime: number;
          platform: string;
        }>;
      };
      clipboard: {
        write: (text: string) => Promise<void>;
      };
      glass: {
        isSupported: () => Promise<boolean>;
        enable: () => Promise<boolean>;
        disable: () => Promise<boolean>;
      };
      broadcast: (sessionIds: string[], data: string) => void;
    };
  }
}
