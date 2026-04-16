import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal,
  Bot,
  Code,
  Zap,
  FolderOpen,
  Plus,
  Check,
  X,
  Rocket,
  Download,
  Loader,
  Server,
  Settings,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { AGENT_PRESETS, AgentPreset } from '../../shared/presets';
import { useLabRatStore } from '../../store/useTerminalStore';

// ──────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ──────────────────────────────────────────────────────────────────────────────

interface CliStatus {
  id: string;
  name: string;
  command: string;
  installed: boolean | null;
  installHint: string;
  icon: React.ReactNode;
}

interface TerminalSlot {
  id: string;
  agentId: string;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  installCmd: string;
  docsUrl: string;
  color: string;
}

const CLI_TOOLS: Omit<CliStatus, 'installed'>[] = [
  { id: 'claude', name: 'Claude Code', command: 'claude', installHint: 'npm install -g @anthropic-ai/claude-code', icon: <Bot size={18} /> },
  { id: 'opencode', name: 'OpenCode', command: 'opencode', installHint: 'curl -fsSL https://opencode.ai/install | bash', icon: <Code size={18} /> },
  { id: 'gemini', name: 'Gemini CLI', command: 'gemini', installHint: 'npm install -g @google/gemini-cli', icon: <Zap size={18} /> },
];

const CLAUDE_PLUGINS: Plugin[] = [
  { id: 'caveman', name: 'Caveman', description: 'Compress agent output ~65% fewer tokens.', installCmd: 'npx skills add JuliusBrussee/caveman --yes', docsUrl: '', color: '#f59e0b' },
  { id: 'agv', name: 'Awesome AGV', description: '42 rules + 8 skills + 11 workflows.', installCmd: 'npx degit irahardianto/awesome-agv . --force', docsUrl: '', color: '#8b5cf6' },
  { id: 'superpowers', name: 'Superpowers', description: 'Structured developer workflow.', installCmd: 'npx skills add obra/superpowers --yes', docsUrl: '', color: '#3b82f6' },
];

const IconMap: Record<string, React.ReactNode> = {
  terminal: <Terminal size={16} />,
  bot: <Bot size={16} />,
  code: <Code size={16} />,
  zap: <Zap size={16} />,
};

interface WorkspaceTemplate {
  id: string;
  name: string;
  count: number;
  agents: string[];
  description: string;
}

const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  { id: 'solo-claude', name: 'Solo Claude', count: 1, agents: ['claude'], description: '1 × Claude Code' },
  { id: 'dual-claude', name: 'Dual Claude', count: 2, agents: ['claude', 'claude'], description: '2 × Claude Code' },
  { id: 'claude-gemini', name: 'Claude + Gemini', count: 2, agents: ['claude', 'gemini'], description: 'Claude Code + Gemini CLI' },
  { id: 'multi-agent', name: 'Multi-Agent', count: 3, agents: ['claude', 'opencode', 'gemini'], description: 'Claude + OpenCode + Gemini' },
];

// ──────────────────────────────────────────────────────────────────────────────
// Helpers & Subcomponents
// ──────────────────────────────────────────────────────────────────────────────

const LayoutDots: React.FC<{ count: number; active: boolean }> = ({ count, active }) => {
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
  const dots = Array.from({ length: count });
  return (
    <div className="layout-dots" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {dots.map((_, i) => (
        <div key={i} className={`layout-dot ${active ? 'active' : ''}`} />
      ))}
    </div>
  );
};

const makeSlots = (agents: string[]): TerminalSlot[] => agents.map(agentId => ({ id: Math.random().toString(36).substr(2, 6), agentId }));

// ──────────────────────────────────────────────────────────────────────────────
// Main Setup Component
// ──────────────────────────────────────────────────────────────────────────────

