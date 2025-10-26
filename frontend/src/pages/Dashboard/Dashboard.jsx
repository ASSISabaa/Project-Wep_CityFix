import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Container, Grid, Paper, Typography, Box } from '@mui/material';
import { Report, CheckCircle, Pending, TrendingUp } from '@mui/icons-material';
import { fetchMyReports } from '../../store/slices/reportSlice';

const Dashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { myReports } = useSelector(state => state.reports);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchMyReports());
  }, [dispatch]);

  const stats = [
    {
      title: 'Total Reports',
      value: myReports?.length || 0,
      icon: <Report sx={{ fontSize: 40 }} />,
      color: 'primary.main'
    },
    {
      title: 'Resolved',
      value: myReports?.filter(r => r.status === 'resolved')?.length || 0,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: 'success.main'
    },
    {
      title: 'Pending',
      value: myReports?.filter(r => r.status === 'pending')?.length || 0,
      icon: <Pending sx={{ fontSize: 40 }} />,
      color: 'warning.main'
    },
    {
      title: 'Impact Score',
      value: user?.statistics?.reportsCreated * 10 || 0,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: 'info.main'
    }
  ];

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t('nav.dashboard')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {user?.username}!
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ color: stat.color, mb: 1 }}>
                {stat.icon}
              </Box>
              <Typography variant="h4" fontWeight={700}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Dashboard;
