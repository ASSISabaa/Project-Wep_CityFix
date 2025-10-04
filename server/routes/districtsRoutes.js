const express = require('express');
const router = express.Router();

// Get all districts
router.get('/', async (req, res) => {
  try {
    const districts = [
      { id: 1, value: 'downtown', name: 'Downtown', slug: 'downtown' },
      { id: 2, value: 'north', name: 'North District', slug: 'north' },
      { id: 3, value: 'south', name: 'South District', slug: 'south' },
      { id: 4, value: 'east', name: 'East District', slug: 'east' },
      { id: 5, value: 'west', name: 'West District', slug: 'west' },
      { id: 6, value: 'central', name: 'Central', slug: 'central' }
    ];

    res.json({
      success: true,
      data: districts,
      count: districts.length
    });
  } catch (error) {
    console.error('Districts fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts'
    });
  }
});

module.exports = router;