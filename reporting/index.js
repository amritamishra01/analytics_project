const cors = require("cors");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

const DB_FILE = path.join(__dirname, "..", "analytics.db");

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error("DB error:", err);
  console.log("Reporting API connected to SQLite:", DB_FILE);
});

// =======================
// GET /last-event
// =======================
app.get('/last-event', (req, res) => {
  db.get(
    `SELECT * FROM events ORDER BY id DESC LIMIT 1`,
    [],
    (err, row) => {
      if (err || !row) return res.send("No events yet");
      res.send(JSON.stringify(row, null, 2));
    }
  );
});

// =======================
// GET /stats
// =======================
app.get('/stats', (req, res) => {
  const { site_id, date } = req.query;

  if (!site_id || !date) {
    return res.status(400).json({ error: 'site_id and date are required' });
  }

  const query = `
    WITH site_events AS (
      SELECT * FROM events
      WHERE site_id = $site_id AND STRFTIME('%Y-%m-%d', timestamp) = $date
    ),
    total_views AS (
      SELECT COUNT(*) AS count FROM site_events WHERE event_type = 'page_view'
    ),
    unique_users AS (
      SELECT COUNT(DISTINCT user_id) AS count FROM site_events
    ),
    top_paths_raw AS (
      SELECT path, COUNT(*) AS views
      FROM site_events
      WHERE event_type = 'page_view'
      GROUP BY path
      ORDER BY views DESC
      LIMIT 3
    )
    SELECT
      (SELECT count FROM total_views) AS total_views,
      (SELECT count FROM unique_users) AS unique_users,
      (SELECT JSON_GROUP_ARRAY(JSON_OBJECT('path', path, 'views', views)) FROM top_paths_raw) AS top_paths;
  `;

  db.get(query, { $site_id: site_id, $date: date }, (err, row) => {
    if (err) return res.status(500).json({ error: "query_failed" });

    res.json({
      site_id,
      date,
      total_views: row.total_views || 0,
      unique_users: row.unique_users || 0,
      top_paths: row.top_paths ? JSON.parse(row.top_paths) : []
    });
  });
});

app.listen(3001, () => console.log("Reporting API running on port 3001"));
