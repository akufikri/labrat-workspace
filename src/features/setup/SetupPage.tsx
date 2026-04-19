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
  Layout,
  Palette,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
} from 'lucide-react';
import { AGENT_PRESETS, AgentPreset } from '../../shared/presets';
import { useLabRatStore } from '../../store/useTerminalStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CliStatus {
  id: string;
  name: string;
  command: string;
  installed: boolean | null;
  installHint: string;
  icon: React.ReactNode;
  color: string;
  desc: string;
}

interface TerminalSlot {
  id: string;
  agentId: string;
}

const CLI_TOOLS: Omit<CliStatus, 'installed'>[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    command: 'claude',
    installHint: 'npm install -g @anthropic-ai/claude-code',
    icon: <Code size={20} />,
    color: '#8b5cf6',
    desc: "Anthropic's terminal agent. Excellent for complex reasoning and refactoring.",
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    command: 'opencode',
    installHint: 'curl -fsSL https://opencode.ai/install | bash',
    icon: <Bot size={20} />,
    color: '#3b82f6',
    desc: 'Open-source alternative via Ollama. Runs locally, completely private.',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    command: 'gemini',
    installHint: 'npm install -g @google/gemini-cli',
    icon: <Zap size={20} />,
    color: '#34d399',
    desc: "Google's fast multi-modal agent. Great for quick script generation.",
  },
];

const IconMap: Record<string, React.ReactNode> = {
  terminal: <Terminal size={14} />,
  bot: <Bot size={14} />,
  code: <Code size={14} />,
  zap: <Zap size={14} />,
};

interface WorkspaceTemplate {
  id: string;
  name: string;
  count: number;
  agents: string[];
  description: string;
}

const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  { id: 'solo', name: 'Solo Agent', count: 1, agents: ['claude'], description: '1 focused agent terminal' },
  { id: 'dual', name: 'Dual Agent', count: 2, agents: ['claude', 'claude'], description: '2 parallel agent terminals' },
  { id: 'triple', name: 'Triple Agent', count: 3, agents: ['claude', 'claude', 'claude'], description: '3 concurrent agent terminals' },
  { id: 'multiple', name: 'Multiple Agent', count: 4, agents: ['claude', 'claude', 'claude', 'claude'], description: '4 agent terminals, max coverage' },
];

const LayoutDots: React.FC<{ count: number; active: boolean }> = ({ count, active }) => {
  const cols = count <= 1 ? 1 : 2;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 3,
        width: 32,
        height: 32,
        padding: 4,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 6,
        alignItems: 'center',
        justifyItems: 'center',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 1,
            background: active ? '#8b5cf6' : 'rgba(255,255,255,0.2)',
            transition: 'background 0.15s',
          }}
        />
      ))}
    </div>
  );
};

const makeSlots = (agents: string[]): TerminalSlot[] =>
  agents.map((agentId) => ({ id: Math.random().toString(36).substr(2, 6), agentId }));

// ─── Step types ───────────────────────────────────────────────────────────────

type Step = 'workspace' | 'engines' | 'layout' | 'theme' | 'launch';

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'workspace', label: 'Workspace', icon: <FolderOpen size={16} /> },
  { id: 'engines', label: 'AI Engines', icon: <Code size={16} /> },
  { id: 'layout', label: 'Layout', icon: <Layout size={16} /> },
  { id: 'theme', label: 'Theme', icon: <Palette size={16} /> },
  { id: 'launch', label: 'Launch', icon: <Rocket size={16} /> },
];

// ─── CLI Engine Card ──────────────────────────────────────────────────────────

