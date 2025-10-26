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

    async analyzeImageWithVision(imageUrl) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this city infrastructure image and provide a detailed JSON response with the following structure:
{
  "suggestedCategory": "one of: pothole, streetlight, garbage, graffiti, traffic, parks, infrastructure, sanitation, other",
  "suggestedPriority": "one of: low, medium, high, urgent",
  "suggestedTitle": "a concise title (max 60 chars)",
  "description": "detailed description (150-300 chars)",
  "severityScore": "number 1-10",
  "suggestedDepartment": "maintenance, infrastructure, sanitation, parks, traffic, or general",
  "keywords": ["array", "of", "5", "keywords"],
  "detectedIssues": ["list of specific problems visible"],
  "recommendedActions": ["suggested actions to resolve"],
  "urgencyFactors": ["reasons for urgency level"],
  "estimatedResolutionTime": "estimated hours as number",
  "safetyRisk": "low, medium, or high"
}

Be specific, accurate, and actionable. Focus on infrastructure problems visible in the image.`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageUrl,
                                    detail: 'high'
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            });

            const content = response.choices[0].message.content;

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                return {
                    ...analysis,
                    analyzedAt: new Date(),
                    confidence: 0.9,
                    model: 'gpt-4-vision'
                };
            }

            throw new Error('Could not parse AI response');

        } catch (error) {
            console.error('Vision AI analysis failed:', error);

            return {
                suggestedCategory: 'other',
                suggestedPriority: 'medium',
                suggestedTitle: 'City Issue Detected',
                description: 'Please provide details about the issue in the image.',
                severityScore: 5,
                suggestedDepartment: 'general',
                keywords: ['city', 'infrastructure', 'issue'],
                detectedIssues: ['Unable to analyze automatically'],
                recommendedActions: ['Manual review required'],
                analyzedAt: new Date(),
                confidence: 0.3,
                error: true
            };
        }
    }
}

module.exports = AIService;