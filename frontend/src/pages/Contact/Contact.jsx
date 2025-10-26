import { Container, Paper, Typography, TextField, Button } from '@mui/material';

const Contact = () => {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Contact Us
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Get in touch with our support team
        </Typography>

        <TextField fullWidth label="Name" sx={{ mb: 2 }} />
        <TextField fullWidth label="Email" type="email" sx={{ mb: 2 }} />
        <TextField fullWidth label="Message" multiline rows={4} sx={{ mb: 2 }} />
        <Button variant="contained" fullWidth>
          Send Message
        </Button>
      </Paper>
    </Container>
  );
};

export default Contact;
