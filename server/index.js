// server/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { pool, initDatabase } = require('./db');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for mobile apps & web
app.use(cors());
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ── Health Check Endpoint ──
app.get('/api/health', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 as isAlive');
    res.json({
      status: 'ok',
      message: 'Explorify backend is running',
      database: 'connected',
      razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// ── Mount Route Modules ──
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Listen on all network interfaces (0.0.0.0) so Android Emulator (10.0.2.2) and Physical Devices (Wi-Fi IP) can connect
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Explorify Backend Server running on http://0.0.0.0:${PORT}`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`   - Razorpay Endpoints mounted at: http://0.0.0.0:${PORT}/api/payment/*`);
  await initDatabase();
});
