// server/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AIService = require('../services/AIService');

const aiService = new AIService();

// Analyze report with AI
router.post('/analyze', protect, async (req, res, next) => {
    try {
        const { title, description, type, location, images } = req.body;
        
        const analysis = await aiService.analyzeReport({
            title,
            description,
            type,
            location,
            images
        });
        
        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        next(error);
    }
});

// Get AI suggestions
router.post('/suggest', protect, async (req, res, next) => {
    try {
        const { type, description, language = 'en' } = req.body;
        
        const suggestions = await aiService.getSuggestions(type, description, language);
        
        res.json({
            success: true,
            data: {
                suggestions,
                language
            }
        });
    } catch (error) {
        next(error);
    }
});

// AI chat endpoint
router.post('/chat', protect, async (req, res, next) => {
    try {
        const { message, context = [], language = 'en' } = req.body;
        
        const response = await aiService.generateResponse(message, context, language);
        
        res.json({
            success: true,
            data: {
                response,
                timestamp: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get AI insights for dashboard
router.get('/insights', protect, async (req, res, next) => {
    try {
        const insights = await aiService.generateInsights(req.tenantFilter);
        
        res.json({
            success: true,
            data: insights
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;