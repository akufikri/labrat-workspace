import React, { useEffect, useRef, memo } from 'react';
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
  const fitAddonRef = useRef<FitAddon | null>(null);
  const session = useLabRatStore((state) => state.sessions[sessionId]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#050505',
        foreground: '#f8fafc',
        cursor: '#8b5cf6',
        selectionBackground: 'rgba(139, 92, 246, 0.3)',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 12,
      lineHeight: 1.4,
      allowProposedApi: true,
      scrollback: 500,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    term.open(terminalRef.current);

    // Delay initial fit to let DOM settle
    const initialFit = setTimeout(() => {
      try { fitAddon.fit(); } catch {}
    }, 50);

    xtermRef.current = term;

    // Check if PTY is already running (remount after workspace switch) or needs spawning
    window.electron.pty.getBuffer(sessionId).then((buffered) => {
      if (buffered) {
        // PTY already running — replay buffered output then attach live listener
        term.write(buffered);
      } else {
        // Fresh spawn
        window.electron.pty.spawn({ id: sessionId, command: session?.command, cwd });
      }
    });

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

    // ResizeObserver handles both container and window resize — no separate window listener needed
    let rafId: number;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        try { fitAddon.fit(); } catch {}
      });
    });
    ro.observe(terminalRef.current);

    return () => {
      clearTimeout(initialFit);
      cancelAnimationFrame(rafId);
      ro.disconnect();
      removeDataListener();
      removeExitListener();
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [sessionId]);

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '100%',
        padding: '4px 6px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    />
  );
};

export default memo(TerminalView);
