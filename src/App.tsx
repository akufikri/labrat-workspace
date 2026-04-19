import React, { useState, useEffect } from 'react';
import { useLabRatStore } from './store/useTerminalStore';
import TerminalView from './components/TerminalView';
import PresetModal from './components/PresetModal';
import NewWorkspaceModal from './components/NewWorkspaceModal';
import SettingsPage from './components/SettingsPage';
import SetupPage from './features/setup/SetupPage';
import {
  Settings,
  Plus,
  Terminal as TerminalIcon,
  Trash2,
  Wrench,
  X,
  FolderOpen,
  Code,
  Bot,
  Zap,
} from 'lucide-react';
import { AgentPreset } from './shared/presets';

const AgentIcon = ({ name }: { name: string }) => {
  const n = name.toLowerCase();
  if (n.includes('claude')) return <Code size={14} style={{ color: '#8b5cf6' }} />;
  if (n.includes('opencode') || n.includes('open')) return <Bot size={14} style={{ color: '#3b82f6' }} />;
  if (n.includes('gemini')) return <Zap size={14} style={{ color: '#34d399' }} />;
  return <TerminalIcon size={14} style={{ color: '#64748b' }} />;
};

const App: React.FC = () => {
  const [dbLoaded, setDbLoaded] = useState(false);
  const loadFromDb = useLabRatStore(s => s.loadFromDb);

  useEffect(() => {
    loadFromDb().then(() => setDbLoaded(true));
  }, [loadFromDb]);

  const {
    workspaces,
    activeWorkspaceId,
    sessions,
    setupCompleted,
    setActiveWorkspace,
    addSessionToWorkspace,
    addWorkspaceWithSessions,
    removeWorkspace,
    removeSession,
    resetSetup,
    renameWorkspace,
    theme,
  } = useLabRatStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!dbLoaded) return (
    <div className="h-screen w-screen flex items-center justify-center text-sm" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
      Loading Workspace Context...
    </div>
  );

  if (!setupCompleted || workspaces.length === 0) return <SetupPage />;

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const handleSelectPreset = (preset: AgentPreset) => {
    if (activeWorkspaceId) addSessionToWorkspace(activeWorkspaceId, preset.name, preset.command);
    setShowPresetModal(false);
  };

  const handleCreateWorkspace = (name: string, agents: Array<{ name: string; command: string }>) => {
    addWorkspaceWithSessions(name, agents, activeWorkspace?.projectFolder);
    setShowNewWorkspaceModal(false);
  };

  const handleCloseWorkspace = (wsId: string) => {
    const ws = workspaces.find((w) => w.id === wsId);
    if (!ws) return;
    ws.terminalIds.forEach((sid) => window.electron.pty.kill(sid));
    removeWorkspace(wsId);
    setConfirmCloseId(null);
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-4 flex-shrink-0 glass-header z-10"
        style={{
          height: 52,
          minHeight: 52,
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* macOS traffic lights placeholder */}
          <div className="flex gap-2 pl-2">
            <div className="w-3 h-3 rounded-full cursor-pointer transition-colors" style={{ background: 'rgba(255,255,255,0.12)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')} />
            <div className="w-3 h-3 rounded-full cursor-pointer transition-colors" style={{ background: 'rgba(255,255,255,0.12)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#eab308')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')} />
            <div className="w-3 h-3 rounded-full cursor-pointer transition-colors" style={{ background: 'rgba(255,255,255,0.12)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#22c55e')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')} />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              <Code size={16} style={{ color: '#8b5cf6' }} />
              LabRat
            </span>
            <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
            {activeWorkspace?.projectFolder && (
              <button
                className="flex items-center gap-2 rounded-md text-xs transition-colors"
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#64748b')}
              >
                <FolderOpen size={12} />
                {activeWorkspace.projectFolder.split('/').slice(-2).join('/')}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ width: 32, height: 32, color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}
            title="Back to setup"
            onClick={resetSetup}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f8fafc'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Wrench size={15} />
          </button>
          <button
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ width: 32, height: 32, color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}
            title="Settings"
            onClick={() => setShowSettingsModal(true)}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f8fafc'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* ── Workspace Tab Bar ── */}
      <div
        className="w-full flex overflow-x-auto flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
      >
        <div className="flex px-2">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <div
                key={ws.id}
                className="group relative flex items-center gap-2 cursor-pointer transition-colors"
                style={{
                  padding: '10px 16px',
                  minWidth: 140,
                  maxWidth: 200,
                  borderBottom: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
                  background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isActive ? '#8b5cf6' : '#3b82f6' }} />
                {editingWorkspaceId === ws.id ? (
                  <input
                    className="workspace-tab-input flex-1 text-xs"
                    autoFocus
                    maxLength={20}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => {
                      if (editingName.trim()) renameWorkspace(ws.id, editingName.trim());
                      setEditingWorkspaceId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editingName.trim()) renameWorkspace(ws.id, editingName.trim());
                        setEditingWorkspaceId(null);
                      }
                      if (e.key === 'Escape') setEditingWorkspaceId(null);
                    }}
                  />
                ) : (
                  <span
                    className="text-xs font-medium truncate flex-1"
                    style={{ color: isActive ? '#f8fafc' : '#64748b' }}
                    onClick={() => setActiveWorkspace(ws.id)}
                    onDoubleClick={() => {
                      setEditingWorkspaceId(ws.id);
                      setEditingName(ws.name);
                    }}
                  >
                    {ws.name}
                  </span>
                )}
                <button
                  className="opacity-0 group-hover:opacity-100 transition-all flex items-center"
                  style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmCloseId(ws.id);
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#f8fafc')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#64748b')}
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
          <button
            className="flex items-center justify-center px-4 transition-colors"
            style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setShowNewWorkspaceModal(true)}
            title="New workspace"
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#f8fafc')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#64748b')}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* ── Terminal Grid ── Only active workspace mounts terminals to reduce memory/CPU */}
      {workspaces.map((ws) => {
        const isActive = ws.id === activeWorkspaceId;
        if (!isActive) return null;
        return (
          <main
            key={ws.id}
            style={{
              display: 'grid',
              flex: 1,
              padding: 16,
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(420px, 100%), 1fr))',
              gridAutoRows: 'minmax(320px, 1fr)',
              overflowY: 'auto',
              alignContent: 'start',
            }}
          >
            {ws.terminalIds.map((sessionId) => (
              <div
                key={sessionId}
                className="glass-panel rounded-xl flex flex-col overflow-hidden group terminal-glow"
              >
                <div
                  className="px-3 py-2 flex items-center justify-between flex-shrink-0"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <AgentIcon name={sessions[sessionId]?.name || ''} />
                    <span className="text-xs font-medium" style={{ color: '#cbd5e1' }}>
                      {sessions[sessionId]?.name}
                    </span>
                    <div
                      className="w-1.5 h-1.5 rounded-full ml-1 status-active"
                      style={{ background: '#22c55e' }}
                    />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="flex items-center justify-center rounded transition-colors"
                      style={{ width: 24, height: 24, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                      onClick={() => {
                        removeSession(ws.id, sessionId);
                        window.electron.pty.kill(sessionId);
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative" style={{ background: '#050505' }}>
                  <TerminalView sessionId={sessionId} cwd={ws.projectFolder} />
                </div>
              </div>
            ))}

            {/* Add Agent */}
            <button
              className="rounded-xl flex flex-col items-center justify-center gap-3 transition-all group"
              style={{
                minHeight: 360,
                border: '1px dashed rgba(255,255,255,0.12)',
                background: 'transparent',
                color: '#64748b',
                cursor: 'pointer',
              }}
              onClick={() => setShowPresetModal(true)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.border = '1px dashed rgba(255,255,255,0.3)';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)';
                (e.currentTarget as HTMLButtonElement).style.color = '#f8fafc';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.border = '1px dashed rgba(255,255,255,0.12)';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <Plus size={22} />
              </div>
              <span className="text-sm font-medium tracking-tight">Add Agent</span>
            </button>
          </main>
        );
      })}

      {/* ── Modals ── */}
      {showNewWorkspaceModal && (
        <NewWorkspaceModal
          workspaceCount={workspaces.length}
          defaultFolder={activeWorkspace?.projectFolder}
          onConfirm={handleCreateWorkspace}
          onClose={() => setShowNewWorkspaceModal(false)}
        />
      )}
      {showPresetModal && (
        <PresetModal onClose={() => setShowPresetModal(false)} onSelect={handleSelectPreset} />
      )}
      {showSettingsModal && (
        <SettingsPage onClose={() => setShowSettingsModal(false)} />
      )}

      {/* Confirm close workspace */}
      {confirmCloseId && (() => {
        const ws = workspaces.find((w) => w.id === confirmCloseId);
        return (
          <div className="modal-overlay" onClick={() => setConfirmCloseId(null)}>
            <div
              className="rounded-xl p-6"
              style={{
                width: 360,
                background: 'rgba(10,10,12,0.96)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-white mb-2">Close workspace?</h3>
              <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>
                <strong className="text-white">{ws?.name}</strong> and all{' '}
                {ws?.terminalIds.length} terminal{ws?.terminalIds.length !== 1 ? 's' : ''} will be terminated.
              </p>
              <div className="flex gap-3 justify-end">
                <button className="btn-secondary" onClick={() => setConfirmCloseId(null)}>
                  Cancel
                </button>
                <button
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleCloseWorkspace(confirmCloseId)}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#dc2626')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#ef4444')}
                >
                  Close Workspace
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default App;
