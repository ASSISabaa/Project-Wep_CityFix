const OpenAI = require('openai');
const { REPORT_TYPES, REPORT_PRIORITY } = require('../config/constants');

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async analyzeReport(reportData) {
        try {
            const prompt = `
                Analyze this city issue report and provide:
                1. Suggested category from: ${Object.values(REPORT_TYPES).join(', ')}
                2. Suggested priority from: ${Object.values(REPORT_PRIORITY).join(', ')}
                3. Suggested department from: maintenance, infrastructure, sanitation, parks, traffic, general
                4. Severity level (low, medium, high)
                5. Keywords (max 5)
                
                Report Title: ${reportData.title}
                Description: ${reportData.description}
                Type: ${reportData.type}
                
                Respond in JSON format.
            `;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.3,
                max_tokens: 200
            });

            const analysis = JSON.parse(response.choices[0].message.content);

            return {
                category: analysis.category || reportData.type,
                suggestedPriority: analysis.priority,
                suggestedDepartment: analysis.department,
                severity: analysis.severity,
                keywords: analysis.keywords || [],
                analyzedAt: new Date()
            };
        } catch (error) {
            console.error('AI Analysis failed:', error);
            return {
                category: reportData.type,
                analyzedAt: new Date()
            };
        }
    }

    async chatbotResponse(message, context = {}) {
        try {
            const systemPrompt = `
                You are CityFix Assistant, helping citizens report city issues.
                Be helpful, concise, and friendly.
                Available issue types: ${Object.values(REPORT_TYPES).join(', ')}
            `;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 150
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Chatbot failed:', error);
            return 'I apologize, but I am having trouble understanding. Please try rephrasing your question.';
        }
    }
}

module.exports = AIService;