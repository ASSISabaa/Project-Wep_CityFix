// server/services/AdvancedAIService.js
const OpenAI = require('openai');
const { REPORT_TYPES, REPORT_PRIORITY } = require('../config/constants');

class AdvancedAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-not-used'
    });
    
    // Context window 
    this.conversationContexts = new Map();
    
    // System prompts 
    this.systemPrompts = {
      CITIZEN: {
        en: "You are CityFix Assistant, helping citizens report and track city issues. Be friendly, helpful, and guide them through the reporting process. Suggest report types, priority levels, and provide status updates.",
        ar: "أنت مساعد CityFix، تساعد المواطنين في الإبلاغ عن مشاكل المدينة وتتبعها. كن ودوداً ومفيداً وأرشدهم خلال عملية الإبلاغ. اقترح أنواع البلاغات ومستويات الأولوية وقدم تحديثات الحالة.",
        he: "אתה עוזר CityFix, עוזר לאזרחים לדווח ולעקוב אחר בעיות בעיר. היה ידידותי, מועיל והדרך אותם בתהליך הדיווח. הצע סוגי דיווחים, רמות עדיפות וספק עדכוני סטטוס.",
        ru: "Вы помощник CityFix, помогающий гражданам сообщать о городских проблемах и отслеживать их. Будьте дружелюбны, полезны и направляйте их в процессе отчетности. Предлагайте типы отчетов, уровни приоритета и предоставляйте обновления статуса."
      },
      EMPLOYEE: {
        en: "You are CityFix Work Assistant for municipal employees. Help them prioritize tasks, understand technical requirements, suggest solutions, and provide efficiency tips. Be professional and solution-oriented.",
        ar: "أنت مساعد عمل CityFix لموظفي البلدية. ساعدهم في ترتيب أولويات المهام وفهم المتطلبات الفنية واقتراح الحلول وتقديم نصائح الكفاءة. كن محترفاً وموجهاً نحو الحلول.",
        he: "אתה עוזר העבודה של CityFix לעובדי עירייה. עזור להם לתעדף משימות, להבין דרישות טכניות, להציע פתרונות ולספק טיפים ליעילות. היה מקצועי וממוקד בפתרונות.",
        ru: "Вы рабочий помощник CityFix для муниципальных служащих. Помогайте им расставлять приоритеты задач, понимать технические требования, предлагать решения и давать советы по эффективности. Будьте профессиональны и ориентированы на решения."
      },
      MANAGER: {
        en: "You are CityFix Management Assistant. Provide strategic insights, analytics interpretation, resource optimization suggestions, team performance analysis, and budget recommendations. Be analytical and data-driven.",
        ar: "أنت مساعد إدارة CityFix. قدم رؤى استراتيجية وتفسير التحليلات واقتراحات تحسين الموارد وتحليل أداء الفريق وتوصيات الميزانية. كن تحليلياً ومعتمداً على البيانات.",
        he: "אתה עוזר הניהול של CityFix. ספק תובנות אסטרטגיות, פרשנות אנליטיקה, הצעות לאופטימיזציה של משאבים, ניתוח ביצועי צוות והמלצות תקציב. היה אנליטי ומבוסס נתונים.",
        ru: "Вы помощник по управлению CityFix. Предоставляйте стратегические идеи, интерпретацию аналитики, предложения по оптимизации ресурсов, анализ производительности команды и рекомендации по бюджету. Будьте аналитичны и основывайтесь на данных."
      },
      MUNICIPALITY_ADMIN: {
        en: "You are CityFix Executive Assistant. Provide comprehensive municipal insights, strategic planning advice, financial analysis, policy recommendations, and operational excellence strategies. Be executive-level and forward-thinking.",
        ar: "أنت المساعد التنفيذي لـ CityFix. قدم رؤى بلدية شاملة ونصائح التخطيط الاستراتيجي والتحليل المالي وتوصيات السياسات واستراتيجيات التميز التشغيلي. كن على مستوى تنفيذي ومستقبلي.",
        he: "אתה העוזר המנהלתי של CityFix. ספק תובנות עירוניות מקיפות, ייעוץ תכנון אסטרטגי, ניתוח פיננסי, המלצות מדיניות ואסטרטגיות למצוינות תפעולית. היה ברמה מנהלתית ומתכנן קדימה.",
        ru: "Вы исполнительный помощник CityFix. Предоставляйте комплексные муниципальные идеи, советы по стратегическому планированию, финансовый анализ, рекомендации по политике и стратегии операционного совершенства. Будьте на уровне руководителя и мыслите перспективно."
      }
    };
  }

  async chat(userId, message, language = 'en', userRole = 'CITIZEN', additionalContext = {}) {
    try {
      let context = this.conversationContexts.get(userId) || [];
      
      const systemPrompt = this.systemPrompts[userRole]?.[language] || this.systemPrompts.CITIZEN.en;
      
      const messages = [
        { 
          role: 'system', 
          content: systemPrompt + `\n\nUser context: ${JSON.stringify(additionalContext)}`
        },
        ...context,
        { role: 'user', content: message }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      const aiMessage = response.choices[0].message.content;

      context.push({ role: 'user', content: message });
      context.push({ role: 'assistant', content: aiMessage });
      
      if (context.length > 20) {
        context = context.slice(-20);
      }
      
      this.conversationContexts.set(userId, context);

      return {
        response: aiMessage,
        timestamp: new Date(),
        language,
        contextLength: context.length / 2
      };
    } catch (error) {
      console.error('Chat error:', error);
      return {
        response: this.getFallbackMessage(language),
        error: true
      };
    }
  }

  async analyzeReport(reportData, language = 'en') {
    try {
      const prompt = `
Analyze this city issue report and provide detailed insights in JSON format:

Report Details:
- Title: ${reportData.title}
- Description: ${reportData.description}
- Type: ${reportData.type}
- Location: ${reportData.location?.address || 'Not specified'}

Please provide:
1. suggestedCategory: Best matching category
2. suggestedPriority: Priority level
3. suggestedDepartment: Best department
4. severityScore: Number 1-10
5. estimatedResolutionTime: In hours
6. estimatedCost: In local currency
7. urgencyFactors: Array of reasons
8. keywords: Top 5 keywords
9. recommendedActions: Array of 3-5 action steps

Respond in valid JSON format only.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0].message.content);

      return {
        ...analysis,
        analyzedAt: new Date(),
        language,
        confidence: 0.85 
      };
    } catch (error) {
      console.error('Report analysis error:', error);
      return this.getBasicAnalysis(reportData);
    }
  }

  async getManagerInsights(tenantId, timeframe = '30days', language = 'en') {
    try {
      const Report = require('../models/Report');
      const User = require('../models/User');

      const [reports, employees, stats] = await Promise.all([
        Report.find({ tenant: tenantId })
          .sort('-createdAt')
          .limit(100)
          .lean(),
        User.find({ tenant: tenantId, role: 'EMPLOYEE' })
          .select('username statistics')
          .lean(),
        this.getBasicStats(tenantId)
      ]);

      const prompt = `
As a municipal management AI consultant, analyze this data:

Statistics:
- Total Reports: ${stats.total}
- Resolved: ${stats.resolved}
- Pending: ${stats.pending}

Provide JSON with insights and recommendations.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        response_format: { type: 'json_object' }
      });

      return {
        insights: JSON.parse(response.choices[0].message.content),
        generatedAt: new Date(),
        dataPoints: reports.length,
        language
      };
    } catch (error) {
      console.error('Manager insights error:', error);
      return { error: 'Failed to generate insights' };
    }
  }

  getFallbackMessage(language) {
    const messages = {
      en: "I'm having trouble responding right now. Please try again.",
      ar: "أواجه مشكلة في الرد الآن. يرجى المحاولة مرة أخرى.",
      he: "יש לי בעיה להגיב כרגע. נסה שוב.",
      ru: "У меня проблемы с ответом. Попробуйте снова."
    };
    return messages[language] || messages.en;
  }

  getBasicAnalysis(reportData) {
    return {
      suggestedCategory: reportData.type,
      suggestedPriority: 'medium',
      suggestedDepartment: 'general',
      severityScore: 5,
      analyzedAt: new Date(),
      confidence: 0.5
    };
  }

  async getBasicStats(tenantId) {
    const Report = require('../models/Report');
    const total = await Report.countDocuments({ tenant: tenantId });
    const resolved = await Report.countDocuments({ tenant: tenantId, status: 'resolved' });
    const pending = await Report.countDocuments({ tenant: tenantId, status: 'pending' });
    
    return {
      total,
      resolved,
      pending,
      resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0,
      avgResolutionTime: 24
    };
  }

  clearConversation(userId) {
    this.conversationContexts.delete(userId);
  }
}

module.exports = new AdvancedAIService();