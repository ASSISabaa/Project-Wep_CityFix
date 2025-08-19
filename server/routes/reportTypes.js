// server/routes/reportTypes.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'lighting',  name: 'Lighting' },
      { id: 'roads',     name: 'Roads' },
      { id: 'drainage',  name: 'Drainage' },
      { id: 'sanitation',name: 'Sanitation' },
      { id: 'parks',     name: 'Parks' }
    ]
  });
});

module.exports = router;
