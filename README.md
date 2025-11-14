📊 Website Analytics Pipeline

A full end-to-end event tracking pipeline built using Node.js, Redis, SQLite, and a simple dashboard UI.
This project tracks website events → stores them → processes them → displays live analytics.

🚀 Features
1. Event Ingestion Service (Port 3000)

Accepts events via REST API

Pushes events into Redis queue

Endpoint:

POST /event

GET /queue-size

2. Redis Queue

Stores incoming website events

Queue name: events_queue

3. Background Processor (Worker)

Reads events from Redis queue

Saves events into SQLite database

Runs continuously using BRPOP

4. Reporting Service (Port 3001)

Fetch aggregated stats

Fetch last processed event

Endpoints:

GET /stats?site_id=demo123&date=<YYYY-MM-DD>

GET /last-event

5. Dashboard UI (Port 5500)

Interactive HTML dashboard

Sends test events

Shows live queue size

Shows stats + last event

Pipeline animation included

🏗 Project Structure
analytics-project/
│
├── ingest/        # Event API (port 3000)
├── processor/     # Worker that processes Redis events
├── reporting/     # Stats + last-event API (port 3001)
├── dashboard/     # HTML dashboard (port 5500)
└── analytics.db   # SQLite database

🖥 How to Run (Evaluator Friendly)
1️⃣ Start Redis
redis-server

Verify Redis is running
redis-cli ping


Output expected:

PONG

2️⃣ Start Event Ingestion API
cd ingest
node index.js


Expected Output:

Ingestion API running on port 3000
Connected to Redis.

3️⃣ Start Background Worker
cd processor
node worker.js


Expected Output:

Processor connected to SQLite
Processor connected to Redis. Waiting for events...
Event saved: demo123 /home

4️⃣ Start Reporting API
cd reporting
node index.js


Expected Output:

Reporting API running on port 3001
Reporting API connected to SQLite

5️⃣ Start Dashboard UI
cd dashboard
npx http-server -p 5500


Open:
👉 http://127.0.0.1:5500/

🧪 Verification Commands (Very Important for Evaluation)
Check queue size
redis-cli LLEN events_queue

Check stored events
sqlite3 analytics.db "SELECT * FROM events;"

Check services are running
netstat -ano | findstr :3000
netstat -ano | findstr :3001
