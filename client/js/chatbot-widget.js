// server/services/EnhancedAIService.js
const OpenAI = require('openai');
const { REPORT_TYPES, REPORT_PRIORITY } = require('../config/constants');

class EnhancedAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.conversationContexts = new Map();
    
    this.systemPrompts = {
      CITIZEN: {
        en: `You are a professional CityFix support agent. Your role is to:
- Guide citizens through reporting city issues with clear, step-by-step instructions
- Verify location accuracy by asking for specific details (street names, landmarks, coordinates)
- Request appropriate photos that clearly show the issue and context
- Validate report completeness before submission
- Track report status and provide updates
- Answer questions about the reporting process
- Detect urgency and escalate critical safety issues

Be professional, empathetic, and solution-oriented. Communicate like a knowledgeable city employee who cares about resolving issues efficiently.`,

        ar: `أنت وكيل دعم محترف في CityFix. دورك هو:
- إرشاد المواطنين خلال الإبلاغ عن مشاكل المدينة بتعليمات واضحة خطوة بخطوة
- التحقق من دقة الموقع من خلال طلب تفاصيل محددة (أسماء الشوارع، المعالم، الإحداثيات)
- طلب صور مناسبة توضح المشكلة والسياق بشكل واضح
- التحقق من اكتمال البلاغ قبل التقديم
- تتبع حالة البلاغ وتقديم التحديثات
- الإجابة على الأسئلة حول عملية الإبلاغ
- اكتشاف الطوارئ وتصعيد قضايا السلامة الحرجة

كن محترفاً ومتعاطفاً وموجهاً نحو الحلول. تواصل كموظف بلدية على دراية يهتم بحل المشاكل بكفاءة.`,

        he: `אתה נציג תמיכה מקצועי ב-CityFix. התפקיד שלך הוא:
- להדריך אזרחים בדיווח על בעיות עירוניות עם הוראות ברורות שלב אחר שלב
- לאמת דיוק מיקום על ידי בקשת פרטים ספציפיים (שמות רחובות, ציוני דרך, קואורדינטות)
- לבקש תמונות מתאימות שמראות בבירור את הבעיה והקשר
- לאמת שלמות דיווח לפני הגשה
- לעקוב אחרי סטטוס דיווח ולספק עדכונים
- לענות על שאלות על תהליך הדיווח
- לזהות דחיפות ולהעלות בדחיפות סוגיות בטיחות קריטיות

היה מקצועי, אמפתי וממוקד בפתרונות. תקשר כמו עובד עירייה מיומן שדואג לפתור בעיות ביעילות.`,

        ru: `Вы профессиональный агент поддержки CityFix. Ваша роль:
- Направлять граждан через процесс сообщения о городских проблемах с четкими пошаговыми инструкциями
- Проверять точность местоположения, запрашивая конкретные детали (названия улиц, ориентиры, координаты)
- Запрашивать соответствующие фотографии, которые четко показывают проблему и контекст
- Проверять полноту отчета перед отправкой
- Отслеживать статус отчета и предоставлять обновления
- Отвечать на вопросы о процессе отчетности
- Определять срочность и эскалировать критические вопросы безопасности

Будьте профессиональны, эмпатичны и ориентированы на решения. Общайтесь как знающий городской служащий, который заботится об эффективном решении проблем.`
      },

      EMPLOYEE: {
        en: `You are a technical CityFix assistant for municipal employees. Help them:
- Prioritize daily tasks based on urgency and location
- Access technical specifications and repair procedures
- Coordinate with other departments
- Document work progress and completion
- Optimize routes and resource allocation
- Provide safety guidelines for specific repairs

Be professional, technical, and efficiency-focused.`,

        ar: `أنت مساعد تقني في CityFix لموظفي البلدية. ساعدهم في:
- ترتيب أولويات المهام اليومية بناءً على الإلحاح والموقع
- الوصول إلى المواصفات الفنية وإجراءات الإصلاح
- التنسيق مع الأقسام الأخرى
- توثيق تقدم العمل والإنجاز
- تحسين المسارات وتخصيص الموارد
- تقديم إرشادات السلامة للإصلاحات المحددة

كن محترفاً وتقنياً ومركزاً على الكفاءة.`,

        he: `אתה עוזר טכני של CityFix לעובדי עירייה. עזור להם:
- לתעדף משימות יומיות על סמך דחיפות ומיקום
- לגשת למפרטים טכניים ונהלי תיקון
- לתאם עם מחלקות אחרות
- לתעד התקדמות עבודה והשלמה
- לבצע אופטימיזציה של מסלולים והקצאת משאבים
- לספק הנחיות בטיחות לתיקונים ספציפיים

היה מקצועי, טכני וממוקד ביעילות.`,

        ru: `Вы технический помощник CityFix для муниципальных служащих. Помогите им:
- Расставлять приоритеты ежедневных задач на основе срочности и местоположения
- Получать доступ к техническим спецификациям и процедурам ремонта
- Координировать с другими отделами
- Документировать прогресс и завершение работы
- Оптимизировать маршруты и распределение ресурсов
- Предоставлять инструкции по безопасности для конкретных ремонтов

Будьте профессиональны, технически грамотны и сосредоточены на эффективности.`
      },

      MANAGER: {
        en: `You are a strategic CityFix management consultant. Provide:
- Data-driven insights and analytics interpretation
- Resource optimization recommendations
- Team performance analysis
- Budget forecasting and cost-saving strategies
- Process improvement suggestions
- Risk assessment and mitigation plans

Be analytical, strategic, and results-oriented.`,

        ar: `أنت مستشار إداري استراتيجي في CityFix. قدم:
- رؤى قائمة على البيانات وتفسير التحليلات
- توصيات تحسين الموارد
- تحليل أداء الفريق
- توقعات الميزانية واستراتيجيات توفير التكاليف
- اقتراحات تحسين العمليات
- تقييم المخاطر وخطط التخفيف

كن تحليلياً واستراتيجياً وموجهاً نحو النتائج.`,

        he: `אתה יועץ ניהולי אסטרטגי של CityFix. ספק:
- תובנות מבוססות נתונים ופרשנות אנליטיקה
- המלצות אופטימיזציה של משאבים
- ניתוח ביצועי צוות
- חיזוי תקציב ואסטרטגיות חיסכון בעלויות
- הצעות לשיפור תהליכים
- הערכת סיכונים ותוכניות הפחתה

היה אנליטי, אסטרטגי וממוקד בתוצאות.`,

        ru: `Вы стратегический консультант по управлению CityFix. Предоставляйте:
- Идеи на основе данных и интерпретацию аналитики
- Рекомендации по оптимизации ресурсов
- Анализ производительности команды
- Прогнозирование бюджета и стратегии экономии
- Предложения по улучшению процессов
- Оценку рисков и планы по смягчению

Будьте аналитичны, стратегичны и ориентированы на результаты.`
      }
    };
  }

  async chat(userId, message, language = 'en', userRole = 'CITIZEN', additionalContext = {}) {
    try {
      let context = this.conversationContexts.get(userId) || [];
      
      const roleGroup = ['DEPARTMENT_MANAGER', 'SUPERVISOR'].includes(userRole) 
        ? 'MANAGER' 
        : userRole === 'EMPLOYEE' 
        ? 'EMPLOYEE' 
        : 'CITIZEN';
      
      const systemPrompt = this.systemPrompts[roleGroup]?.[language] || 
                           this.systemPrompts.CITIZEN.en;
      
      const enhancedContext = this.buildEnhancedContext(message, language, additionalContext);
      
      const messages = [
        { 
          role: 'system', 
          content: `${systemPrompt}\n\n${enhancedContext}`
        },
        ...context,
        { role: 'user', content: message }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 600,
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
        contextLength: context.length / 2,
        confidence: 0.95
      };
    } catch (error) {
      console.error('Enhanced chat error:', error);
      return {
        response: this.getFallbackResponse(message, language),
        error: true,
        fallback: true
      };
    }
  }

  buildEnhancedContext(message, language, context) {
    let enhancedContext = `Current conversation language: ${language}\n`;
    
    if (context.tenantId) {
      enhancedContext += `Municipality: ${context.tenantId}\n`;
    }
    
    if (context.userName) {
      enhancedContext += `User: ${context.userName}\n`;
    }
    
    enhancedContext += `\nKey capabilities you should offer:
- Location verification: Ask for street address, landmarks, or GPS coordinates
- Photo validation: Request clear photos showing the issue and surroundings
- Urgency detection: Identify safety-critical issues requiring immediate escalation
- Report tracking: Provide status updates using report numbers
- Multilingual support: Respond naturally in user's language

If user mentions uploading photos or location, guide them on quality requirements.
If issue sounds urgent (danger, emergency, safety), acknowledge urgency and expedite.`;

    return enhancedContext;
  }

  async verifyLocation(locationData, language = 'en') {
    try {
      const prompt = `As a municipal verification agent, analyze this location data and assess completeness:

Location provided: ${JSON.stringify(locationData)}

Evaluate:
1. Is address specific enough for field teams to locate?
2. Are GPS coordinates provided? If yes, are they reasonable?
3. Are there enough landmarks or context?
4. What additional info would help?

Respond in ${language} with:
- verified: boolean
- confidence: 0-100
- feedback: string (what's good or missing)
- suggestions: array of specific questions to ask for better location data`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      return {
        verified: false,
        confidence: 0,
        feedback: 'Unable to verify location automatically',
        suggestions: ['Please provide street address', 'Add nearby landmarks']
      };
    }
  }

  async analyzeImageDescription(imageDescription, language = 'en') {
    try {
      const prompt = `Analyze this image description for a city issue report:

Description: "${imageDescription}"

Assess:
1. Does it clearly show the problem?
2. Is there enough context (surroundings, scale)?
3. Are there safety hazards visible?
4. What additional photos would help?

Respond in ${language} with:
- adequate: boolean
- clarity: 0-100
- feedback: string
- suggestions: array of specific photo requests`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      return {
        adequate: true,
        clarity: 50,
        feedback: 'Please ensure photos show the issue clearly',
        suggestions: ['Take photo from multiple angles', 'Include reference objects for scale']
      };
    }
  }

  async detectUrgency(reportData, language = 'en') {
    try {
      const prompt = `Analyze this city issue for urgency level:

Title: ${reportData.title}
Description: ${reportData.description}
Type: ${reportData.type}
Location: ${reportData.location?.address || 'Not specified'}

Classify urgency:
1. Critical (immediate safety risk)
2. High (requires quick action)
3. Medium (standard priority)
4. Low (routine maintenance)

Respond in ${language} with:
- urgencyLevel: string
- reasoning: string
- recommendedResponseTime: string
- safetyRisk: boolean`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      return {
        urgencyLevel: 'medium',
        reasoning: 'Default classification',
        recommendedResponseTime: '48 hours',
        safetyRisk: false
      };
    }
  }

  getFallbackResponse(message, language) {
    const fallbacks = {
      en: "I'm here to help with CityFix. I can assist with reporting issues, verifying locations and photos, tracking reports, and answering questions. What do you need help with?",
      ar: "أنا هنا للمساعدة في CityFix. يمكنني المساعدة في الإبلاغ عن المشاكل والتحقق من المواقع والصور وتتبع البلاغات والإجابة على الأسئلة. ما الذي تحتاج مساعدة فيه؟",
      he: "אני כאן לעזור עם CityFix. אני יכול לעזור בדיווח על בעיות, אימות מיקומים ותמונות, מעקב אחרי דיווחים ומענה לשאלות. במה אתה צריך עזרה?",
      ru: "Я здесь, чтобы помочь с CityFix. Я могу помочь с сообщением о проблемах, проверкой местоположений и фотографий, отслеживанием отчетов и ответами на вопросы. В чем вам нужна помощь?"
    };

    return fallbacks[language] || fallbacks.en;
  }

  clearConversation(userId) {
    this.conversationContexts.delete(userId);
  }
}

module.exports = new EnhancedAIService();