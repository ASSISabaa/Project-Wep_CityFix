// server/services/AdvancedAIService.js
const OpenAI = require('openai');
const { REPORT_TYPES, REPORT_PRIORITY } = require('../config/constants');

class AdvancedAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
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
      
      // System prompt 
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

  // machine learning insights
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
1. suggestedCategory: Best matching category from [${Object.values(REPORT_TYPES).join(', ')}]
2. suggestedPriority: Priority level from [${Object.values(REPORT_PRIORITY).join(', ')}]
3. suggestedDepartment: Best department from [maintenance, infrastructure, sanitation, parks, traffic, general]
4. severityScore: Number 1-10
5. estimatedResolutionTime: In hours
6. estimatedCost: In local currency (rough estimate)
7. urgencyFactors: Array of reasons for urgency
8. keywords: Top 5 relevant keywords
9. similarIssuesProbability: Likelihood of similar issues nearby (0-100%)
10. recommendedActions: Array of 3-5 specific action steps
11. safetyRisk: boolean
12. weatherDependent: boolean
13. requiresSpecialEquipment: boolean

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

      // جمع البيانات
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
As a municipal management AI consultant, analyze this data and provide strategic insights:

Statistics:
- Total Reports: ${stats.total}
- Resolved: ${stats.resolved} (${stats.resolutionRate}%)
- Average Resolution Time: ${stats.avgResolutionTime} hours
- Pending: ${stats.pending}
- High Priority: ${stats.highPriority}

Recent Trends:
${this.summarizeReports(reports)}

Team Performance:
${this.summarizeTeam(employees)}

Provide in JSON:
1. priorityRecommendations: Array of top 3 priorities
2. resourceOptimization: Suggestions for better resource allocation
3. performanceInsights: Team performance analysis
4. costSavingOpportunities: Ways to reduce costs
5. riskAreas: Areas requiring immediate attention
6. efficiencyImprovements: Process improvement suggestions
7. predictedTrends: Forecast for next 30 days
8. actionItems: Specific tasks with priority levels

Language: ${language}`;

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

  async analyzeHotspots(reports, language = 'en') {
    const locations = reports
      .filter(r => r.location?.coordinates?.lat && r.location?.coordinates?.lng)
      .map(r => ({
        lat: r.location.coordinates.lat,
        lng: r.location.coordinates.lng,
        type: r.type,
        priority: r.priority
      }));

    if (locations.length < 5) {
      return { message: 'Insufficient location data' };
    }

    const prompt = `
Analyze these report locations and identify patterns:

Locations: ${JSON.stringify(locations)}

Provide in JSON:
1. hotspots: Array of {lat, lng, issueCount, mainType}
2. patterns: Discovered spatial patterns
3. recommendations: Infrastructure improvement suggestions
4. clustering: Areas with similar issues

Language: ${language}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      return { error: 'Hotspot analysis failed' };
    }
  }

  // مساعدات مخصصة للمواطنين
  async getCitizenGuidance(reportType, language = 'en') {
    const guidancePrompts = {
      en: `Provide step-by-step guidance for reporting a ${reportType} issue. Include: what information to gather, photos to take, safety precautions, and what to expect. Keep it simple and helpful.`,
      ar: `قدم إرشادات خطوة بخطوة للإبلاغ عن مشكلة ${reportType}. قم بتضمين: المعلومات التي يجب جمعها، والصور التي يجب التقاطها، واحتياطات السلامة، وما يمكن توقعه. اجعلها بسيطة ومفيدة.`,
      he: `ספק הדרכה שלב אחר שלב לדיווח על בעיית ${reportType}. כלול: איזה מידע לאסוף, תמונות לצלם, אמצעי בטיחות ומה לצפות. שמור על זה פשוט ומועיל.`,
      ru: `Предоставьте пошаговое руководство для сообщения о проблеме ${reportType}. Включите: какую информацию собрать, какие фотографии сделать, меры безопасности и чего ожидать. Держите это просто и полезно.`
    };

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: guidancePrompts[language] || guidancePrompts.en
        }],
        temperature: 0.7,
        max_tokens: 300
      });

      return {
        guidance: response.choices[0].message.content,
        reportType,
        language
      };
    } catch (error) {
      return { error: 'Failed to generate guidance' };
    }
  }

  // Helper methods
  getFallbackMessage(language) {
    const messages = {
      en: "I'm having trouble responding right now. Please try again in a moment.",
      ar: "أواجه مشكلة في الرد الآن. يرجى المحاولة مرة أخرى بعد لحظة.",
      he: "יש לי בעיה להגיב כרגע. נסה שוב עוד רגע.",
      ru: "У меня проблемы с ответом прямо сейчас. Пожалуйста, попробуйте снова через мгновение."
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
    const highPriority = await Report.countDocuments({ tenant: tenantId, priority: 'high' });
    
    return {
      total,
      resolved,
      pending,
      highPriority,
      resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0,
      avgResolutionTime: 24
    };
  }

  summarizeReports(reports) {
    const types = {};
    reports.forEach(r => {
      types[r.type] = (types[r.type] || 0) + 1;
    });
    return Object.entries(types)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
  }

  summarizeTeam(employees) {
    return `${employees.length} employees active`;
  }

  clearConversation(userId) {
    this.conversationContexts.delete(userId);
  }
}

module.exports = new AdvancedAIService();