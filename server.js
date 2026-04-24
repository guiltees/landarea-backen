'use strict';

const express = require('express');
const app     = express();
const PORT    = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS — open for mobile app calls
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
const plantsRouter = require('./routes/plants');
const careRouter   = require('./routes/care');

app.use('/plants', plantsRouter);
app.use('/care',   careRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service:  'LandArea — Terrace Garden API',
    version:  '1.0.0',
    status:   'running',
    language: 'Hindi-first, rule-based',
    endpoints: {
      'GET /plants':                    'सभी पौधों की सूची',
      'GET /plants?category=leafy':     'श्रेणी के अनुसार फ़िल्टर',
      'GET /plants?grouped=true':       'श्रेणीवार गुट',
      'GET /plants?search=tomato':      'नाम से खोजें',
      'GET /plants/:name':              'एक पौधे की जानकारी',
      'GET /care?plant=Cucumber&day=5': 'देखभाल की सलाह',
      'GET /care?plant=Tomato&day=20&season=summer': 'मौसम के अनुसार सलाह',
      'GET /care/multi?plants=Cucumber,Tomato&day=15': 'एक साथ कई पौधों की सलाह'
    }
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error:   'Route नहीं मिला',
    hint:    'GET / से सभी endpoints देखें'
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({
    success: false,
    error:   'Server Error — कुछ गड़बड़ हुई',
    detail:  process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  LandArea Garden API चालू है — Port ${PORT}`);
  console.log(`📡  Health check: http://localhost:${PORT}/`);
  console.log(`🌱  Plants API:   http://localhost:${PORT}/plants`);
  console.log(`💧  Care API:     http://localhost:${PORT}/care?plant=Cucumber&day=5`);
});

module.exports = app;
