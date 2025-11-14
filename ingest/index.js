const cors = require('cors');
const express = require('express');
const { createClient } = require('redis');

const app = express();

// FULL CORS FIX
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const QUEUE_NAME = 'events_queue';

// Redis client
const redisClient = createClient({ url: 'redis://127.0.0.1:6379' });

redisClient.on('error', (err) => console.error('Redis error:', err));

(async () => {
  await redisClient.connect();
  console.log('Connected to Redis.');
})();

// =======================
// POST /event
// =======================
app.post('/event', async (req, res) => {
  const { site_id, event_type, path, user_id, timestamp } = req.body || {};

  if (!site_id || !event_type) {
    return res.status(400).json({ error: "site_id and event_type are required" });
  }

  const event = {
    site_id,
    event_type,
    path: path || "/",
    user_id: user_id || null,
    timestamp: timestamp || new Date().toISOString()
  };

  try {
    await redisClient.lPush(QUEUE_NAME, JSON.stringify(event));
    return res.status(202).json({ message: "accepted" });
  } catch (err) {
    console.error("enqueue error:", err);
    return res.status(500).json({ error: "enqueue_failed" });
  }
});

// =======================
// GET /queue-size
// =======================
app.get('/queue-size', async (req, res) => {
  try {
    const size = await redisClient.lLen(QUEUE_NAME);
    res.send(size.toString());
  } catch (err) {
    console.error("Queue size error:", err);
    res.status(500).send("0");
  }
});

app.listen(3000, () => console.log("Ingestion API running on port 3000."));
