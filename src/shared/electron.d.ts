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
      };
      setup: {
        checkCli: (command: string) => Promise<boolean>;
        selectFolder: () => Promise<string | null>;
        copyToClipboard: (text: string) => Promise<void>;
        checkFileExists: (filePath: string) => Promise<boolean>;
        runInstall: (id: string, command: string, cwd?: string) => Promise<{ success: boolean; output: string }>;
        onInstallOutput: (id: string, cb: (chunk: string) => void) => () => void;
        writeCoordinationFile: (folder: string, agents: Array<{ name: string; command: string }>) => Promise<boolean>;
      };
      broadcast: (sessionIds: string[], data: string) => void;
    };
  }
}
