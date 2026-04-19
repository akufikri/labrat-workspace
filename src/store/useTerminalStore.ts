import { create } from 'zustand';

export interface TerminalSession {
  id: string;
  name: string;
  command?: string;
  status: 'running' | 'idle' | 'failed';
}

export interface Workspace {
  id: string;
  name: string;
  terminalIds: string[];
  projectFolder?: string;
}

interface LabRatStore {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  sessions: Record<string, TerminalSession>;
  setupCompleted: boolean;
  theme: 'dark' | 'light' | 'glass';

  // Persistence
  loadFromDb: () => Promise<void>;
  saveToDb: () => Promise<void>;

  // Setup Actions
  completeSetup: (projectFolder: string, agents: Array<{ name: string; command: string }>, workspaceName?: string) => void;
  resetSetup: () => void;

  // Workspace Actions
  addWorkspace: (name: string, projectFolder?: string) => void;
  addWorkspaceWithSessions: (name: string, agents: Array<{ name: string; command: string }>, projectFolder?: string) => void;
  removeWorkspace: (workspaceId: string) => void;
  setActiveWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;

  // Session Actions
  addSessionToWorkspace: (workspaceId: string, name: string, command?: string) => void;
  removeSession: (workspaceId: string, sessionId: string) => void;
  updateSessionStatus: (sessionId: string, status: TerminalSession['status']) => void;
  setTheme: (theme: 'dark' | 'light' | 'glass') => Promise<void>;
}

