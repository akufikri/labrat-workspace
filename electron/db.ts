import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

const dbPath = path.join(app.getPath('userData'), 'labrat.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    projectFolder TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    workspaceId TEXT NOT NULL,
    name TEXT NOT NULL,
    command TEXT,
    FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS plugins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    installed BOOLEAN DEFAULT 0,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

export const dbService = {
  // Workspaces
  saveWorkspaces: (workspaces: any[]) => {
    const deleteSessions = db.prepare('DELETE FROM sessions');
    const deleteWorkspaces = db.prepare('DELETE FROM workspaces');
    const insertWorkspace = db.prepare('INSERT INTO workspaces (id, name, projectFolder) VALUES (?, ?, ?)');
    const insertSession = db.prepare('INSERT INTO sessions (id, workspaceId, name, command) VALUES (?, ?, ?, ?)');

    const transaction = db.transaction((wsList: any[]) => {
      deleteSessions.run();
      deleteWorkspaces.run();
      for (const ws of wsList) {
        insertWorkspace.run(ws.id, ws.name, ws.projectFolder);
        // We'll handle sessions separately or via a consolidated call
      }
    });

    transaction(workspaces);
  },

  getWorkspaces: () => {
    return db.prepare('SELECT * FROM workspaces ORDER BY createdAt DESC').all();
  },

  // Generic store for sessions
  saveAllSessions: (sessions: Record<string, any>, workspaces: any[]) => {
    const deleteSessions = db.prepare('DELETE FROM sessions');
    const insertSession = db.prepare('INSERT INTO sessions (id, workspaceId, name, command) VALUES (?, ?, ?, ?)');

    const transaction = db.transaction(() => {
      deleteSessions.run();
      for (const ws of workspaces) {
        for (const sessionId of ws.terminalIds) {
          const session = sessions[sessionId];
          if (session) {
            insertSession.run(session.id, ws.id, session.name, session.command);
          }
        }
      }
    });

    transaction();
  },

  getAllSessions: () => {
    return db.prepare('SELECT * FROM sessions').all();
  },

  // Plugins/Skills
  togglePlugin: (id: string, name: string, installed: boolean) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO plugins (id, name, installed, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
    stmt.run(id, name, installed ? 1 : 0);
  },

  getInstalledPlugins: () => {
    return db.prepare('SELECT * FROM plugins WHERE installed = 1').all();
  },

  // Settings
  setSetting: (key: string, value: string) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  },

  getSetting: (key: string) => {
    const res: any = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return res ? res.value : null;
  },

  clearData: () => {
    db.exec(`
      DELETE FROM sessions;
      DELETE FROM workspaces;
      DELETE FROM plugins;
      DELETE FROM settings;
    `);
  }
};
