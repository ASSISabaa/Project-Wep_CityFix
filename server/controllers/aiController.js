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
        res.json({
            success: true,
            data: {
                message: 'Image analysis feature coming soon',
                placeholder: true
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    chatbot,
    analyzeImage
};