const SetupPage: React.FC = () => {
  const [workspaceName, setWorkspaceName] = useState(`Project-${Math.floor(Math.random() * 1000)}`);
  const [folder, setFolder] = useState<string | null>(null);
  
  const [tools, setTools] = useState<CliStatus[]>(CLI_TOOLS.map(t => ({ ...t, installed: null })));
  
  const [slots, setSlots] = useState<TerminalSlot[]>([{ id: 'slot-1', agentId: 'claude' }]);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  // Track which plugins are successfully installed during setup
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set());

  const completeSetup = useLabRatStore((s) => s.completeSetup);
  const theme = useLabRatStore((s) => s.theme);
  const setTheme = useLabRatStore((s) => s.setTheme);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Init CLI checks
  useEffect(() => {
    CLI_TOOLS.forEach(async (tool, i) => {
      const installed = await window.electron.setup.checkCli(tool.command);
      setTools((prev) => prev.map((t, idx) => (idx === i ? { ...t, installed } : t)));
    });
  }, []);

  // Handlers
  const selectFolder = async () => {
    const path = await window.electron.setup.selectFolder();
    if (path) setFolder(path);
  };

  const launch = async () => {
    if (!folder) return;
    const agents = slots.map((slot) => {
      const preset = AGENT_PRESETS.find((p) => p.id === slot.agentId) || AGENT_PRESETS[0];
      return { name: preset.name, command: preset.command };
    });
    
    completeSetup(folder, agents, workspaceName);
  };

  // Rendering fragments
  const renderCliRow = (tool: CliStatus) => {
    const [installState, setInstallState] = useState<'idle'|'installing'|'success'|'error'>('idle');
    const [output, setOutput] = useState('');
    const [showOutput, setShowOutput] = useState(false);
    const unsubRef = useRef<(() => void) | null>(null);

    const doInstall = async () => {
      setInstallState('installing');
      setOutput('');
      setShowOutput(true);
      unsubRef.current = window.electron.setup.onInstallOutput(tool.id, (chunk) => {
        setOutput((prev) => prev + chunk);
      });
      await window.electron.setup.runInstall(tool.id, tool.installHint);
      unsubRef.current?.();
      
      const nowInstalled = await window.electron.setup.checkCli(tool.command);
      if (nowInstalled) {
        setInstallState('success');
        setTools((prev) => prev.map(t => t.id === tool.id ? { ...t, installed: true } : t));
      } else setInstallState('error');
    };

    return (
      <div key={tool.id} className="cli-row-wrapper" style={{ marginBottom: 0 }}>
        <div className="cli-row" style={{ padding: '0.75rem 1rem' }}>
          <div className="cli-row-left">
            <span className="cli-icon">{tool.icon}</span>
            <div>
              <span className="cli-name">{tool.name}</span>
              <code className="cli-cmd">{tool.command}</code>
            </div>
          </div>
          <div className="cli-row-right">
            {tool.installed === null ? (
              <span className="cli-badge checking">checking…</span>
            ) : tool.installed || installState === 'success' ? (
              <span className="cli-badge installed"><Check size={12} /> installed</span>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {output && <button className="btn-copy" onClick={() => setShowOutput(v => !v)}>log</button>}
                <button className={`btn-install ${installState}`} onClick={doInstall} disabled={installState === 'installing'}>
                  {installState === 'installing' ? <Loader size={13} className="spin" /> : 
                   installState === 'error' ? <X size={13} /> : <Download size={13} />}
                </button>
              </div>
            )}
          </div>
        </div>
        {showOutput && output && <pre className="install-output" style={{ maxHeight: 150 }}>{output}</pre>}
      </div>
    );
  };

  const renderPluginRow = (plugin: Plugin) => {
    const isInstalled = installedPlugins.has(plugin.id);
    const [installState, setInstallState] = useState<'idle'|'installing'|'success'|'error'>('idle');
    const [output, setOutput] = useState('');
    const unsubRef = useRef<(() => void) | null>(null);

    const install = async () => {
      setInstallState('installing');
      setOutput('');
      unsubRef.current = window.electron.setup.onInstallOutput(plugin.id, (chunk) => {
        setOutput((prev) => prev + chunk);
      });
      await window.electron.setup.runInstall(plugin.id, plugin.installCmd, folder || undefined);
      unsubRef.current?.();
      setInstallState('success');
      setInstalledPlugins(prev => new Set(prev).add(plugin.id));
      window.electron.db.togglePlugin(plugin.id, plugin.name, true);
    };

    return (
      <div key={plugin.id} className={`plugin-card ${isInstalled ? 'selected' : ''}`} style={{ '--plugin-color': plugin.color } as React.CSSProperties}>
        <div className="plugin-card-top">
          <div className="plugin-card-left">
            <div className="plugin-toggle" style={isInstalled ? { background: plugin.color, borderColor: plugin.color } : {}}>
              {isInstalled && <Check size={12} style={{ color: 'white' }} />}
            </div>
            <div>
              <span className="plugin-name" style={{ color: plugin.color }}>{plugin.name}</span>
              <p className="plugin-desc">{plugin.description}</p>
            </div>
          </div>
          <div>
            <button className={`btn-install ${installState}`} onClick={install} disabled={isInstalled || installState === 'installing'}>
              {installState === 'installing' ? <Loader size={13} className="spin" /> : isInstalled ? <Check size={13} /> : 'Install'}
            </button>
          </div>
        </div>
        {output && <pre className="install-output" style={{ maxHeight: 100, marginTop: '0.5rem' }}>{output}</pre>}
      </div>
    );
  };

  const canLaunch = folder !== null && tools.some(t => t.installed);

  return (
    <div className="setup-page">
      <div className="setup-brand">
        <span className="setup-logo">Labrat Workspace</span>
        <span className="setup-tagline">Initializing Environment</span>
      </div>

      <div className="setup-dashboard">
        
        {/* 1. Project Context */}
        <div className="setup-section-block">
          <div className="setup-section-header">
            <Server size={20} style={{ color: 'var(--accent-blue)' }} />
            <div>
              <h3>Workspace Context</h3>
              <p>Define your project environment.</p>
            </div>
          </div>
          <div className="cli-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Workspace Name</label>
              <input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Project Directory</label>
              <div className="folder-selector" onClick={selectFolder} style={{ margin: 0, height: '100%' }}>
                <FolderOpen size={20} style={{ color: folder ? 'var(--accent-purple)' : 'var(--text-secondary)' }} />
                <span>{folder || 'Click to select…'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Engines */}
        <div className="setup-section-block">
          <div className="setup-section-header">
            <Terminal size={20} style={{ color: 'var(--accent-purple)' }} />
            <div>
              <h3>AI Engines</h3>
              <p>Install and verify required CLI tools.</p>
            </div>
          </div>
          <div className="cli-grid">
            {tools.map(renderCliRow)}
          </div>
        </div>

        {/* 3. Terminals */}
        <div className="setup-section-block">
          <div className="setup-section-header">
            <Settings size={20} style={{ color: 'var(--text-primary)' }} />
            <div>
              <h3>Terminal Fleet Configuration</h3>
              <p>Setup your multi-agent architecture.</p>
            </div>
          </div>
          
          <div className="template-grid">
            {WORKSPACE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                className={`template-card ${activeTemplate === tpl.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTemplate(tpl.id);
                  setSlots(makeSlots(tpl.agents));
                }}
              >
                <LayoutDots count={tpl.count} active={activeTemplate === tpl.id} />
                <span className="template-name">{tpl.name}</span>
                <span className="template-desc">{tpl.description}</span>
              </button>
            ))}
          </div>

          <div className="terminal-slots" style={{ marginTop: '1rem' }}>
            {slots.map((slot, i) => (
              <div key={slot.id} className="terminal-slot">
                <span className="slot-number">#{i + 1}</span>
                <div className="slot-agent-select">
                  {AGENT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      className={`slot-agent-btn ${slot.agentId === p.id ? 'active' : ''}`}
                      onClick={() => setSlots(slots.map(s => s.id === slot.id ? { ...s, agentId: p.id } : s))}
                      style={{ padding: '0.4rem 0.6rem' }}
                    >
                      {IconMap[p.icon] || <Terminal size={12} />}
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="slot-remove"
                  onClick={() => {
                    setActiveTemplate(null);
                    setSlots(slots.filter((s) => s.id !== slot.id));
                  }}
                  disabled={slots.length <= 1}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button 
            className="btn-add-slot" 
            onClick={() => {
              setActiveTemplate(null);
              setSlots([...slots, { id: Math.random().toString(), agentId: 'shell' }]);
            }} 
            disabled={slots.length >= 6}
          >
            <Plus size={14} /> Add Terminal
          </button>
        </div>


        {/* 4. Appearance */}
        <div className="setup-section-block">
          <div className="setup-section-header">
            <Monitor size={20} style={{ color: 'var(--accent-blue)' }} />
            <div>
              <h3>Appearance</h3>
              <p>Choose your preferred color theme.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[
              { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
              { id: 'light', label: 'Light', icon: <Sun size={16} /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as 'dark' | 'light')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '0.5rem',
                  border: `1.5px solid ${theme === t.id ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                  background: theme === t.id ? 'rgba(139,92,246,0.12)' : 'var(--bg-secondary)',
                  color: theme === t.id ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: theme === t.id ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {t.icon}
                {t.label}
                {theme === t.id && <Check size={13} />}
              </button>
            ))}
          </div>
        </div>

      </div>

      <div className="setup-bottom-bar">
        <button 
          className="btn-launch" 
          onClick={launch} 
          disabled={!canLaunch}
          style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
        >
          <Rocket size={18} /> Allocate Workspace
        </button>
      </div>

    </div>
  );
};

export default SetupPage;
