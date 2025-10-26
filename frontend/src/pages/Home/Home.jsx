import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  useTheme,
  alpha
} from '@mui/material';
import {
  SmartToy,
  Speed,
  Analytics,
  Language,
  ArrowForward,
  CheckCircle
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Home = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const features = [
    {
      icon: <SmartToy sx={{ fontSize: 48 }} />,
      title: t('home.features.ai'),
      description: t('home.features.aiDesc')
    },
    {
      icon: <Speed sx={{ fontSize: 48 }} />,
      title: t('home.features.realtime'),
      description: t('home.features.realtimeDesc')
    },
    {
      icon: <Analytics sx={{ fontSize: 48 }} />,
      title: t('home.features.analytics'),
      description: t('home.features.analyticsDesc')
    },
    {
      icon: <Language sx={{ fontSize: 48 }} />,
      title: t('home.features.multilingual'),
      description: t('home.features.multilingualDesc')
    }
  ];

  const benefits = [
    'Instant AI-powered image analysis',
    'Real-time problem tracking',
    'Multi-language support (AR, HE, EN)',
    'Smart map visualization',
    'Advanced analytics dashboard',
    'Professional chatbot assistance',
    'Impact tracking and badges',
    'Role-based access control'
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Typography
                  variant="h2"
                  fontWeight={800}
                  gutterBottom
                  sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
                >
                  {t('home.title')}
                </Typography>

                <Typography
                  variant="h5"
                  sx={{ mb: 4, opacity: 0.95, fontWeight: 400 }}
                >
                  {t('home.subtitle')}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: alpha('#ffffff', 0.9)
                      }
                    }}
                    endIcon={<ArrowForward />}
                  >
                    {t('home.getStarted')}
                  </Button>

                  <Button
                    component={Link}
                    to="/reports"
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: alpha('#ffffff', 0.1)
                      }
                    }}
                  >
                    {t('home.learnMore')}
                  </Button>
                </Box>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800"
                    alt="City"
                    style={{ width: '100%', display: 'block' }}
                  />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography
          variant="h3"
          align="center"
          fontWeight={700}
          gutterBottom
          sx={{ mb: 6 }}
        >
          Powerful Features
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[10]
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'background.default', py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                Why Choose CityFix?
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Transform your city management with our AI-powered platform
                that makes reporting and resolving city issues easier than ever.
              </Typography>

              <Box sx={{ mt: 4 }}>
                {benefits.map((benefit, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2
                    }}
                  >
                    <CheckCircle color="success" />
                    <Typography variant="body1">{benefit}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: theme.shadows[10]
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800"
                  alt="City Management"
                  style={{ width: '100%', display: 'block' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          py: 8
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of citizens making their cities better
          </Typography>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 6,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.9)
              }
            }}
          >
            Sign Up Now
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
