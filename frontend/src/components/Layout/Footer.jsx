import { Box, Container, Typography, Link as MuiLink, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="primary" gutterBottom fontWeight={700}>
              CityFix
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-Powered Smart City Management Platform
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink component={Link} to="/" underline="hover" color="text.secondary">
                {t('nav.home')}
              </MuiLink>
              <MuiLink component={Link} to="/reports" underline="hover" color="text.secondary">
                {t('nav.reports')}
              </MuiLink>
              <MuiLink component={Link} to="/contact" underline="hover" color="text.secondary">
                {t('nav.contact')}
              </MuiLink>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Contact
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: support@cityfix.com
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phone: +1 234 567 890
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {currentYear} CityFix. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
