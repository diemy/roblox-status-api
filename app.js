// app.js - Private Roblox Status API (Express + SQLite)
// © 2025 - minimal, production-friendly defaults

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '256kb' }));

// Optional: only allow CORS for yourself; default deny
app.use(cors({ origin: false }));

// --- Config ---
const API_KEY = process.env.API_KEY || "CHANGE_ME_SECRET";
const PORT = process.env.PORT || 10000;

// --- DB setup ---
const db = new Database('status.db');
db.pragma('journal_mode = WAL');
db.prepare(`CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL,
  sea INTEGER DEFAULT 0,
  stage TEXT DEFAULT '',
  note TEXT DEFAULT '',
  ts INTEGER DEFAULT (strftime('%s','now')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

// Helper: auth middleware (header x-api-key or ?key= for convenience)
function auth(req, res, next) {
  const key = (req.get('x-api-key') || req.query.key || '').trim();
  if (!key || key !== API_KEY) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
}

// PUBLIC healthcheck (for Render)
app.get('/health', (_req, res) => res.json({ ok: true }));

// PRIVATE: ingest status
app.post('/report', auth, (req, res) => {
  const { account, sea, stage, note, ts } = req.body || {};
  if (!account || typeof account !== 'string') {
    return res.status(400).json({ ok: false, error: 'account (string) required' });
  }
  const s = Number.isInteger(sea) ? sea : parseInt(sea || 0, 10);
  const stmt = db.prepare('INSERT INTO reports (account, sea, stage, note, ts) VALUES (?,?,?,?,?)');
  stmt.run(account, s, String(stage||''), String(note||''), Number.isInteger(ts) ? ts : Math.floor(Date.now()/1000));
  return res.json({ ok: true });
});

// PRIVATE: latest status per account
app.get('/status', auth, (_req, res) => {
  const rows = db.prepare(`
    SELECT r1.* FROM reports r1
    INNER JOIN (
      SELECT account, MAX(id) AS max_id FROM reports GROUP BY account
    ) r2 ON r1.account = r2.account AND r1.id = r2.max_id
    ORDER BY r1.account COLLATE NOCASE
  `).all();
  res.json({ ok: true, data: rows });
});

// PRIVATE: recent feed (optional)
app.get('/reports', auth, (_req, res) => {
  const limit = 200;
  const rows = db.prepare('SELECT * FROM reports ORDER BY id DESC LIMIT ?').all(limit);
  res.json({ ok: true, data: rows });
});

// 404 handler
app.use((_req, res) => res.status(404).json({ ok: false, error: 'Not Found' }));

app.listen(PORT, () => {
  console.log(`✅ Private Status API listening on :${PORT}`);
});