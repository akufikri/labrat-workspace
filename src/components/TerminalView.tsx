import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useLabRatStore } from '../store/useTerminalStore';
import '@xterm/xterm/css/xterm.css';

interface TerminalViewProps {
  sessionId: string;
  cwd?: string;
}

const TerminalView: React.FC<TerminalViewProps> = ({ sessionId, cwd }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const session = useLabRatStore((state) => state.sessions[sessionId]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#f8fafc',
        cursor: '#8b5cf6',
        selectionBackground: 'rgba(139, 92, 246, 0.3)',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 12,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    // Start PTY session
    window.electron.pty.spawn({ id: sessionId, command: session?.command, cwd });

    const removeDataListener = window.electron.pty.onData(sessionId, (data) => {
      term.write(data);
    });

    const removeExitListener = window.electron.pty.onExit(sessionId, (code) => {
      term.write(`\r\n\x1B[1;31mProcess exited with code ${code}\x1B[0m\r\n`);
    });

    term.onData((data) => {
      window.electron.pty.write(sessionId, data);
    });

    term.onResize(({ cols, rows }) => {
      window.electron.pty.resize(sessionId, cols, rows);
    });

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      removeDataListener();
      removeExitListener();
      term.dispose();
      xtermRef.current = null;
    };
  }, [sessionId]);

  return <div ref={terminalRef} style={{ width: '100%', height: '100%', padding: '0.5rem' }} />;
};

export default TerminalView;
