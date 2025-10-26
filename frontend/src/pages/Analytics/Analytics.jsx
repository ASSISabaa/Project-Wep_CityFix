import { Container, Grid, Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const Analytics = () => {
  const data = [
    { month: 'Jan', reports: 65, resolved: 45 },
    { month: 'Feb', reports: 75, resolved: 60 },
    { month: 'Mar', reports: 85, resolved: 70 },
    { month: 'Apr', reports: 70, resolved: 65 },
    { month: 'May', reports: 90, resolved: 75 },
    { month: 'Jun', reports: 95, resolved: 85 }
  ];

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Analytics Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Reports Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="reports" fill="#2563eb" />
                <Bar dataKey="resolved" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trend Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reports" stroke="#2563eb" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
