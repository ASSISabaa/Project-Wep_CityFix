import api from './api';

const chatbotService = {
  async sendMessage(message, context = {}) {
    const response = await api.post('/ai/chatbot', {
      message,
      context
    });
    return response.data;
  },

  async getConversationHistory() {
    const response = await api.get('/ai/chatbot/history');
    return response.data;
  },

  async clearConversation() {
    const response = await api.delete('/ai/chatbot/history');
    return response.data;
  }
};

export default chatbotService;
