'use strict';
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/doctors',       require('./routes/doctors'));
app.use('/api/patients',      require('./routes/patients'));
app.use('/api/appointments',  require('./routes/appointments'));
app.use('/api/medicines',     require('./routes/medicines'));
app.use('/api/prescriptions', require('./routes/prescriptions'));

// ─── Catch-all: serve index.html for any non-API route ────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🏥  MediCore server running at http://localhost:${PORT}`);
  console.log(`📡  API base: http://localhost:${PORT}/api`);
  console.log(`\nPress Ctrl+C to stop.\n`);
});
