class CityFixChatbot {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.currentLanguage = this.detectLanguage();
    this.isTyping = false;
    this.conversationContext = [];
    this.init();
  }

  detectLanguage() {
    const userLang = localStorage.getItem('cityfix_language');
    if (userLang) return userLang;
    
    const browserLang = navigator.language.split('-')[0];
    const supported = ['en', 'ar', 'he', 'ru'];
    return supported.includes(browserLang) ? browserLang : 'en';
  }

  init() {
    this.createWidget();
    this.attachEventListeners();
    this.loadWelcomeMessage();
  }

  createWidget() {
    const widget = document.createElement('div');
    widget.innerHTML = `
      <div id="chatbot-container" class="chatbot-container ${this.currentLanguage === 'ar' || this.currentLanguage === 'he' ? 'rtl' : ''}">
        <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Open Chat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
        
        <div id="chatbot-window" class="chatbot-window" style="display: none;">
          <div class="chatbot-header">
            <div class="chatbot-header-content">
              <div class="chatbot-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </div>
              <div class="chatbot-header-text">
                <h3 class="chatbot-title">CityFix Assistant</h3>
                <p class="chatbot-status">Online</p>
              </div>
            </div>
            <div class="chatbot-actions">
              <select id="chatbot-language" class="chatbot-language-select">
                <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>English</option>
                <option value="ar" ${this.currentLanguage === 'ar' ? 'selected' : ''}>العربية</option>
                <option value="he" ${this.currentLanguage === 'he' ? 'selected' : ''}>עברית</option>
                <option value="ru" ${this.currentLanguage === 'ru' ? 'selected' : ''}>Русский</option>
              </select>
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
          
          <div class="chatbot-suggestions">
            <button class="suggestion-chip" data-message="how-report">How to report?</button>
            <button class="suggestion-chip" data-message="track-report">Track my report</button>
            <button class="suggestion-chip" data-message="issue-types">Issue types</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('chatbot-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'chatbot-styles';
    styles.textContent = `
      .chatbot-container { position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: 'Inter', sans-serif; }
      .chatbot-container.rtl { left: 20px; right: auto; direction: rtl; }
      
      .chatbot-toggle {
        width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none; color: white; cursor: pointer; box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;
      }
      .chatbot-toggle:hover { transform: scale(1.05); box-shadow: 0 10px 28px rgba(102, 126, 234, 0.5); }
      
      .chatbot-window {
        position: absolute; bottom: 80px; right: 0; width: 380px; height: 600px;
        background: white; border-radius: 16px; box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
        display: flex; flex-direction: column; overflow: hidden; animation: slideUp 0.3s ease;
      }
      .chatbot-container.rtl .chatbot-window { right: auto; left: 0; }
      
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      
      .chatbot-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px;
        display: flex; justify-content: space-between; align-items: center;
      }
      
      .chatbot-header-content { display: flex; align-items: center; gap: 12px; }
      .chatbot-avatar {
        width: 40px; height: 40px; background: rgba(255, 255, 255, 0.2); border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
      }
      .chatbot-title { margin: 0; font-size: 16px; font-weight: 600; }
      .chatbot-status { margin: 0; font-size: 12px; opacity: 0.9; }
      
      .chatbot-actions { display: flex; align-items: center; gap: 8px; }
      .chatbot-language-select {
        background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3);
        color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; cursor: pointer;
      }
      .chatbot-minimize {
        background: transparent; border: none; color: white; cursor: pointer; padding: 4px;
        display: flex; align-items: center; justify-content: center;
      }
      
      .chatbot-messages {
        flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
        background: #f8f9fa;
      }
      
      .message { display: flex; gap: 8px; animation: fadeIn 0.3s ease; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      
      .message.bot { align-items: flex-start; }
      .message.user { justify-content: flex-end; }
      
      .message-avatar {
        width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .message-avatar svg { width: 18px; height: 18px; stroke: white; }
      
      .message-content {
        max-width: 75%; padding: 12px 16px; border-radius: 12px; line-height: 1.5; font-size: 14px;
      }
      .message.bot .message-content { background: white; border-bottom-left-radius: 4px; }
      .message.user .message-content { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-bottom-right-radius: 4px; }
      
      .typing-indicator { display: flex; gap: 4px; padding: 12px 16px; }
      .typing-dot {
        width: 8px; height: 8px; border-radius: 50%; background: #667eea;
        animation: typing 1.4s infinite;
      }
      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typing { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }
      
      .chatbot-input-container {
        display: flex; gap: 8px; padding: 12px; background: white; border-top: 1px solid #e5e7eb;
      }
      .chatbot-input {
        flex: 1; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px;
        font-size: 14px; outline: none; transition: border 0.2s;
      }
      .chatbot-input:focus { border-color: #667eea; }
      .chatbot-send-btn {
        width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
      }
      .chatbot-send-btn:hover { transform: scale(1.05); }
      .chatbot-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      
      .chatbot-suggestions {
        display: flex; gap: 8px; padding: 12px; background: white; border-top: 1px solid #e5e7eb;
        overflow-x: auto;
      }
      .suggestion-chip {
        padding: 6px 12px; border-radius: 16px; background: #f3f4f6; border: 1px solid #e5e7eb;
        font-size: 12px; cursor: pointer; white-space: nowrap; transition: all 0.2s;
      }
      .suggestion-chip:hover { background: #667eea; color: white; border-color: #667eea; }
      
      @media (max-width: 480px) {
        .chatbot-window { width: calc(100vw - 40px); height: calc(100vh - 140px); }
      }
    `;
    
    document.head.appendChild(styles);
  }

  attachEventListeners() {
    const toggle = document.getElementById('chatbot-toggle');
    const minimize = document.getElementById('chatbot-minimize');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const langSelect = document.getElementById('chatbot-language');
    
    toggle?.addEventListener('click', () => this.toggleChat());
    minimize?.addEventListener('click', () => this.toggleChat());
    sendBtn?.addEventListener('click', () => this.sendMessage());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    langSelect?.addEventListener('change', (e) => this.changeLanguage(e.target.value));
    
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
  }

  changeLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('cityfix_language', lang);
    
    const container = document.getElementById('chatbot-container');
    if (lang === 'ar' || lang === 'he') {
      container.classList.add('rtl');
    } else {
      container.classList.remove('rtl');
    }
    
    const input = document.getElementById('chatbot-input');
    const placeholders = {
      en: 'Type your message...',
      ar: 'اكتب رسالتك...',
      he: 'הקלד את ההודעה שלך...',
      ru: 'Введите ваше сообщение...'
    };
    input.placeholder = placeholders[lang];
    
    this.updateSuggestionChips();
  }

  updateSuggestionChips() {
    const chips = document.querySelectorAll('.suggestion-chip');
    const texts = {
      'how-report': { en: 'How to report?', ar: 'كيف أبلغ؟', he: 'איך לדווח?', ru: 'Как сообщить?' },
      'track-report': { en: 'Track my report', ar: 'تتبع بلاغي', he: 'עקוב אחרי הדיווח', ru: 'Отследить отчет' },
      'issue-types': { en: 'Issue types', ar: 'أنواع المشاكل', he: 'סוגי בעיות', ru: 'Типы проблем' }
    };
    
    chips.forEach(chip => {
      const type = chip.dataset.message;
      chip.textContent = texts[type]?.[this.currentLanguage] || texts[type]?.en || '';
    });
  }

  loadWelcomeMessage() {
    const welcomeMessages = {
      en: 'Hello! I\'m your CityFix assistant. How can I help you today?',
      ar: 'مرحباً! أنا مساعدك في CityFix. كيف يمكنني مساعدتك اليوم؟',
      he: 'שלום! אני העוזר שלך ב-CityFix. איך אני יכול לעזור לך היום?',
      ru: 'Здравствуйте! Я ваш помощник CityFix. Чем я могу вам помочь сегодня?'
    };
    
    this.addMessage('bot', welcomeMessages[this.currentLanguage]);
  }

  async sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (!message || this.isTyping) return;
    
    this.addMessage('user', message);
    input.value = '';
    
    this.isTyping = true;
    this.showTypingIndicator();
    
    try {
      const user = JSON.parse(localStorage.getItem('cityfix_user') || '{}');
      const response = await window.apiRequest('/api/ai/chat', {
        method: 'POST',
        body: {
          message,
          language: this.currentLanguage,
          context: this.conversationContext,
          userRole: user.role || 'CITIZEN'
        }
      });
      
      this.hideTypingIndicator();
      
      if (response.success && response.data?.response) {
        this.addMessage('bot', response.data.response);
        this.conversationContext.push({ role: 'user', content: message });
        this.conversationContext.push({ role: 'assistant', content: response.data.response });
        
        if (this.conversationContext.length > 10) {
          this.conversationContext = this.conversationContext.slice(-10);
        }
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      this.hideTypingIndicator();
      console.error('Chatbot error:', error);
      
      const errorMessages = {
        en: 'Sorry, I\'m having trouble responding. Please try again.',
        ar: 'عذراً، أواجه مشكلة في الرد. يرجى المحاولة مرة أخرى.',
        he: 'סליחה, יש לי בעיה להגיב. נסה שוב בבקשה.',
        ru: 'Извините, у меня проблемы с ответом. Пожалуйста, попробуйте еще раз.'
      };
      
      this.addMessage('bot', errorMessages[this.currentLanguage]);
    }
    
    this.isTyping = false;
  }

  addMessage(sender, text) {
    const messagesDiv = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (sender === 'bot') {
      messageDiv.innerHTML = `
        <div class="message-avatar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </div>
        <div class="message-content">${this.escapeHtml(text)}</div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="message-content">${this.escapeHtml(text)}</div>
      `;
    }
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  showTypingIndicator() {
    const messagesDiv = document.getElementById('chatbot-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cityFixChatbot = new CityFixChatbot();
  });
} else {
  window.cityFixChatbot = new CityFixChatbot();
}