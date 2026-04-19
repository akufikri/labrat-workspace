import React, { useEffect, useState } from 'react';
import { useLabRatStore } from '../store/useTerminalStore';
import {
  X,
  Palette,
  Server,
  AlertTriangle,
  Trash2,
  Cpu,
  HardDrive,
  Zap,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';

interface SettingsPageProps {
  onClose: () => void;
}

type Tab = 'appearance' | 'system' | 'danger';

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const { theme, setTheme, resetSetup } = useLabRatStore();
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('appearance');

  useEffect(() => {
    const fetchStats = async () => {
      const s = await (window as any).electron.system.getStats();
      setStats(s);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data? This will reset the app.')) {
      await (window as any).electron.db.clearAll();
      resetSetup();
      onClose();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const navItems: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'appearance', icon: <Palette size={18} />, label: 'Appearance' },
    { id: 'system', icon: <Server size={18} />, label: 'System' },
    { id: 'danger', icon: <AlertTriangle size={18} />, label: 'Danger Zone' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="flex overflow-hidden rounded-2xl"
        style={{
          width: 700,
          height: 520,
          maxWidth: '90vw',
          maxHeight: '90vh',
          background: 'rgba(10,10,12,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon sidebar */}
        <div
          className="flex flex-col items-center py-5 gap-4"
          style={{
            width: 56,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          {navItems.filter(i => i.id !== 'danger').map(item => (
            <button
              key={item.id}
              title={item.label}
              className="flex items-center justify-center rounded-lg transition-all"
              style={{
                width: 36, height: 36,
                background: activeTab === item.id ? 'rgba(255,255,255,0.08)' : 'none',
                border: 'none',
                color: activeTab === item.id ? '#f8fafc' : '#64748b',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={e => {
                if (activeTab !== item.id) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#f8fafc';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== item.id) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                  (e.currentTarget as HTMLButtonElement).style.background = 'none';
                }
              }}
            >
              {item.icon}
            </button>
          ))}
          <div className="flex-1" />
          {/* Danger zone at bottom */}
          <button
            title="Danger Zone"
            className="flex items-center justify-center rounded-lg transition-all"
            style={{
              width: 36, height: 36,
              background: activeTab === 'danger' ? 'rgba(239,68,68,0.1)' : 'none',
              border: 'none',
              color: activeTab === 'danger' ? '#f87171' : '#64748b',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('danger')}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)';
            }}
            onMouseLeave={e => {
              if (activeTab !== 'danger') {
                (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }
            }}
          >
            <AlertTriangle size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content header */}
          <div
            className="flex justify-between items-center flex-shrink-0"
            style={{
              padding: '20px 28px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h2 className="text-lg font-medium text-white tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
            <button
              className="flex items-center justify-center rounded-md transition-colors"
              style={{
                width: 28, height: 28,
                background: 'rgba(255,255,255,0.04)',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
              }}
              onClick={onClose}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#f8fafc')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#64748b')}
            >
              <X size={15} />
            </button>
          </div>

          {/* Content body */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '24px 28px' }}>
            {activeTab === 'appearance' && (
              <div className="flex flex-col gap-8">
                {/* Theme */}
                <div>
                  <label
                    className="block text-xs font-medium uppercase tracking-wider mb-3"
                    style={{ color: '#64748b' }}
                  >
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {[
                      { id: 'dark', label: 'Dark', icon: <Moon size={15} /> },
                      { id: 'light', label: 'Light', icon: <Sun size={15} /> },
                      { id: 'glass', label: 'Glass', icon: <Monitor size={15} /> },
                    ].map(t => (
                      <button
                        key={t.id}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg transition-all text-sm font-medium"
                        style={{
                          padding: '10px 16px',
                          border: theme === t.id ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.06)',
                          background: theme === t.id ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                          color: theme === t.id ? '#c4b5fd' : '#64748b',
                          cursor: 'pointer',
                        }}
                        onClick={() => setTheme(t.id as any)}
                        onMouseEnter={e => {
                          if (theme !== t.id) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={e => {
                          if (theme !== t.id) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                        }}
                      >
                        {t.icon}
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <label
                    className="block text-xs font-medium uppercase tracking-wider mb-3"
                    style={{ color: '#64748b' }}
                  >
                    Accent Color
                  </label>
                  <div className="flex gap-3">
                    {['#8b5cf6', '#3b82f6', '#10b981', '#f43f5e'].map((c) => (
                      <div
                        key={c}
                        className="w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="flex flex-col gap-3">
                {stats ? (
                  <>
                    <div
                      className="p-4 rounded-lg flex flex-col gap-2"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-medium" style={{ color: '#64748b' }}>
                        <Cpu size={14} /> Processor
                      </div>
                      <div className="text-sm font-medium text-white">{stats.cpu.model}</div>
                      <div className="text-xs" style={{ color: '#64748b' }}>
                        Load: {stats.cpu.load.toFixed(2)} · Cores: {stats.cpu.cores}
                      </div>
                    </div>

                    <div
                      className="p-4 rounded-lg flex flex-col gap-2"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-medium" style={{ color: '#64748b' }}>
                        <HardDrive size={14} /> Memory
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${stats.memory.usagePercent}%`, background: '#8b5cf6' }}
                        />
                      </div>
                      <div className="text-xs" style={{ color: '#64748b' }}>
                        {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)} ({stats.memory.usagePercent.toFixed(1)}%)
                      </div>
                    </div>

                    <div
                      className="p-4 rounded-lg flex flex-col gap-2"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-medium" style={{ color: '#64748b' }}>
                        <Zap size={14} /> Platform
                      </div>
                      <div className="text-sm font-medium text-white capitalize">{stats.platform}</div>
                      <div className="text-xs" style={{ color: '#64748b' }}>
                        Uptime: {(stats.uptime / 3600).toFixed(1)} hours
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm" style={{ color: '#64748b' }}>Gathering metrics...</div>
                )}
              </div>
            )}

            {activeTab === 'danger' && (
              <div>
                <div
                  className="p-5 rounded-lg"
                  style={{
                    border: '1px solid rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.04)',
                  }}
                >
                  <h4 className="text-sm font-semibold mb-2" style={{ color: '#f87171' }}>
                    Reset App Data
                  </h4>
                  <p className="text-sm mb-5" style={{ color: '#64748b' }}>
                    This will clear all workspaces, layouts, and engine configurations. Cannot be undone.
                  </p>
                  <button
                    className="w-full flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      padding: '10px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#f87171',
                      cursor: 'pointer',
                    }}
                    onClick={handleClearData}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'}
                  >
                    <Trash2 size={14} />
                    Erase Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
