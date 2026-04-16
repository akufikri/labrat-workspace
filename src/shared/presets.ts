export interface AgentPreset {
  id: string;
  name: string;
  command: string;
  description: string;
  icon: string;
  installHint?: string;
}

export const AGENT_PRESETS: AgentPreset[] = [
  {
    id: 'shell',
    name: 'Default Shell',
    command: '',
    description: 'System default shell (zsh/bash)',
    icon: 'terminal',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    command: 'claude',
    description: "Anthropic's official coding agent",
    icon: 'bot',
    installHint: 'npm install -g @anthropic-ai/claude-code',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    command: 'opencode',
    description: 'Open source AI coding agent for terminal & IDE',
    icon: 'code',
    installHint: 'curl -fsSL https://opencode.ai/install | bash',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    command: 'gemini',
    description: 'Google Gemini in your terminal',
    icon: 'zap',
    installHint: 'npm install -g @google/gemini-cli',
  },
];
