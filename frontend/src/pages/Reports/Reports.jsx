import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Container, Grid, Card, CardContent, Typography, Chip, Button, Box } from '@mui/material';
import { fetchReports } from '../../store/slices/reportSlice';
import { format } from 'date-fns';

const Reports = () => {
  const dispatch = useDispatch();
  const { reports, isLoading } = useSelector(state => state.reports);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  const getStatusColor = (status) => {
    const colors = {
      new: 'info',
      pending: 'warning',
      inProgress: 'primary',
      resolved: 'success',
      closed: 'default'
    };
    return colors[status] || 'default';
  };

  if (isLoading) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          All Reports
        </Typography>
        <Button component={Link} to="/submit" variant="contained">
          Submit New Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        {reports?.map((report) => (
          <Grid item xs={12} md={6} lg={4} key={report._id}>
            <Card>
              {report.images?.[0] && (
                <img
                  src={report.images[0].url}
                  alt={report.title}
                  style={{ width: '100%', height: 200, objectFit: 'cover' }}
                />
              )}
              <CardContent>
                <Chip
                  label={report.status}
                  color={getStatusColor(report.status)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {report.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {report.description?.substring(0, 100)}...
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button
                    component={Link}
                    to={`/reports/${report._id}`}
                    size="small"
                    variant="outlined"
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Reports;
