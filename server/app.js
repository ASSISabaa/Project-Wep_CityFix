// server/app.js 
const express = require('express');
const cors = require('cors');
const impactRoutes = require('./routes/impact');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/impact', impactRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

module.exports = app;
