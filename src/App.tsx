import React, { useState, useRef, useEffect } from 'react';
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
  RotateCcw,
  X,
} from 'lucide-react';
import { AgentPreset } from './shared/presets';

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

  if (!dbLoaded) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Workspace Context...</div>;

  // Redirect to setup if not configured or no workspaces left
  if (!setupCompleted || workspaces.length === 0) return <SetupPage />;

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const handleSelectPreset = (preset: AgentPreset) => {
    if (activeWorkspaceId) {
      addSessionToWorkspace(activeWorkspaceId, preset.name, preset.command);
    }
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
    <div className="layout">
      {/* Header */}
      <header className="header">
        {/* Left — brand + project */}
        <div className="header-title">
          <TerminalIcon size={16} style={{ color: 'var(--accent-purple)' }} />
          <span>Labrat Workspace</span>
          {activeWorkspace?.projectFolder && (
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-secondary)',
                fontFamily: 'monospace',
                background: 'rgba(255,255,255,0.05)',
                padding: '0.1rem 0.4rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--border-color)',
              }}
            >
              {activeWorkspace.projectFolder.split('/').pop()}
            </span>
          )}
        </div>


        {/* Right — actions */}
        <div className="header-actions">
          <button
            className="btn-secondary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', gap: '0.3rem' }}
            onClick={resetSetup}
            title="Back to setup"
          >
            <RotateCcw size={12} /> Setup
          </button>
          <button className="header-icon-btn" title="Settings" onClick={() => setShowSettingsModal(true)}>
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Workspace Tabs */}
      <div className="workspace-bar">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={`workspace-tab-wrapper ${activeWorkspaceId === ws.id ? 'active' : ''}`}
          >
            {editingWorkspaceId === ws.id ? (
              <input
                className="workspace-tab-input"
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
              <button
                className="workspace-tab-label"
                onClick={() => setActiveWorkspace(ws.id)}
                onDoubleClick={() => {
                  setEditingWorkspaceId(ws.id);
                  setEditingName(ws.name);
                }}
                title="Double click to rename"
              >
                {ws.name}
              </button>
            )}
            <button
              className="workspace-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmCloseId(ws.id);
              }}
              title="Close workspace"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        <button
          className="workspace-tab"
          style={{ padding: '0.4rem 0.6rem' }}
          onClick={() => setShowNewWorkspaceModal(true)}
          title="New workspace"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Grid Content — all workspaces rendered, only active visible */}
      {workspaces.map((ws) => {
        const isActive = ws.id === activeWorkspaceId;
        return (
          <main
            key={ws.id}
            className="grid-container"
            style={{ display: isActive ? 'grid' : 'none' }}
          >
            {ws.terminalIds.map((sessionId) => (
              <div key={sessionId} className="terminal-card">
                <div className="terminal-header">
                  <span>{sessions[sessionId]?.name}</span>
                  <div
                    className="btn-remove cursor-pointer hover:text-red-400"
                    onClick={() => {
                      removeSession(ws.id, sessionId);
                      window.electron.pty.kill(sessionId);
                    }}
                  >
                    <Trash2 size={14} />
                  </div>
                </div>
                <div className="terminal-body">
                  <TerminalView sessionId={sessionId} cwd={ws.projectFolder} />
                </div>
              </div>
            ))}

            {/* Add terminal */}
            <div
              className="terminal-card flex items-center justify-center cursor-pointer hover:border-accent-purple"
              style={{ borderStyle: 'dashed', minHeight: '200px' }}
              onClick={() => setShowPresetModal(true)}
            >
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Plus size={32} style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.8rem' }}>Add Agent Terminal</p>
              </div>
            </div>
          </main>
        );
      })}

      {/* New Workspace Modal */}
      {showNewWorkspaceModal && (
        <NewWorkspaceModal
          workspaceCount={workspaces.length}
          defaultFolder={activeWorkspace?.projectFolder}
          onConfirm={handleCreateWorkspace}
          onClose={() => setShowNewWorkspaceModal(false)}
        />
      )}

      {/* Preset Modal */}
      {showPresetModal && (
        <PresetModal
          onClose={() => setShowPresetModal(false)}
          onSelect={handleSelectPreset}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsPage onClose={() => setShowSettingsModal(false)} />
      )}

      {/* Confirm close workspace */}
      {confirmCloseId && (() => {
        const ws = workspaces.find((w) => w.id === confirmCloseId);
        return (
          <div className="modal-overlay" onClick={() => setConfirmCloseId(null)}>
            <div
              className="modal-content glass"
              style={{ maxWidth: '360px', padding: '1.5rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Close workspace?</h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{ws?.name}</strong> and all{' '}
                {ws?.terminalIds.length} terminal{ws?.terminalIds.length !== 1 ? 's' : ''} will be terminated.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setConfirmCloseId(null)}>Cancel</button>
                <button
                  onClick={() => handleCloseWorkspace(confirmCloseId)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
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
