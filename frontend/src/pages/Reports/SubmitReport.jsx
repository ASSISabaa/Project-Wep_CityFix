import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardMedia,
  IconButton,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  SmartToy,
  LocationOn,
  AutoAwesome
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { createReport } from '../../store/slices/reportSlice';
import reportService from '../../services/reportService';
import { toast } from 'react-toastify';

const SubmitReport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    priority: 'medium',
    location: {
      address: '',
      coordinates: { lat: '', lng: '' }
    }
  });

  const [images, setImages] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reportTypes = [
    'pothole',
    'streetlight',
    'garbage',
    'graffiti',
    'traffic',
    'parks',
    'infrastructure',
    'sanitation',
    'other'
  ];

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 5242880,
    onDrop: (acceptedFiles) => {
      const newImages = acceptedFiles.map(file =>
        Object.assign(file, {
          preview: URL.createObjectURL(file)
        })
      );
      setImages([...images, ...newImages]);

      if (newImages.length > 0 && !aiAnalysis) {
        analyzeImage(newImages[0]);
      }
    }
  });

  const analyzeImage = async (imageFile) => {
    setAnalyzingImage(true);
    try {
      const response = await reportService.analyzeImage(imageFile);

      if (response.success) {
        const analysis = response.data.analysis;
        setAiAnalysis(analysis);

        setFormData(prev => ({
          ...prev,
          type: analysis.suggestedCategory || prev.type,
          priority: analysis.suggestedPriority || prev.priority,
          title: analysis.suggestedTitle || prev.title,
          description: analysis.description || prev.description
        }));

        toast.success('AI Analysis Complete! Form auto-filled with suggestions.');
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      toast.warning('Could not analyze image, please fill form manually.');
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            }
          }));
          toast.success('Location captured!');
        },
        () => {
          toast.error('Could not get location');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const reportData = {
        ...formData,
        images: images
      };

      await dispatch(createReport(reportData)).unwrap();
      toast.success('Report submitted successfully!');
      navigate('/reports');
    } catch (error) {
      toast.error(error || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t('report.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload images and let AI analyze the problem automatically
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              {/* Image Upload with AI Analysis */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesome color="primary" />
                  AI-Powered Image Analysis
                </Typography>

                <Box
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: 'background.default',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    Drag & drop images or click to browse
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Upload up to 5 images (Max 5MB each)
                  </Typography>
                </Box>

                {analyzingImage && (
                  <Alert
                    icon={<CircularProgress size={20} />}
                    severity="info"
                    sx={{ mt: 2 }}
                  >
                    AI is analyzing your image...
                  </Alert>
                )}

                {images.length > 0 && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {images.map((file, index) => (
                      <Grid item xs={6} sm={4} key={index}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="140"
                            image={file.preview}
                            alt={`Upload ${index + 1}`}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 5,
                              right: 5,
                              bgcolor: 'error.main',
                              color: 'white',
                              '&:hover': { bgcolor: 'error.dark' }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>

              {/* Form Fields */}
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Type</InputLabel>
                    <Select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      label="Type"
                    >
                      {reportTypes.map(type => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      label="Priority"
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">Location</Typography>
                  <Button
                    size="small"
                    startIcon={<LocationOn />}
                    onClick={getCurrentLocation}
                    variant="outlined"
                  >
                    Use Current Location
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  label="Address"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  required
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting || images.length === 0}
                sx={{ mt: 2 }}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* AI Analysis Results */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToy color="primary" />
              AI Analysis
            </Typography>

            {aiAnalysis ? (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Detected Category
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {aiAnalysis.suggestedCategory || 'Unknown'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Suggested Priority
                  </Typography>
                  <Chip
                    label={aiAnalysis.suggestedPriority || 'Medium'}
                    color="primary"
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Severity Score
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {aiAnalysis.severityScore || 5}/10
                  </Typography>
                </Box>

                {aiAnalysis.keywords && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Keywords
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {aiAnalysis.keywords.map((keyword, idx) => (
                        <Chip key={idx} label={keyword} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Upload an image to get AI-powered analysis and suggestions
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SubmitReport;
