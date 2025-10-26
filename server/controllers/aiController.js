const AIService = require('../services/AIService');

const chatbot = async (req, res, next) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const aiService = new AIService();
        const response = await aiService.chatbotResponse(message, {
            ...context,
            userId: req.user._id,
            tenantId: req.user.tenant
        });

        res.json({
            success: true,
            data: {
                message: response,
                timestamp: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
};

const analyzeImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const aiService = new AIService();
        const imageUrl = req.file.location || req.file.path;

        const analysis = await aiService.analyzeImageWithVision(imageUrl);

        res.json({
            success: true,
            data: {
                analysis,
                imageUrl
            }
        });
    } catch (error) {
        console.error('Image analysis error:', error);
        next(error);
    }
};

module.exports = {
    chatbot,
    analyzeImage
};