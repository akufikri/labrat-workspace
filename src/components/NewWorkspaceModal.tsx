import React, { useState } from 'react';
import { X, Terminal, Plus, Check } from 'lucide-react';
import { AGENT_PRESETS } from '../shared/presets';

interface TerminalSlot {
  id: string;
  agentId: string;
}

interface WorkspaceTemplate {
  id: string;
  name: string;
  count: number;
  agents: string[];
  description: string;
}

const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  { id: 'solo',     name: 'Solo Agent',     count: 1, agents: ['claude'],                                    description: '1 focused agent terminal' },
  { id: 'dual',     name: 'Dual Agent',     count: 2, agents: ['claude', 'claude'],                          description: '2 parallel agent terminals' },
  { id: 'triple',   name: 'Triple Agent',   count: 3, agents: ['claude', 'claude', 'claude'],                description: '3 concurrent agent terminals' },
  { id: 'multiple', name: 'Multiple Agent', count: 4, agents: ['claude', 'claude', 'claude', 'claude'],      description: '4 agent terminals, max coverage' },
];

const IconMap: Record<string, React.ReactNode> = {
  terminal: <Terminal size={13} />,
  bot:      <Terminal size={13} />,
  code:     <Terminal size={13} />,
  zap:      <Terminal size={13} />,
};

const LayoutDots: React.FC<{ count: number; active: boolean }> = ({ count, active }) => {
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
  return (
    <div className="layout-dots" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`layout-dot ${active ? 'active' : ''}`} />
      ))}
    </div>
  );
};

const makeSlots = (agents: string[]): TerminalSlot[] =>
  agents.map((agentId) => ({ id: Math.random().toString(36).substr(2, 6), agentId }));

interface Props {
  workspaceCount: number;
  defaultFolder?: string;
  onConfirm: (name: string, agents: Array<{ name: string; command: string }>) => void;
  onClose: () => void;
}

const NewWorkspaceModal: React.FC<Props> = ({ workspaceCount, defaultFolder, onConfirm, onClose }) => {
  const [activeTemplate, setActiveTemplate] = useState<string | null>('solo');
  const [slots, setSlots] = useState<TerminalSlot[]>(makeSlots(['claude']));
  const wsName = `workspace${workspaceCount + 1}`;

  const applyTemplate = (tpl: WorkspaceTemplate) => {
    setActiveTemplate(tpl.id);
    setSlots(makeSlots(tpl.agents));
  };

  const addSlot = () => {
    if (slots.length >= 6) return;
    setActiveTemplate(null);
    setSlots([...slots, { id: Math.random().toString(36).substr(2, 6), agentId: 'claude' }]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 1) return;
    setActiveTemplate(null);
    setSlots(slots.filter((s) => s.id !== id));
  };

  const changeAgent = (id: string, agentId: string) => {
    setActiveTemplate(null);
    setSlots(slots.map((s) => (s.id === id ? { ...s, agentId } : s)));
  };

  const handleConfirm = () => {
    const agents = slots.map((slot) => {
      const preset = AGENT_PRESETS.find((p) => p.id === slot.agentId) || AGENT_PRESETS[0];
      return { name: preset.name, command: preset.command };
    });
    onConfirm(wsName, agents);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass nw-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>New Workspace</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {wsName} · {defaultFolder?.split('/').pop() || 'no folder'}
            </p>
          </div>
          <button className="btn-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Templates */}
        <p className="section-label" style={{ marginBottom: '0.5rem' }}>TEMPLATES</p>
        <div className="template-grid nw-template-grid">
          {WORKSPACE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              className={`template-card ${activeTemplate === tpl.id ? 'active' : ''}`}
              onClick={() => applyTemplate(tpl)}
            >
              <LayoutDots count={tpl.count} active={activeTemplate === tpl.id} />
              <span className="template-name">{tpl.name}</span>
              <span className="template-desc">{tpl.description}</span>
            </button>
          ))}
        </div>

        {/* Manual config */}
        <p className="section-label" style={{ margin: '1rem 0 0.5rem' }}>CONFIGURE</p>
        <div className="terminal-slots nw-slots">
          {slots.map((slot, i) => {
            const preset = AGENT_PRESETS.find((p) => p.id === slot.agentId) || AGENT_PRESETS[0];
            return (
              <div key={slot.id} className="terminal-slot">
                <span className="slot-number">#{i + 1}</span>
                <div className="slot-agent-select">
                  {AGENT_PRESETS.filter((p) => p.id !== 'shell').map((p) => (
                    <button
                      key={p.id}
                      className={`slot-agent-btn ${slot.agentId === p.id ? 'active' : ''}`}
                      onClick={() => changeAgent(slot.id, p.id)}
                    >
                      {IconMap[p.icon] || <Terminal size={13} />}
                      <span>{p.name}</span>
                    </button>
                  ))}
                  <button
                    className={`slot-agent-btn ${slot.agentId === 'shell' ? 'active' : ''}`}
                    onClick={() => changeAgent(slot.id, 'shell')}
                  >
                    <Terminal size={13} /><span>Shell</span>
                  </button>
                </div>
                <div className="slot-preview"><code>{preset.command || '$SHELL'}</code></div>
                <button className="slot-remove" onClick={() => removeSlot(slot.id)} disabled={slots.length <= 1}>
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>

        <button className="btn-add-slot" onClick={addSlot} disabled={slots.length >= 6} style={{ marginTop: '0.5rem' }}>
          <Plus size={13} /> Add Terminal {slots.length >= 6 && '(max 6)'}
        </button>

        {/* Footer */}
        <div className="nw-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirm}>
            <Check size={15} /> Create Workspace
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewWorkspaceModal;
