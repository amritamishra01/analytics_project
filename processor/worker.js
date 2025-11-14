const { createClient } = require('redis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log("RUNNING WORKER FILE FROM:", __filename);   // <--- VERY IMPORTANT

const DB_FILE = path.join(__dirname, '..', 'analytics.db');
const QUEUE_NAME = 'events_queue';

// Redis Client
const redis = createClient({ url: 'redis://127.0.0.1:6379' });
redis.on('error', (err) => console.error('Redis error:', err));

// SQLite DB
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error("DB Error:", err);
  console.log("Processor connected to SQLite:", DB_FILE);
});

// Create table
db.run(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    path TEXT,
    user_id TEXT,
    timestamp TEXT NOT NULL
  )
`);

async function processQueue() {
  await redis.connect();
  console.log("Processor connected to Redis. Waiting for events...");

  while (true) {
    try {
      const result = await redis.brPop(QUEUE_NAME, 0);
      const event = JSON.parse(result.element);

      // 1. Artificial delay so UI can show queue growing
      await new Promise(r => setTimeout(r, 1500));

      // 2. Save event
      db.run(
        `INSERT INTO events (site_id, event_type, path, user_id, timestamp)
         VALUES (?, ?, ?, ?, ?)`,
        [event.site_id, event.event_type, event.path, event.user_id, event.timestamp],
        function (err) {
          if (err) console.error("DB write error:", err.message);
          else console.log("Event saved:", event.site_id, event.path);
        }
      );
    } catch (err) {
      console.error("Processor Error:", err);
    }
  }
}

processQueue();
