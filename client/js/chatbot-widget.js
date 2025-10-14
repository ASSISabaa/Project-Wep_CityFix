class CityFixChatbot {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.currentLanguage = 'en';
    this.isTyping = false;
    this.conversationContext = [];
    this.init();
  }

  init() {
    // Wait for i18n to be ready
    if (window.i18n) {
      this.currentLanguage = window.i18n.currentLang;
    }
    
    this.createWidget();
    this.attachEventListeners();
    this.loadWelcomeMessage();
    this.syncWithSiteLanguage();
  }

  syncWithSiteLanguage() {
    // Listen for language changes
    const observer = new MutationObserver(() => {
      if (window.i18n && window.i18n.currentLang !== this.currentLanguage) {
        this.changeLanguage(window.i18n.currentLang);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });

    // Also listen to storage changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'cityfix_language' && e.newValue) {
        this.changeLanguage(e.newValue);
      }
    });

    // Check every second for language changes
    setInterval(() => {
      const siteLang = window.i18n?.currentLang || localStorage.getItem('cityfix_language') || 'en';
      if (siteLang !== this.currentLanguage) {
        this.changeLanguage(siteLang);
      }
    }, 1000);
  }

  createWidget() {
    const widget = document.createElement('div');
    widget.innerHTML = `
      <div id="chatbot-container" class="chatbot-container">
        <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Open Chat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="chatbot-badge">AI</span>
        </button>
        
        <div id="chatbot-window" class="chatbot-window" style="display: none;">
          <div class="chatbot-header">
            <div class="chatbot-header-content">
              <div class="chatbot-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6"></path>
                  <path d="M17 7l-5 5m0 0l-5-5m5 5l5 5m-5-5l-5 5"></path>
                </svg>
              </div>
              <div class="chatbot-header-text">
                <h3 class="chatbot-title">CityFix AI</h3>
                <p class="chatbot-status">
                  <span class="status-dot"></span>
                  <span class="status-text">Online</span>
                </p>
              </div>
            </div>
            <div class="chatbot-actions">
              <button id="chatbot-minimize" class="chatbot-minimize" aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          <div id="chatbot-messages" class="chatbot-messages"></div>
          
          <div class="chatbot-input-container">
            <input 
              type="text" 
              id="chatbot-input" 
              class="chatbot-input" 
              placeholder="Type your message..."
              autocomplete="off"
            />
            <button id="chatbot-send" class="chatbot-send-btn" aria-label="Send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          
          <div class="chatbot-suggestions" id="chatbot-suggestions">
            <button class="suggestion-chip" data-message="how-report">How to report?</button>
            <button class="suggestion-chip" data-message="track-report">Track my report</button>
            <button class="suggestion-chip" data-message="issue-types">Issue types</button>
          </div>
          
          <div class="chatbot-footer">
            <span class="powered-by">Powered by AI • English</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    this.injectStyles();
    this.updateUILanguage();
  }

  updateUILanguage() {
    const texts = {
      en: {
        placeholder: 'Type your message...',
        powered: 'Powered by AI • English',
        online: 'Online',
        chips: {
          'how-report': 'How to report?',
          'track-report': 'Track my report',
          'issue-types': 'Issue types'
        }
      },
      ar: {
        placeholder: 'اكتب رسالتك...',
        powered: 'مدعوم بالذكاء الاصطناعي • العربية',
        online: 'متصل',
        chips: {
          'how-report': 'كيف أبلغ؟',
          'track-report': 'تتبع بلاغي',
          'issue-types': 'أنواع المشاكل'
        }
      },
      he: {
        placeholder: 'הקלד את ההודעה שלך...',
        powered: 'מופעל על ידי AI • עברית',
        online: 'מחובר',
        chips: {
          'how-report': 'איך לדווח?',
          'track-report': 'עקוב אחרי הדיווח',
          'issue-types': 'סוגי בעיות'
        }
      },
      ru: {
        placeholder: 'Введите ваше сообщение...',
        powered: 'На основе AI • Русский',
        online: 'Онлайн',
        chips: {
          'how-report': 'Как сообщить?',
          'track-report': 'Отследить отчет',
          'issue-types': 'Типы проблем'
        }
      }
    };

    const lang = texts[this.currentLanguage] || texts.en;

    // Update input placeholder
    const input = document.getElementById('chatbot-input');
    if (input) input.placeholder = lang.placeholder;

    // Update footer
    const footer = document.querySelector('.powered-by');
    if (footer) footer.textContent = lang.powered;

    // Update status
    const status = document.querySelector('.status-text');
    if (status) status.textContent = lang.online;

    // Update suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      const type = chip.dataset.message;
      chip.textContent = lang.chips[type] || chip.textContent;
    });
  }

  changeLanguage(lang) {
    this.currentLanguage = lang;
    this.updateUILanguage();
  }

  injectStyles() {
    if (document.getElementById('chatbot-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'chatbot-styles';
    styles.textContent = `
      .chatbot-container { 
        position: fixed; 
        bottom: 24px; 
        right: 24px; 
        z-index: 9999; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; 
      }
      
      .chatbot-toggle {
        width: 64px; 
        height: 64px; 
        border-radius: 50%; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none; 
        color: white; 
        cursor: pointer; 
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        display: flex; 
        align-items: center; 
        justify-content: center; 
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }
      
      .chatbot-toggle:hover { 
        transform: scale(1.08) translateY(-2px); 
        box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5); 
      }
      
      .chatbot-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #10b981;
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 10px;
        border: 2px solid white;
      }
      
      .chatbot-window {
        position: absolute; 
        bottom: 84px; 
        right: 0; 
        width: 400px; 
        height: 640px;
        background: white; 
        border-radius: 20px; 
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        display: flex; 
        flex-direction: column; 
        overflow: hidden; 
        animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      @keyframes slideUp { 
        from { opacity: 0; transform: translateY(30px) scale(0.95); } 
        to { opacity: 1; transform: translateY(0) scale(1); } 
      }
      
      .chatbot-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        color: white; 
        padding: 20px;
        display: flex; 
        justify-content: space-between; 
        align-items: center;
      }
      
      .chatbot-header-content { display: flex; align-items: center; gap: 14px; }
      
      .chatbot-avatar {
        width: 44px; height: 44px; background: rgba(255, 255, 255, 0.25); border-radius: 50%;
        display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);
      }
      
      .chatbot-title { margin: 0; font-size: 17px; font-weight: 700; }
      
      .chatbot-status { 
        margin: 4px 0 0 0; font-size: 13px; opacity: 0.95; 
        display: flex; align-items: center; gap: 6px;
      }
      
      .status-dot {
        width: 8px; height: 8px; background: #10b981; border-radius: 50%;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      
      .chatbot-minimize {
        background: rgba(255, 255, 255, 0.2); border: none; color: white; cursor: pointer; 
        padding: 8px; display: flex; align-items: center; justify-content: center;
        border-radius: 8px; transition: all 0.2s;
      }
      
      .chatbot-minimize:hover { background: rgba(255, 255, 255, 0.3); }
      
      .chatbot-messages {
        flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;
        background: linear-gradient(to bottom, #f9fafb 0%, #ffffff 100%);
      }
      
      .chatbot-messages::-webkit-scrollbar { width: 6px; }
      .chatbot-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
      
      .message { display: flex; gap: 10px; animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
      
      @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      
      .message.bot { align-items: flex-start; }
      .message.user { justify-content: flex-end; }
      
      .message-avatar {
        width: 36px; height: 36px; border-radius: 50%; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      .message-avatar svg { width: 20px; height: 20px; stroke: white; }
      
      .message-content {
        max-width: 75%; padding: 14px 18px; border-radius: 16px; line-height: 1.6; 
        font-size: 14px; word-wrap: break-word;
      }
      
      .message.bot .message-content { 
        background: white; border: 1px solid #e5e7eb; border-bottom-left-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      
      .message.user .message-content { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
        border-bottom-right-radius: 6px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      .typing-indicator { display: flex; gap: 5px; padding: 14px 18px; }
      
      .typing-dot {
        width: 9px; height: 9px; border-radius: 50%; background: #667eea;
        animation: typing 1.4s infinite ease-in-out;
      }
      
      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      
      @keyframes typing { 
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 
        30% { transform: translateY(-8px); opacity: 1; } 
      }
      
      .chatbot-input-container {
        display: flex; gap: 10px; padding: 16px; background: white; border-top: 1px solid #e5e7eb;
      }
      
      .chatbot-input {
        flex: 1; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px;
        font-size: 14px; outline: none; transition: all 0.2s; font-family: inherit;
      }
      
      .chatbot-input:focus { 
        border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
      
      .chatbot-send-btn {
        width: 44px; height: 44px; border-radius: 12px; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none; color: white; cursor: pointer; display: flex; align-items: center; 
        justify-content: center; transition: all 0.2s; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      .chatbot-send-btn:hover { 
        transform: scale(1.05); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
      }
      
      .chatbot-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      
      .chatbot-suggestions {
        display: flex; gap: 8px; padding: 12px 16px; background: #f9fafb; 
        border-top: 1px solid #e5e7eb; overflow-x: auto;
      }
      
      .suggestion-chip {
        padding: 8px 14px; border-radius: 20px; background: white; border: 1px solid #e5e7eb;
        font-size: 13px; cursor: pointer; white-space: nowrap; transition: all 0.2s; font-weight: 500;
      }
      
      .suggestion-chip:hover { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
        border-color: transparent; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      .chatbot-footer {
        padding: 10px 16px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;
      }
      
      .powered-by { font-size: 11px; color: #6b7280; font-weight: 500; }
      
      @media (max-width: 480px) {
        .chatbot-window { width: calc(100vw - 32px); height: calc(100vh - 120px); }
        .message-content { max-width: 80%; }
      }
    `;
    
    document.head.appendChild(styles);
  }

  attachEventListeners() {
    const toggle = document.getElementById('chatbot-toggle');
    const minimize = document.getElementById('chatbot-minimize');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    
    toggle?.addEventListener('click', () => this.toggleChat());
    minimize?.addEventListener('click', () => this.toggleChat());
    sendBtn?.addEventListener('click', () => this.sendMessage());
    
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const message = this.getSuggestionText(e.target.dataset.message);
        input.value = message;
        this.sendMessage();
      });
    });
  }

  getSuggestionText(type) {
    const suggestions = {
      'how-report': {
        en: 'How do I report an issue?',
        ar: 'كيف أبلغ عن مشكلة؟',
        he: 'איך אני מדווח על בעיה?',
        ru: 'Как мне сообщить о проблеме?'
      },
      'track-report': {
        en: 'How can I track my report?',
        ar: 'كيف يمكنني تتبع بلاغي؟',
        he: 'איך אני יכול לעקוב אחרי הדיווח שלי?',
        ru: 'Как я могу отследить свой отчет?'
      },
      'issue-types': {
        en: 'What types of issues can I report?',
        ar: 'ما أنواع المشاكل التي يمكنني الإبلاغ عنها؟',
        he: 'איזה סוגי בעיות אני יכול לדווח?',
        ru: 'Какие типы проблем я могу сообщить?'
      }
    };
    
    return suggestions[type]?.[this.currentLanguage] || suggestions[type]?.en || '';
  }

  toggleChat() {
    const window = document.getElementById('chatbot-window');
    this.isOpen = !this.isOpen;
    window.style.display = this.isOpen ? 'flex' : 'none';
    
    if (this.isOpen) {
      document.getElementById('chatbot-input')?.focus();
    }
  }

  loadWelcomeMessage() {
    const welcomeMessages = {
      en: 'Hello! 👋 I\'m your CityFix AI assistant. How can I help you today?',
      ar: 'مرحباً! 👋 أنا مساعدك الذكي في CityFix. كيف يمكنني مساعدتك اليوم؟',
      he: 'שלום! 👋 אני העוזר החכם שלך ב-CityFix. איך אני יכול לעזור לך היום?',
      ru: 'Здравствуйте! 👋 Я ваш AI-помощник CityFix. Чем я могу вам помочь сегодня?'
    };
    
    setTimeout(() => {
      this.addMessage('bot', welcomeMessages[this.currentLanguage]);
    }, 500);
  }

  async sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (!message || this.isTyping) return;
    
    this.addMessage('user', message);
    input.value = '';
    
    this.isTyping = true;
    const sendBtn = document.getElementById('chatbot-send');
    if (sendBtn) sendBtn.disabled = true;
    
    this.showTypingIndicator();
    
    // First try: Use smart fallback responses
    setTimeout(() => {
      this.hideTypingIndicator();
      const response = this.getSmartResponse(message);
      this.addMessage('bot', response);
      this.isTyping = false;
      if (sendBtn) sendBtn.disabled = false;
    }, 1500);
  }

  getSmartResponse(message) {
    const msg = message.toLowerCase();
    
    const responses = {
      en: {
        greeting: "Hello! 👋 I'm here to help you with CityFix. You can:\n\n• Report city issues\n• Track your reports\n• Learn about issue types\n• Get help with the platform\n\nWhat would you like to do?",
        report: "📝 **To report an issue:**\n\n1. Click on 'Submit Report' in the menu\n2. Fill in the issue details:\n   • Category (Pothole, Lighting, etc.)\n   • Description\n   • Location\n3. Add photos if possible\n4. Submit!\n\nYou'll get a report number to track it. 🎯",
        track: "🔍 **To track your report:**\n\n1. Go to 'My Reports' page\n2. Or use 'Browse Reports' and search\n3. Your report will show:\n   • Current status\n   • Updates\n   • Response from authorities\n\nYou'll also get email notifications! 📧",
        types: "🏙️ **Issue types you can report:**\n\n• 🕳️ Potholes & road damage\n• 💡 Street lighting problems\n• 🚰 Water & drainage issues\n• 🗑️ Garbage collection\n• 🚦 Traffic signals\n• 🌳 Tree maintenance\n• 🚧 Sidewalk repairs\n\nAnd many more!",
        help: "❓ **I can help you with:**\n\n• Reporting issues\n• Tracking reports\n• Understanding the process\n• Platform navigation\n• Account questions\n\nJust ask me anything! 😊",
        thanks: "You're welcome! 😊 Happy to help. Is there anything else you'd like to know?",
        default: "I'm here to assist you with CityFix! 🌟\n\nYou can ask me about:\n• How to report issues\n• Tracking your reports\n• Types of issues\n• General help\n\nWhat would you like to know?"
      },
      ar: {
        greeting: "مرحباً! 👋 أنا هنا لمساعدتك في CityFix. يمكنك:\n\n• الإبلاغ عن مشاكل المدينة\n• تتبع بلاغاتك\n• التعرف على أنواع المشاكل\n• الحصول على المساعدة\n\nماذا تريد أن تفعل؟",
        report: "📝 **للإبلاغ عن مشكلة:**\n\n1. انقر على 'إرسال بلاغ' في القائمة\n2. املأ تفاصيل المشكلة:\n   • الفئة (حفرة، إضاءة، إلخ)\n   • الوصف\n   • الموقع\n3. أضف صوراً إن أمكن\n4. أرسل!\n\nستحصل على رقم بلاغ لتتبعه. 🎯",
        track: "🔍 **لتتبع بلاغك:**\n\n1. اذهب إلى صفحة 'بلاغاتي'\n2. أو استخدم 'تصفح البلاغات' وابحث\n3. سيظهر بلاغك:\n   • الحالة الحالية\n   • التحديثات\n   • رد السلطات\n\nستحصل أيضاً على إشعارات بالبريد! 📧",
        types: "🏙️ **أنواع المشاكل التي يمكن الإبلاغ عنها:**\n\n• 🕳️ الحفر وتلف الطرق\n• 💡 مشاكل إضاءة الشوارع\n• 🚰 المياه والصرف\n• 🗑️ جمع القمامة\n• 🚦 إشارات المرور\n• 🌳 صيانة الأشجار\n• 🚧 إصلاح الأرصفة\n\nوالمزيد!",
        help: "❓ **يمكنني مساعدتك في:**\n\n• الإبلاغ عن المشاكل\n• تتبع البلاغات\n• فهم العملية\n• التنقل في المنصة\n• أسئلة الحساب\n\nفقط اسألني أي شيء! 😊",
        thanks: "على الرحب والسعة! 😊 سعيد بالمساعدة. هل هناك شيء آخر تريد معرفته؟",
        default: "أنا هنا لمساعدتك في CityFix! 🌟\n\nيمكنك سؤالي عن:\n• كيفية الإبلاغ عن المشاكل\n• تتبع بلاغاتك\n• أنواع المشاكل\n• مساعدة عامة\n\nماذا تريد أن تعرف؟"
      },
      he: {
        greeting: "שלום! 👋 אני כאן לעזור לך עם CityFix. אתה יכול:\n\n• לדווח על בעיות בעיר\n• לעקוב אחרי הדיווחים שלך\n• ללמוד על סוגי בעיות\n• לקבל עזרה\n\nמה תרצה לעשות?",
        report: "📝 **כדי לדווח על בעיה:**\n\n1. לחץ על 'שלח דיווח' בתפריט\n2. מלא את פרטי הבעיה:\n   • קטגוריה (בור, תאורה, וכו')\n   • תיאור\n   • מיקום\n3. הוסף תמונות אם אפשר\n4. שלח!\n\nתקבל מספר דיווח למעקב. 🎯",
        track: "🔍 **כדי לעקוב אחרי הדיווח שלך:**\n\n1. עבור לעמוד 'הדיווחים שלי'\n2. או השתמש ב'עיין בדיווחים' וחפש\n3. הדיווח שלך יראה:\n   • מצב נוכחי\n   • עדכונים\n   • תגובה מהרשויות\n\nתקבל גם התראות במייל! 📧",
        types: "🏙️ **סוגי בעיות שאתה יכול לדווח:**\n\n• 🕳️ בורות ונזקי כביש\n• 💡 בעיות תאורת רחוב\n• 🚰 מים וניקוז\n• 🗑️ איסוף אשפה\n• 🚦 רמזורים\n• 🌳 תחזוקת עצים\n• 🚧 תיקוני מדרכה\n\nועוד הרבה!",
        help: "❓ **אני יכול לעזור לך עם:**\n\n• דיווח על בעיות\n• מעקב אחרי דיווחים\n• הבנת התהליך\n• ניווט בפלטפורמה\n• שאלות חשבון\n\nפשוט שאל אותי כל דבר! 😊",
        thanks: "בבקשה! 😊 שמח לעזור. יש משהו נוסף שתרצה לדעת?",
        default: "אני כאן לעזור לך עם CityFix! 🌟\n\nאתה יכול לשאול אותי על:\n• איך לדווח על בעיות\n• מעקב אחרי דיווחים\n• סוגי בעיות\n• עזרה כללית\n\nמה תרצה לדעת?"
      },
      ru: {
        greeting: "Здравствуйте! 👋 Я здесь, чтобы помочь вам с CityFix. Вы можете:\n\n• Сообщать о проблемах города\n• Отслеживать свои отчеты\n• Узнать о типах проблем\n• Получить помощь\n\nЧто вы хотите сделать?",
        report: "📝 **Чтобы сообщить о проблеме:**\n\n1. Нажмите 'Подать отчет' в меню\n2. Заполните детали проблемы:\n   • Категория (Выбоина, Освещение и т.д.)\n   • Описание\n   • Местоположение\n3. Добавьте фото, если возможно\n4. Отправьте!\n\nВы получите номер отчета для отслеживания. 🎯",
        track: "🔍 **Чтобы отследить ваш отчет:**\n\n1. Перейдите на страницу 'Мои отчеты'\n2. Или используйте 'Просмотр отчетов' и поиск\n3. Ваш отчет покажет:\n   • Текущий статус\n   • Обновления\n   • Ответ властей\n\nВы также получите уведомления по email! 📧",
        types: "🏙️ **Типы проблем, о которых можно сообщить:**\n\n• 🕳️ Выбоины и повреждения дорог\n• 💡 Проблемы с уличным освещением\n• 🚰 Вода и дренаж\n• 🗑️ Сбор мусора\n• 🚦 Светофоры\n• 🌳 Обслуживание деревьев\n• 🚧 Ремонт тротуаров\n\nИ многое другое!",
        help: "❓ **Я могу помочь вам с:**\n\n• Сообщением о проблемах\n• Отслеживанием отчетов\n• Пониманием процесса\n• Навигацией по платформе\n• Вопросами об аккаунте\n\nПросто спросите меня о чем угодно! 😊",
        thanks: "Пожалуйста! 😊 Рад помочь. Есть что-то еще, что вы хотели бы узнать?",
        default: "Я здесь, чтобы помочь вам с CityFix! 🌟\n\nВы можете спросить меня о:\n• Как сообщить о проблемах\n• Отслеживании отчетов\n• Типах проблем\n• Общей помощи\n\nЧто бы вы хотели узнать?"
      }
    };

    const lang = responses[this.currentLanguage] || responses.en;

    // Smart intent detection
    if (msg.match(/hello|hi|hey|مرحب|أهلا|שלום|היי|привет|здравствуй/i)) {
      return lang.greeting;
    }
    if (msg.match(/report|submit|create|أبلغ|إرسال|דווח|שלח|сообщить|отправить/i)) {
      return lang.report;
    }
    if (msg.match(/track|status|check|find|تتبع|حالة|עקוב|מצב|отследить|статус/i)) {
      return lang.track;
    }
    if (msg.match(/type|kind|category|what can|أنواع|فئات|סוגי|מה אפשר|типы|категории/i)) {
      return lang.types;
    }
    if (msg.match(/help|assist|support|مساعدة|עזרה|תמיכה|помощь|поддержка/i)) {
      return lang.help;
    }
    if (msg.match(/thank|thanks|شكرا|תודה|спасибо/i)) {
      return lang.thanks;
    }

    return lang.default;
  }

  addMessage(sender, text) {
    const messagesDiv = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (sender === 'bot') {
      messageDiv.innerHTML = `
        <div class="message-avatar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6"></path>
            <path d="M17 7l-5 5m0 0l-5-5m5 5l5 5m-5-5l-5 5"></path>
          </svg>
        </div>
        <div class="message-content">${this.formatMessage(text)}</div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="message-content">${this.escapeHtml(text)}</div>
      `;
    }
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  formatMessage(text) {
    let formatted = this.escapeHtml(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  showTypingIndicator() {
    const messagesDiv = document.getElementById('chatbot-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-avatar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6"></path>
          <path d="M17 7l-5 5m0 0l-5-5m5 5l5 5m-5-5l-5 5"></path>
        </svg>
      </div>
      <div class="message-content">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.cityFixChatbot = new CityFixChatbot();
    }, 500);
  });
} else {
  setTimeout(() => {
    window.cityFixChatbot = new CityFixChatbot();
  }, 500);
}