import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Tooltip,
  Paper,
} from '@mui/material';
import axiosInstance from '../api/axios';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

const GalleryPage = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [images, setImages] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [enlargedImage, setEnlargedImage] = useState(null);

  const fetchTrips = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/trips');
      const tripList = response.data.data || [];
      setTrips(tripList);
      if (tripList.length > 0) {
        setSelectedTripId(tripList[0].id);
      }
    } catch {
      setError('여행 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const fetchImages = useCallback(async (tripId) => {
    if (!tripId) return;
    setLoadingImages(true);
    try {
      const response = await axiosInstance.get(`/trips/${tripId}/images`);
      setImages(response.data.data || []);
    } catch {
      setError('이미지를 불러오지 못했습니다.');
    } finally {
      setLoadingImages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      fetchImages(selectedTripId);
    }
  }, [selectedTripId, fetchImages]);

  const handleTripChange = (e) => {
    setSelectedTripId(e.target.value);
    setImages([]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!selectedTripId) {
      setError('먼저 여행을 선택해주세요.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axiosInstance.post(`/trips/${selectedTripId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newImage = response.data.data;
      setImages((prev) => [newImage, ...prev]);
      setSuccessMsg('사진이 업로드되었습니다!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || '사진 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            사진 갤러리
          </Typography>
          <Typography variant="body1" color="text.secondary">
            여행의 추억을 담아보세요
          </Typography>
        </Box>

        {selectedTripId && (
          <Tooltip title="사진 업로드">
            <Box component="label">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Fab
                color="primary"
                component="span"
                disabled={uploading}
                size="medium"
              >
                {uploading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <CloudUploadIcon />
                )}
              </Fab>
            </Box>
          </Tooltip>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {loadingTrips ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : trips.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: 'grey.50',
            borderRadius: 3,
            border: '2px dashed',
            borderColor: 'grey.300',
          }}
        >
          <PhotoLibraryIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            여행이 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            먼저 여행을 만든 후 사진을 추가하세요.
          </Typography>
        </Paper>
      ) : (
        <>
          <FormControl sx={{ mb: 3, width: '100%', maxWidth: 400 }}>
            <InputLabel>여행 선택</InputLabel>
            <Select
              value={selectedTripId}
              label="여행 선택"
              onChange={handleTripChange}
            >
              {trips.map((trip) => (
                <MenuItem key={trip.id} value={trip.id}>
                  {trip.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedTrip && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                &quot;{selectedTrip.title}&quot;의 사진 {images.length}장
              </Typography>
            </Box>
          )}

          {loadingImages ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : images.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: 'grey.50',
                borderRadius: 3,
                border: '2px dashed',
                borderColor: 'grey.300',
              }}
            >
              <PhotoLibraryIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                사진이 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                여행 사진을 업로드하여 추억을 남겨보세요!
              </Typography>
              <Box component="label">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={uploading}
                >
                  사진 업로드
                </Button>
              </Box>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {images.map((image) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => setEnlargedImage(image)}
                  >
                    <CardMedia
                      component="img"
                      image={image.imageUrl}
                      alt="여행 사진"
                      sx={{ objectFit: 'cover', aspectRatio: '1 / 1', width: '100%' }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* 사진 확대 다이얼로그 */}
      <Dialog
        open={!!enlargedImage}
        onClose={() => setEnlargedImage(null)}
        maxWidth="xl"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
      >
        <DialogContent
          sx={{
            p: 0,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconButton
            onClick={() => setEnlargedImage(null)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              zIndex: 1,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
            }}
          >
            <CloseIcon />
          </IconButton>
          {enlargedImage && (
            <Box
              component="img"
              src={enlargedImage.imageUrl}
              alt="여행 사진 확대"
              sx={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                borderRadius: 2,
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default GalleryPage;
