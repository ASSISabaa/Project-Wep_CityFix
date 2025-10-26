import { Container, Paper, Typography, Box } from '@mui/material';

const Settings = () => {
  return (
    <Container maxWidth="md">
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your account preferences
        </Typography>
      </Paper>
    </Container>
  );
};

export default Settings;
