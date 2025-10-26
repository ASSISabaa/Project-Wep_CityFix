import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Collapse,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close,
  Send,
  SmartToy,
  Person
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleChatbot, sendMessage } from '../../store/slices/chatbotSlice';

const Chatbot = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);

  const { isOpen, messages, isTyping } = useSelector(state => state.chatbot);
  const { user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.ui);

  const [input, setInput] = useState('');

  const quickActions = [
    { label: t('chatbot.quickActions.submitReport'), action: 'submit_report' },
    { label: t('chatbot.quickActions.checkStatus'), action: 'check_status' },
    { label: t('chatbot.quickActions.help'), action: 'help' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (input.trim()) {
      dispatch(sendMessage({
        message: input,
        context: {
          userId: user?._id,
          language,
          userRole: user?.role
        }
      }));
      setInput('');
    }
  };

  const handleQuickAction = (action) => {
    let message = '';
    switch (action) {
      case 'submit_report':
        message = 'I want to submit a new report';
        break;
      case 'check_status':
        message = 'What is the status of my reports?';
        break;
      case 'help':
        message = 'I need help';
        break;
      default:
        message = action;
    }
    dispatch(sendMessage({
      message,
      context: {
        userId: user?._id,
        language,
        userRole: user?.role
      }
    }));
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              bottom: 90,
              right: 20,
              zIndex: 1300,
              width: 380,
              maxWidth: 'calc(100vw - 40px)'
            }}
          >
            <Paper
              elevation={8}
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                height: 500,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.dark' }}>
                    <SmartToy />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('chatbot.title')}
                    </Typography>
                    <Typography variant="caption">
                      {isTyping ? t('chatbot.typing') : 'Online'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => dispatch(toggleChatbot())}
                  sx={{ color: 'white' }}
                >
                  <Close />
                </IconButton>
              </Box>

              {/* Messages */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 2,
                  bgcolor: 'background.default',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5
                }}
                className="custom-scrollbar"
              >
                {messages.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <SmartToy sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('chatbot.welcome')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, justifyContent: 'center' }}>
                      {quickActions.map((action) => (
                        <Chip
                          key={action.action}
                          label={action.label}
                          onClick={() => handleQuickAction(action.action)}
                          size="small"
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        gap: 1
                      }}
                    >
                      {msg.sender === 'bot' && (
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          <SmartToy sx={{ fontSize: 20 }} />
                        </Avatar>
                      )}

                      <Paper
                        sx={{
                          p: 1.5,
                          maxWidth: '75%',
                          bgcolor: msg.sender === 'user' ? 'primary.main' : 'background.paper',
                          color: msg.sender === 'user' ? 'white' : 'text.primary',
                          borderRadius: 2,
                          wordBreak: 'break-word'
                        }}
                      >
                        <Typography variant="body2">{msg.content}</Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            opacity: 0.7,
                            fontSize: '0.7rem'
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Paper>

                      {msg.sender === 'user' && (
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                          <Person sx={{ fontSize: 20 }} />
                        </Avatar>
                      )}
                    </Box>
                  </motion.div>
                ))}

                {isTyping && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      <SmartToy sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Paper sx={{ p: 1.5, borderRadius: 2 }}>
                      <CircularProgress size={16} />
                    </Paper>
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  borderTop: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={t('chatbot.placeholder')}
                    disabled={isTyping}
                    variant="outlined"
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <Fab
        color="primary"
        onClick={() => dispatch(toggleChatbot())}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1200
        }}
      >
        {isOpen ? <Close /> : <ChatIcon />}
      </Fab>
    </>
  );
};

export default Chatbot;
