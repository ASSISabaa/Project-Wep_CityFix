const express = require('express');
const router = express.Router();

// Get all report types
router.get('/', async (req, res) => {
  try {
    const reportTypes = [
      { id: 1, value: 'pothole', name: 'Pothole', icon: '🕳️', priority: 'high' },
      { id: 2, value: 'lighting', name: 'Street Lighting', icon: '💡', priority: 'medium' },
      { id: 3, value: 'drainage', name: 'Drainage Issue', icon: '💧', priority: 'high' },
      { id: 4, value: 'traffic', name: 'Traffic Signal', icon: '🚦', priority: 'urgent' },
      { id: 5, value: 'garbage', name: 'Garbage Collection', icon: '🗑️', priority: 'medium' },
      { id: 6, value: 'sidewalk', name: 'Sidewalk Damage', icon: '🚶', priority: 'medium' },
      { id: 7, value: 'graffiti', name: 'Graffiti', icon: '🎨', priority: 'low' },
      { id: 8, value: 'other', name: 'Other', icon: '📍', priority: 'low' }
    ];

    res.json({
      success: true,
      data: reportTypes,
      count: reportTypes.length
    });
  } catch (error) {
    console.error('Report types fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report types'
    });
  }
});

module.exports = router;