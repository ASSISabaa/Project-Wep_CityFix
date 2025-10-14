// server/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const AdvancedAIService = require('../services/AdvancedAIService');

// AI Chat endpoint
router.post('/chat', authenticate, async (req, res, next) => {
  try {
    const { message, context = [], language = 'en', userRole = 'CITIZEN' } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        success: true,
        data: {
          response: getFallbackResponse(message, language),
          timestamp: new Date()
        }
      });
    }

    // Use AI Service
    const aiResponse = await AdvancedAIService.chat(
      req.user._id.toString(),
      message,
      language,
      userRole,
      {
        tenantId: req.user.tenant?.toString(),
        userName: req.user.username
      }
    );

    res.json({
      success: true,
      data: {
        response: aiResponse.response,
        timestamp: aiResponse.timestamp || new Date()
      }
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    
    // Fallback response on error
    res.json({
      success: true,
      data: {
        response: getFallbackResponse(req.body.message, req.body.language || 'en'),
        timestamp: new Date()
      }
    });
  }
});

// Fallback responses when AI is not available
function getFallbackResponse(message, language) {
  const msg = message.toLowerCase();
  
  const responses = {
    en: {
      greeting: "Hello! I'm CityFix Assistant. I can help you report issues, track reports, and answer questions about our services.",
      report: "To report an issue:\n1. Go to 'Submit Report' page\n2. Fill in the details and location\n3. Add photos if possible\n4. Submit your report\n\nYou'll receive a report number to track it.",
      track: "To track your report:\n1. Go to 'My Reports' or 'Browse Reports'\n2. Use your report number\n3. You'll see the current status and updates",
      types: "You can report:\n• Potholes\n• Street lighting issues\n• Drainage problems\n• Garbage collection\n• Traffic signals\n• Sidewalk damage\n• And more!",
      default: "I'm here to help with:\n• Reporting issues\n• Tracking reports\n• Understanding issue types\n• General questions\n\nWhat would you like to know?"
    },
    ar: {
      greeting: "مرحباً! أنا مساعد CityFix. يمكنني مساعدتك في الإبلاغ عن المشاكل، تتبع البلاغات، والإجابة على أسئلتك.",
      report: "للإبلاغ عن مشكلة:\n1. اذهب إلى صفحة 'إرسال بلاغ'\n2. املأ التفاصيل والموقع\n3. أضف صوراً إن أمكن\n4. أرسل البلاغ\n\nستحصل على رقم بلاغ لتتبعه.",
      track: "لتتبع بلاغك:\n1. اذهب إلى 'بلاغاتي' أو 'تصفح البلاغات'\n2. استخدم رقم البلاغ\n3. ستشاهد الحالة والتحديثات",
      types: "يمكنك الإبلاغ عن:\n• الحفر\n• إضاءة الشوارع\n• مشاكل الصرف\n• جمع القمامة\n• إشارات المرور\n• تلف الأرصفة\n• والمزيد!",
      default: "أنا هنا للمساعدة في:\n• الإبلاغ عن المشاكل\n• تتبع البلاغات\n• فهم أنواع المشاكل\n• أسئلة عامة\n\nماذا تريد أن تعرف؟"
    },
    he: {
      greeting: "שלום! אני העוזר של CityFix. אני יכול לעזור לך לדווח על בעיות, לעקוב אחרי דיווחים ולענות על שאלות.",
      report: "כדי לדווח על בעיה:\n1. עבור לעמוד 'שלח דיווח'\n2. מלא את הפרטים והמיקום\n3. הוסף תמונות אם אפשר\n4. שלח את הדיווח\n\nתקבל מספר דיווח למעקב.",
      track: "כדי לעקוב אחרי הדיווח שלך:\n1. עבור ל'הדיווחים שלי' או 'עיין בדיווחים'\n2. השתמש במספר הדיווח שלך\n3. תראה את הסטטוס והעדכונים",
      types: "אתה יכול לדווח על:\n• בורות בכביש\n• תאורת רחוב\n• בעיות ניקוז\n• איסוף אשפה\n• רמזורים\n• נזק למדרכה\n• ועוד!",
      default: "אני כאן לעזור עם:\n• דיווח על בעיות\n• מעקב אחרי דיווחים\n• הבנת סוגי בעיות\n• שאלות כלליות\n\nמה תרצה לדעת?"
    },
    ru: {
      greeting: "Здравствуйте! Я помощник CityFix. Я могу помочь вам сообщить о проблемах, отследить отчеты и ответить на вопросы.",
      report: "Чтобы сообщить о проблеме:\n1. Перейдите на страницу 'Подать отчет'\n2. Заполните детали и местоположение\n3. Добавьте фото, если возможно\n4. Отправьте отчет\n\nВы получите номер отчета для отслеживания.",
      track: "Чтобы отследить ваш отчет:\n1. Перейдите в 'Мои отчеты' или 'Просмотр отчетов'\n2. Используйте номер вашего отчета\n3. Вы увидите текущий статус и обновления",
      types: "Вы можете сообщить о:\n• Выбоинах\n• Уличном освещении\n• Проблемах с дренажом\n• Сборе мусора\n• Светофорах\n• Повреждении тротуара\n• И многом другом!",
      default: "Я здесь, чтобы помочь с:\n• Сообщением о проблемах\n• Отслеживанием отчетов\n• Пониманием типов проблем\n• Общими вопросами\n\nЧто бы вы хотели узнать?"
    }
  };

  const lang = responses[language] || responses.en;

  // Detect intent
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('مرحب') || msg.includes('שלום') || msg.includes('привет')) {
    return lang.greeting;
  }
  if (msg.includes('report') || msg.includes('submit') || msg.includes('أبلغ') || msg.includes('דווח') || msg.includes('сообщить')) {
    return lang.report;
  }
  if (msg.includes('track') || msg.includes('status') || msg.includes('تتبع') || msg.includes('עקוב') || msg.includes('отследить')) {
    return lang.track;
  }
  if (msg.includes('type') || msg.includes('kind') || msg.includes('أنواع') || msg.includes('סוגי') || msg.includes('типы')) {
    return lang.types;
  }

  return lang.default;
}

module.exports = router;