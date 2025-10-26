import { Container, Typography } from '@mui/material';

const Team = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" fontWeight={700}>
        Team Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Manage your team members and their roles
      </Typography>
    </Container>
  );
};

export default Team;
