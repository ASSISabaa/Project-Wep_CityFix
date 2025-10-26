import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box } from '@mui/material';
import { Home } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h1" fontWeight={900} color="primary" gutterBottom>
        404
      </Typography>
      <Typography variant="h4" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        The page you are looking for does not exist.
      </Typography>
      <Button
        component={Link}
        to="/"
        variant="contained"
        size="large"
        startIcon={<Home />}
      >
        Go Home
      </Button>
    </Container>
  );
};

export default NotFound;