export const useLabRatStore = create<LabRatStore>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  sessions: {},
  setupCompleted: false,
  theme: 'dark',

  loadFromDb: async () => {
    try {
      const workspacesArr = await (window as any).electron.db.getWorkspaces();
      const sessionsArr = await (window as any).electron.db.getSessions();
      const setupDone = await (window as any).electron.db.getSetting('setupCompleted');
      const savedTheme = await (window as any).electron.db.getSetting('theme');

      // Always restore theme, even if no workspaces exist
      const theme: 'dark' | 'light' | 'glass' = (['dark', 'light', 'glass'].includes(savedTheme) ? savedTheme : 'dark') as any;

      // Re-apply native glass if it was the saved theme
      if (theme === 'glass' && typeof window !== 'undefined' && window.electron?.glass) {
        window.electron.glass.isSupported().then((supported) => {
          if (supported) {
            window.electron.glass.enable();
            document.documentElement.setAttribute('data-native-glass', 'true');
          }
        }).catch(() => {});
      }

      if (workspacesArr.length > 0) {
        const workspaceMap: Workspace[] = workspacesArr.map((ws: any) => ({
          ...ws,
          terminalIds: sessionsArr.filter((s: any) => s.workspaceId === ws.id).map((s: any) => s.id)
        }));

        const sessionObj: Record<string, TerminalSession> = {};
        sessionsArr.forEach((s: any) => {
          sessionObj[s.id] = { id: s.id, name: s.name, command: s.command, status: 'idle' };
        });

        set({
          workspaces: workspaceMap,
          sessions: sessionObj,
          activeWorkspaceId: workspaceMap[0].id,
          setupCompleted: setupDone === 'true',
          theme,
        });
      } else {
        // No workspaces yet (first setup), still apply saved theme
        set({ theme });
      }
    } catch (e) {
      console.error('Failed to load from DB', e);
    }
  },

  saveToDb: async () => {
    const { workspaces, sessions, setupCompleted, theme } = get();
    await (window as any).electron.db.saveWorkspaces(workspaces);
    await (window as any).electron.db.saveSessions(sessions, workspaces);
    await (window as any).electron.db.setSetting('setupCompleted', setupCompleted ? 'true' : 'false');
    await (window as any).electron.db.setSetting('theme', theme);
  },

  completeSetup: (projectFolder, agents, workspaceName) => {
    const workspaceId = `ws-${Math.random().toString(36).substr(2, 5)}`;
    const sessionsMap: Record<string, TerminalSession> = {};
    const terminalIds: string[] = [];

    agents.forEach(({ name, command }) => {
      const sessionId = Math.random().toString(36).substr(2, 9);
      sessionsMap[sessionId] = { id: sessionId, name, command, status: 'idle' };
      terminalIds.push(sessionId);
    });

    if (typeof window !== 'undefined' && (window as any).electron?.setup?.writeCoordinationFile) {
      (window as any).electron.setup.writeCoordinationFile(projectFolder, agents).catch(() => {});
    }

    set({
      setupCompleted: true,
      sessions: sessionsMap,
      workspaces: [{ id: workspaceId, name: workspaceName || 'workspace1', terminalIds, projectFolder }],
      activeWorkspaceId: workspaceId,
    });
    get().saveToDb();
  },

  resetSetup: () => {
    set({
      setupCompleted: false,
      workspaces: [],
      activeWorkspaceId: null,
      sessions: {},
    });
    get().saveToDb();
  },

  addWorkspace: (name, projectFolder) => {
    const id = `ws-${Math.random().toString(36).substr(2, 5)}`;
    set((state) => ({
      workspaces: [...state.workspaces, { id, name, terminalIds: [], projectFolder }],
    }));
    get().saveToDb();
  },

  addWorkspaceWithSessions: (name, agents, projectFolder) => {
    const id = `ws-${Math.random().toString(36).substr(2, 5)}`;
    const newSessions: Record<string, TerminalSession> = {};
    const terminalIds: string[] = [];
    agents.forEach(({ name: agentName, command }) => {
      const sessionId = Math.random().toString(36).substr(2, 9);
      newSessions[sessionId] = { id: sessionId, name: agentName, command, status: 'idle' };
      terminalIds.push(sessionId);
    });
    set((state) => ({
      workspaces: [...state.workspaces, { id, name, terminalIds, projectFolder }],
      sessions: { ...state.sessions, ...newSessions },
      activeWorkspaceId: id,
    }));
    get().saveToDb();
  },

  removeWorkspace: (workspaceId) => {
    set((state) => {
      const ws = state.workspaces.find((w) => w.id === workspaceId);
      if (!ws) return state;
      const remainingSessions = { ...state.sessions };
      ws.terminalIds.forEach((id) => delete remainingSessions[id]);
      const remainingWorkspaces = state.workspaces.filter((w) => w.id !== workspaceId);
      const newActiveId =
        state.activeWorkspaceId === workspaceId
          ? (remainingWorkspaces[0]?.id ?? null)
          : state.activeWorkspaceId;
      return {
        workspaces: remainingWorkspaces,
        sessions: remainingSessions,
        activeWorkspaceId: newActiveId,
      };
    });
    get().saveToDb();
  },

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  renameWorkspace: (id, name) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, name } : w
      ),
    }));
    get().saveToDb();
  },

  addSessionToWorkspace: (workspaceId, name, command) => {
    const sessionId = Math.random().toString(36).substr(2, 9);
    set((state) => {
      const session: TerminalSession = { id: sessionId, name, command, status: 'idle' };
      const workspace = state.workspaces.find((w) => w.id === workspaceId);
      if (!workspace) return state;
      return {
        sessions: { ...state.sessions, [sessionId]: session },
        workspaces: state.workspaces.map((w) =>
          w.id === workspaceId
            ? { ...w, terminalIds: [...w.terminalIds, sessionId] }
            : w
        ),
      };
    });
    get().saveToDb();
  },

  removeSession: (workspaceId, sessionId) => {
    set((state) => {
      const { [sessionId]: _, ...remainingSessions } = state.sessions;
      return {
        sessions: remainingSessions,
        workspaces: state.workspaces.map((w) =>
          w.id === workspaceId
            ? { ...w, terminalIds: w.terminalIds.filter((id) => id !== sessionId) }
            : w
        ),
      };
    });
    get().saveToDb();
  },

  updateSessionStatus: (sessionId, status) => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: { ...state.sessions[sessionId], status },
      },
    }));
  },

  setTheme: async (theme) => {
    set({ theme });
    get().saveToDb();

    // Trigger native liquid glass on/off via IPC
    if (typeof window !== 'undefined' && window.electron?.glass) {
      if (theme === 'glass') {
        const supported = await window.electron.glass.isSupported();
        if (supported) {
          await window.electron.glass.enable();
          document.documentElement.setAttribute('data-native-glass', 'true');
        } else {
          document.documentElement.removeAttribute('data-native-glass');
        }
      } else {
        await window.electron.glass.disable();
        document.documentElement.removeAttribute('data-native-glass');
      }
    }
  }
}));
