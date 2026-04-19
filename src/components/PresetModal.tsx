import React from 'react';
import { AGENT_PRESETS, AgentPreset } from '../shared/presets';
import { X, Code, Bot, Zap, Terminal } from 'lucide-react';

interface PresetModalProps {
  onClose: () => void;
  onSelect: (preset: AgentPreset) => void;
}

const AGENT_META: Record<string, { icon: React.ReactNode; color: string; desc: string }> = {
  claude: {
    icon: <Code size={24} />,
    color: '#8b5cf6',
    desc: "Anthropic's terminal agent.",
  },
  opencode: {
    icon: <Bot size={24} />,
    color: '#3b82f6',
    desc: 'Local open-source models.',
  },
  gemini: {
    icon: <Zap size={24} />,
    color: '#34d399',
    desc: 'Fast multi-modal generation.',
  },
  shell: {
    icon: <Terminal size={24} />,
    color: '#94a3b8',
    desc: 'zsh / bash / powershell.',
  },
};

const PresetModal: React.FC<PresetModalProps> = ({ onClose, onSelect }) => {
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          width: 480,
          background: 'rgba(10,10,12,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '24px 24px 20px' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-white tracking-tight">Select Agent</h3>
            <button
              className="flex items-center justify-center rounded-md transition-colors"
              style={{
                width: 28, height: 28,
                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
              }}
              onClick={onClose}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#f8fafc')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#64748b')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {AGENT_PRESETS.map((preset) => {
              const meta = AGENT_META[preset.id] || { icon: <Terminal size={24} />, color: '#94a3b8', desc: preset.description };
              return (
                <button
                  key={preset.id}
                  className="text-left rounded-lg transition-all group"
                  style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                  }}
                  onClick={() => onSelect(preset)}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.background = 'rgba(255,255,255,0.06)';
                    el.style.border = `1px solid ${meta.color}4d`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.background = 'rgba(255,255,255,0.03)';
                    el.style.border = '1px solid rgba(255,255,255,0.06)';
                  }}
                >
                  <div className="mb-3" style={{ color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div className="text-sm font-medium text-white mb-1">{preset.name}</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>{meta.desc}</div>
                  {preset.installHint && (
                    <div className="text-xs mt-2 font-mono" style={{ color: '#475569' }}>
                      {preset.installHint}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresetModal;
