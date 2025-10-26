import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatbotService from '../../services/chatbotService';

const initialState = {
  messages: [],
  isOpen: false,
  isTyping: false,
  error: null
};

export const sendMessage = createAsyncThunk(
  'chatbot/sendMessage',
  async ({ message, context }, { rejectWithValue }) => {
    try {
      const response = await chatbotService.sendMessage(message, context);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    toggleChatbot: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeChatbot: (state) => {
      state.isOpen = false;
    },
    openChatbot: (state) => {
      state.isOpen = true;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state, action) => {
        state.isTyping = true;
        state.messages.push({
          id: Date.now(),
          content: action.meta.arg.message,
          sender: 'user',
          timestamp: new Date().toISOString()
        });
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isTyping = false;
        state.messages.push({
          id: Date.now(),
          content: action.payload.message,
          sender: 'bot',
          timestamp: action.payload.timestamp
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isTyping = false;
        state.error = action.payload;
      });
  }
});

export const { toggleChatbot, closeChatbot, openChatbot, addMessage, clearMessages } = chatbotSlice.actions;
export default chatbotSlice.reducer;
