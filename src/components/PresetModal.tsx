import React from 'react';
import { AGENT_PRESETS, AgentPreset } from '../shared/presets';
import { X, Search, Terminal, Bot, Code, Zap } from 'lucide-react';

interface PresetModalProps {
  onClose: () => void;
  onSelect: (preset: AgentPreset) => void;
}

const IconMap: Record<string, React.ReactNode> = {
  terminal: <Terminal size={20} />,
  bot: <Bot size={20} />,
  code: <Code size={20} />,
  zap: <Zap size={20} />,
};

const PresetModal: React.FC<PresetModalProps> = ({ onClose, onSelect }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Agent Preset</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="preset-grid">
          {AGENT_PRESETS.map((preset) => (
            <div 
              key={preset.id} 
              className="preset-card"
              onClick={() => onSelect(preset)}
            >
              <div className="preset-icon">
                {IconMap[preset.icon] || <Terminal size={20} />}
              </div>
              <div className="preset-info">
                <h3>{preset.name}</h3>
                <p>{preset.description}</p>
                {preset.command && <code>{preset.command}</code>}
                {preset.installHint && (
                  <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    install: {preset.installHint}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PresetModal;