const EngineCard: React.FC<{
  tool: CliStatus;
  folder: string | null;
  onInstalled: (id: string) => void;
}> = ({ tool, folder: _folder, onInstalled }) => {
  const [installState, setInstallState] = useState<'idle' | 'installing' | 'success' | 'error'>('idle');
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
      onInstalled(tool.id);
    } else {
      setInstallState('error');
    }
  };

  const isInstalled = tool.installed || installState === 'success';

  return (
    <div
      className="flex flex-col gap-4 rounded-xl transition-colors"
      style={{
        padding: 20,
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${isInstalled ? tool.color + '33' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div className="flex justify-between items-start">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 40, height: 40, background: tool.color + '18', color: tool.color }}
        >
          {tool.icon}
        </div>
        {tool.installed === null ? (
          <span
            className="text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1.5"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Loader size={11} className="spin" /> checking
          </span>
        ) : isInstalled ? (
          <span
            className="text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1.5"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <Check size={11} /> Installed
          </span>
        ) : installState === 'installing' ? (
          <span
            className="text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1.5"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Loader size={11} className="spin" /> Installing…
          </span>
        ) : (
          <span
            className="text-xs font-medium px-2 py-1 rounded-md"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Missing
          </span>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-white tracking-tight">{tool.name}</h3>
        <p className="text-xs mt-1" style={{ color: '#64748b' }}>{tool.desc}</p>
      </div>

      <div
        className="flex items-center justify-between"
        style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {isInstalled ? (
          <span className="text-xs font-mono" style={{ color: '#64748b' }}>v installed</span>
        ) : (
          <>
            <span className="text-xs font-mono" style={{ color: '#475569' }}>--</span>
            <button
              className="btn-install text-xs"
              style={{ fontSize: 12 }}
              onClick={doInstall}
              disabled={installState === 'installing'}
            >
              {installState === 'installing' ? (
                <Loader size={12} className="spin" />
              ) : installState === 'error' ? (
                <><X size={12} /> Retry</>
              ) : (
                <><Download size={12} /> Install</>
              )}
            </button>
          </>
        )}
      </div>

      {showOutput && output && (
        <pre className="install-output">{output}</pre>
      )}
    </div>
  );
};

// ─── Main SetupPage ───────────────────────────────────────────────────────────

const SetupPage: React.FC = () => {
  const [workspaceName, setWorkspaceName] = useState(`Project-${Math.floor(Math.random() * 1000)}`);
  const [folder, setFolder] = useState<string | null>(null);
  const [tools, setTools] = useState<CliStatus[]>(CLI_TOOLS.map((t) => ({ ...t, installed: null })));
  const [slots, setSlots] = useState<TerminalSlot[]>([{ id: 'slot-1', agentId: 'claude' }]);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<Step>('workspace');

  const completeSetup = useLabRatStore((s) => s.completeSetup);
  const theme = useLabRatStore((s) => s.theme);
  const setTheme = useLabRatStore((s) => s.setTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    CLI_TOOLS.forEach(async (tool, i) => {
      const installed = await window.electron.setup.checkCli(tool.command);
      setTools((prev) => prev.map((t, idx) => (idx === i ? { ...t, installed } : t)));
    });
  }, []);

  const selectFolder = async () => {
    const path = await window.electron.setup.selectFolder();
    if (path) {
      setFolder(path);
      setWorkspaceName(path.split('/').filter(Boolean).pop() || workspaceName);
    }
  };

  const launch = async () => {
    if (!folder) return;
    const agents = slots.map((slot) => {
      const preset = AGENT_PRESETS.find((p) => p.id === slot.agentId) || AGENT_PRESETS[0];
      return { name: preset.name, command: preset.command };
    });
    completeSetup(folder, agents, workspaceName);
  };

  const canLaunch = folder !== null && tools.some((t) => t.installed);

  const stepOrder: Step[] = ['workspace', 'engines', 'layout', 'theme', 'launch'];
  const currentIdx = stepOrder.indexOf(activeStep);

  const goNext = () => {
    if (currentIdx < stepOrder.length - 1) setActiveStep(stepOrder[currentIdx + 1]);
  };
  const goBack = () => {
    if (currentIdx > 0) setActiveStep(stepOrder[currentIdx - 1]);
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* ── Titlebar drag region (clears macOS traffic lights) ── */}
      <div
        style={{
          height: 44,
          minHeight: 44,
          flexShrink: 0,
          WebkitAppRegion: 'drag',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-color)',
        } as React.CSSProperties}
      >
        <div style={{ WebkitAppRegion: 'no-drag', display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties}>
          <Code size={15} style={{ color: '#8b5cf6' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Labrats Workspace</span>
        </div>
      </div>

      {/* ── Main layout (sidebar + content) ── */}
      <div className="flex flex-1 overflow-hidden">

      {/* ── Sidebar ── */}
      <div
        className="flex flex-col"
        style={{
          width: 220,
          borderRight: '1px solid var(--border-color)',
          background: 'var(--bg-sidebar)',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '12px 8px 4px' }}>
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)', padding: '0 12px', opacity: 0.6 }}>
            Getting Started
          </span>
        </div>

        <nav className="flex flex-col gap-1" style={{ padding: '4px 8px' }}>
          {STEPS.map((step, idx) => {
            const isActive = activeStep === step.id;
            const isDone = stepOrder.indexOf(step.id) < currentIdx;
            return (
              <button
                key={step.id}
                className="flex items-center gap-3 rounded-md text-sm text-left transition-all relative"
                style={{
                  padding: '8px 12px',
                  background: isActive ? 'rgba(139,92,246,0.1)' : 'transparent',
                  border: 'none',
                  color: isActive ? '#c4b5fd' : isDone ? '#94a3b8' : '#475569',
                  cursor: 'pointer',
                  fontWeight: isActive ? 500 : 400,
                }}
                onClick={() => setActiveStep(step.id)}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = '#f8fafc';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = isDone ? '#94a3b8' : '#475569';
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 16,
                      background: '#8b5cf6',
                      borderRadius: '0 2px 2px 0',
                    }}
                  />
                )}
                <span style={{ color: isActive ? '#8b5cf6' : 'inherit' }}>{step.icon}</span>
                <span className="flex-1">{step.label}</span>
                {isDone && <Check size={12} style={{ color: '#22c55e', flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content header */}
        <div
          className="flex-shrink-0 flex items-center"
          style={{
            padding: '20px 40px 0',
            background: 'var(--bg-primary)',
          }}
        >
          <div>
            <h1 className="text-2xl font-medium text-white tracking-tight">
              {STEPS.find(s => s.id === activeStep)?.label}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {activeStep === 'workspace' && 'Name your workspace and select a project directory.'}
              {activeStep === 'engines' && 'Install and manage the autonomous agents available in your workspace.'}
              {activeStep === 'layout' && 'Choose your terminal layout template.'}
              {activeStep === 'theme' && 'Choose your preferred color theme.'}
              {activeStep === 'launch' && 'Review your configuration and launch your workspace.'}
            </p>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '28px 40px', background: 'var(--bg-primary)' }}>

          {/* ── Workspace ── */}
          {activeStep === 'workspace' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Workspace Name
                </label>
                <input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="form-group"
                  style={{ padding: '10px 14px', borderRadius: 8, width: '100%', fontSize: 14 }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Project Directory
                </label>
                <div
                  className="folder-selector"
                  onClick={selectFolder}
                  style={{ borderRadius: 8 }}
                >
                  <FolderOpen size={18} style={{ color: folder ? '#8b5cf6' : '#64748b', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: folder ? '#f8fafc' : '#64748b' }}>
                    {folder || 'Click to select project folder…'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── AI Engines ── */}
          {activeStep === 'engines' && (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {tools.map((tool) => (
                <EngineCard
                  key={tool.id}
                  tool={tool}
                  folder={folder}
                  onInstalled={(id) => {
                    setTools((prev) => prev.map((t) => (t.id === id ? { ...t, installed: true } : t)));
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Layout ── */}
          {activeStep === 'layout' && (
            <div className="flex flex-col gap-6">
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {WORKSPACE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    className="flex flex-col items-center gap-3 rounded-xl transition-all text-center"
                    style={{
                      padding: 20,
                      background: activeTemplate === tpl.id ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                      border: activeTemplate === tpl.id
                        ? '1px solid rgba(139,92,246,0.4)'
                        : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      boxShadow: activeTemplate === tpl.id ? '0 0 0 1px rgba(139,92,246,0.2)' : 'none',
                    }}
                    onClick={() => {
                      setActiveTemplate(tpl.id);
                      setSlots(makeSlots(tpl.agents));
                    }}
                    onMouseEnter={e => {
                      if (activeTemplate !== tpl.id) {
                        (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,255,255,0.15)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (activeTemplate !== tpl.id) {
                        (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,255,255,0.06)';
                      }
                    }}
                  >
                    <LayoutDots count={tpl.count} active={activeTemplate === tpl.id} />
                    <div>
                      <span className="text-sm font-medium text-white block">{tpl.name}</span>
                      <span className="text-xs" style={{ color: '#64748b' }}>{tpl.description}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom slots */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Custom Configuration
                </span>
                <div className="terminal-slots">
                  {slots.map((slot, i) => (
                    <div key={slot.id} className="terminal-slot">
                      <span className="slot-number">#{i + 1}</span>
                      <div className="slot-agent-select">
                        {AGENT_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            className={`slot-agent-btn ${slot.agentId === p.id ? 'active' : ''}`}
                            onClick={() => setSlots(slots.map((s) => (s.id === slot.id ? { ...s, agentId: p.id } : s)))}
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
            </div>
          )}

          {/* ── Theme ── */}
          {activeStep === 'theme' && (
            <div className="flex flex-col gap-4">
              {[
                { id: 'dark', label: 'Dark', icon: <Moon size={18} />, desc: 'High contrast dark interface.' },
                { id: 'light', label: 'Light', icon: <Sun size={18} />, desc: 'Clean light interface.' },
                { id: 'glass', label: 'Glass', icon: <Monitor size={18} />, desc: 'Purple-tinted glassmorphism.' },
              ].map((t) => (
                <button
                  key={t.id}
                  className="flex items-center gap-4 rounded-xl text-left transition-all"
                  style={{
                    padding: 16,
                    background: theme === t.id ? 'rgba(139,92,246,0.08)' : 'var(--bg-secondary)',
                    border: theme === t.id
                      ? '1px solid rgba(139,92,246,0.4)'
                      : '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setTheme(t.id as any)}
                >
                  <div
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{
                      width: 40, height: 40,
                      background: theme === t.id ? 'rgba(139,92,246,0.15)' : 'var(--bg-primary)',
                      color: theme === t.id ? 'var(--accent-purple)' : 'var(--text-secondary)',
                    }}
                  >
                    {t.icon}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium block" style={{ color: 'var(--text-primary)' }}>{t.label}</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.desc}</span>
                  </div>
                  {theme === t.id && <Check size={16} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          )}

          {/* ── Launch ── */}
          {activeStep === 'launch' && (
            <div className="flex flex-col gap-6">
              <div
                className="rounded-xl flex flex-col gap-4"
                style={{
                  padding: 20,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <h3 className="text-sm font-medium text-white">Configuration Summary</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Workspace', value: workspaceName },
                    { label: 'Folder', value: folder ? folder.split('/').slice(-2).join('/') : '—' },
                    { label: 'Engines', value: tools.filter(t => t.installed).map(t => t.name).join(', ') || 'None installed' },
                    { label: 'Terminals', value: `${slots.length} agent${slots.length !== 1 ? 's' : ''}` },
                    { label: 'Theme', value: theme.charAt(0).toUpperCase() + theme.slice(1) },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3 text-sm">
                      <span className="text-xs uppercase tracking-wider flex-shrink-0" style={{ color: '#64748b', width: 72 }}>
                        {row.label}
                      </span>
                      <span className="text-white font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!canLaunch && (
                <div
                  className="rounded-lg p-4 text-sm"
                  style={{
                    background: 'rgba(234,179,8,0.05)',
                    border: '1px solid rgba(234,179,8,0.2)',
                    color: '#fbbf24',
                  }}
                >
                  Select a project folder and install at least one AI engine to launch.
                </div>
              )}

              <button
                className="btn-launch flex items-center justify-center gap-2"
                style={{ padding: '14px 28px', fontSize: 15, width: '100%' }}
                onClick={launch}
                disabled={!canLaunch}
              >
                <Rocket size={18} />
                Launch Workspace
              </button>
            </div>
          )}
        </div>

        {/* ── Footer navigation ── */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{
            padding: '16px 40px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
          }}
        >
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={goBack}
            disabled={currentIdx === 0}
            style={{ opacity: currentIdx === 0 ? 0.3 : 1 }}
          >
            Back
          </button>
          {activeStep !== 'launch' && (
            <button
              className="flex items-center gap-2 rounded-lg text-sm font-medium transition-all"
              style={{
                padding: '8px 20px',
                background: '#8b5cf6',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(139,92,246,0.2)',
              }}
              onClick={goNext}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
            >
              Continue
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
      </div> {/* main layout */}
    </div>
  );
};

export default SetupPage;
