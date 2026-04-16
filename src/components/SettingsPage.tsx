import React, { useEffect, useState } from 'react';
import { useLabRatStore } from '../store/useTerminalStore';
import { 
  X, 
  Trash2, 
  Cpu, 
  Zap, 
  Palette, 
  BarChart3, 
  ShieldAlert,
  HardDrive
} from 'lucide-react';

interface SettingsPageProps {
  onClose: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const { theme, setTheme, resetSetup } = useLabRatStore();
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'usage' | 'data'>('general');

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
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay">
      <div className="settings-container">
        <div className="settings-sidebar">
          <div className="settings-sidebar-header">
            <Zap size={20} className="text-purple" />
            <span>Settings</span>
          </div>
          <div className="settings-nav">
            <button 
              className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <Palette size={16} /> Appearance
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'usage' ? 'active' : ''}`}
              onClick={() => setActiveTab('usage')}
            >
              <BarChart3 size={16} /> System Usage
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              <ShieldAlert size={16} /> Danger Zone
            </button>
          </div>
        </div>

        <div className="settings-main">
          <div className="settings-header">
            <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="settings-content">
            {activeTab === 'general' && (
              <div className="settings-section">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Theming</h4>
                    <p>Select your preferred visual style for Labrat Workspace.</p>
                  </div>
                  <div className="theme-grid">
                    {['dark', 'light', 'glass'].map((t) => (
                      <button 
                        key={t}
                        className={`theme-card ${theme === t ? 'active' : ''}`}
                        onClick={() => setTheme(t as any)}
                      >
                        <div className={`theme-preview ${t}`}></div>
                        <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="settings-section">
                {stats ? (
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-header">
                        <Cpu size={16} /> <span>Processor</span>
                      </div>
                      <div className="stat-value">{stats.cpu.model}</div>
                      <div className="stat-sub">Load: {stats.cpu.load.toFixed(2)} | Cores: {stats.cpu.cores}</div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-header">
                        <HardDrive size={16} /> <span>Memory / RAM</span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${stats.memory.usagePercent}%` }}
                        ></div>
                      </div>
                      <div className="stat-sub">
                        {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)} ({stats.memory.usagePercent.toFixed(1)}%)
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-header">
                        <Zap size={16} /> <span>Platform</span>
                      </div>
                      <div className="stat-value" style={{ textTransform: 'capitalize' }}>{stats.platform}</div>
                      <div className="stat-sub">Uptime: {(stats.uptime / 3600).toFixed(1)} hours</div>
                    </div>
                  </div>
                ) : (
                  <div className="loading-stats">Gathering metrics...</div>
                )}
              </div>
            )}

            {activeTab === 'data' && (
              <div className="settings-section">
                <div className="danger-card">
                  <div className="danger-info">
                    <h4>Reset Factory Settings</h4>
                    <p>This will permanently delete all workspaces, session history, and cached data. This action cannot be undone.</p>
                  </div>
                  <button className="danger-btn" onClick={handleClearData}>
                    <Trash2 size={16} /> Clear All Data
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
