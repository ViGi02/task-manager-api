require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const taskRoutes = require('./routes/tasks');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Connect to MongoDB ───────────────────────────────────────────────────────

connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── Serve frontend ───────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/tasks', taskRoutes);

// ─── 404 Catch-All ────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Task Manager API running at http://localhost:${PORT}`);
});
