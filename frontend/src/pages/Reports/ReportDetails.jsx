import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Paper, Typography, Box, Chip, Grid } from '@mui/material';
import { fetchReportById } from '../../store/slices/reportSlice';

const ReportDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentReport } = useSelector(state => state.reports);

  useEffect(() => {
    dispatch(fetchReportById(id));
  }, [dispatch, id]);

  if (!currentReport) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Chip label={currentReport.status} color="primary" sx={{ mb: 2 }} />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {currentReport.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {currentReport.description}
          </Typography>
        </Box>

        {currentReport.images?.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {currentReport.images.map((img, idx) => (
              <Grid item xs={12} md={6} key={idx}>
                <img
                  src={img.url}
                  alt={`Report ${idx + 1}`}
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Grid>
            ))}
          </Grid>
        )}

        <Box>
          <Typography variant="h6" gutterBottom>
            Location
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentReport.location?.address || 'No address provided'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ReportDetails;
