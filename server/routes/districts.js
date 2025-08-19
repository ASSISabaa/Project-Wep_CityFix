const express = require('express');
const router = express.Router();

// Static list; replace with DB if needed
const DISTRICTS = [
  { id: 'downtown', name: 'Downtown', value: 'downtown' },
  { id: 'northside', name: 'Northside', value: 'northside' },
  { id: 'westend', name: 'West End', value: 'westend' },
  { id: 'eastside', name: 'Eastside', value: 'eastside' },
  { id: 'suburbs', name: 'Suburbs', value: 'suburbs' },
];

router.get('/', async (_req, res) => {
  res.json({ success: true, data: DISTRICTS });
});

module.exports = router;
