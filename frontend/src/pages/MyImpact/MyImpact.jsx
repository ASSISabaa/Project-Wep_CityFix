import { Container, Grid, Paper, Typography, Box, LinearProgress } from '@mui/material';
import { EmojiEvents, TrendingUp, CheckCircle } from '@mui/icons-material';

const MyImpact = () => {
  const stats = {
    reportsSubmitted: 25,
    reportsResolved: 18,
    impactScore: 850,
    rank: 12
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" fontWeight={700} gutterBottom>
        My Impact
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track your contribution to making the city better
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <EmojiEvents sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
            <Typography variant="h3" fontWeight={700} color="primary">
              {stats.impactScore}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Impact Score
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 60, color: 'info.main', mb: 2 }} />
            <Typography variant="h3" fontWeight={700}>
              #{stats.rank}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Leaderboard Rank
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h3" fontWeight={700}>
              {stats.reportsResolved}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reports Resolved
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resolution Rate
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress
                variant="determinate"
                value={(stats.reportsResolved / stats.reportsSubmitted) * 100}
                sx={{ flex: 1, height: 10, borderRadius: 5 }}
              />
              <Typography variant="body1" fontWeight={600}>
                {Math.round((stats.reportsResolved / stats.reportsSubmitted) * 100)}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MyImpact;
