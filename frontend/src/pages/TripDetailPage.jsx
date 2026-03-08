import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Paper,
  Divider,
  Breadcrumbs,
  Link,
  Tooltip,
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios';
import TripMap from '../components/Map/TripMap';
import AddLocationForm from '../components/Trip/AddLocationForm';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const TripDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const fetchTrip = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/trips/${id}`);
      setTrip(response.data.data);
    } catch (err) {
      setError('여행 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const handleAddLocation = async (dayId, payload) => {
    const response = await axiosInstance.post(`/trips/${id}/days/${dayId}/locations`, payload);
    const newLocation = response.data.data;

    setTrip((prev) => ({
      ...prev,
      tripDays: prev.tripDays.map((day) =>
        day.id === dayId
          ? { ...day, locations: [...day.locations, newLocation].sort((a, b) => a.orderIndex - b.orderIndex) }
          : day
      ),
    }));
  };

  const handleDeleteLocation = async (dayId, locationId) => {
    if (!window.confirm('이 장소를 삭제하시겠습니까?')) return;
    setDeleteLoading(locationId);
    try {
      await axiosInstance.delete(`/locations/${locationId}`);
      setTrip((prev) => ({
        ...prev,
        tripDays: prev.tripDays.map((day) =>
          day.id === dayId
            ? { ...day, locations: day.locations.filter((loc) => loc.id !== locationId) }
            : day
        ),
      }));
    } catch {
      setError('장소 삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!trip) return null;

  const activeDay = trip.tripDays?.[activeTab];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/trips" underline="hover" color="inherit">
          내 여행
        </Link>
        <Typography color="text.primary">{trip.title}</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ wordBreak: 'keep-all' }}>
          {trip.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)} &nbsp;&bull;&nbsp;
          총 {trip.tripDays?.length}일
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {trip.tripDays && trip.tripDays.length > 0 ? (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newVal) => setActiveTab(newVal)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {trip.tripDays.map((day, index) => (
                <Tab
                  key={day.id}
                  label={
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" display="block" fontWeight="bold">
                        {index + 1}일차
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateShort(day.date)}
                      </Typography>
                    </Box>
                  }
                  sx={{ minWidth: 80 }}
                />
              ))}
            </Tabs>
          </Box>

          {activeDay && (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              {/* 좌측: 장소 목록 + 추가 폼 */}
              <Box sx={{ flex: '0 0 340px', minWidth: 0 }}>
                <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      장소 목록
                      <Chip
                        label={activeDay.locations?.length || 0}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Box>
                  <Divider />
                  {activeDay.locations && activeDay.locations.length > 0 ? (
                    <List dense disablePadding>
                      {activeDay.locations.map((loc, index) => (
                        <React.Fragment key={loc.id}>
                          <ListItem sx={{ px: 2 }}>
                            <Box
                              sx={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 13,
                                fontWeight: 'bold',
                                mr: 1.5,
                                flexShrink: 0,
                              }}
                            >
                              {index + 1}
                            </Box>
                            <ListItemText
                              primary={loc.name}
                              secondary={`${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`}
                              primaryTypographyProps={{ fontWeight: 'medium', sx: { wordBreak: 'keep-all' } }}
                              secondaryTypographyProps={{ fontSize: '0.75rem' }}
                            />
                            <ListItemSecondaryAction>
                              <Tooltip title="장소 삭제">
                                <IconButton
                                  edge="end"
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteLocation(activeDay.id, loc.id)}
                                  disabled={deleteLoading === loc.id}
                                >
                                  {deleteLoading === loc.id ? (
                                    <CircularProgress size={16} color="error" />
                                  ) : (
                                    <DeleteIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < activeDay.locations.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <LocationOnIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                      <Typography variant="body2" color="text.secondary">
                        이 날짜에 등록된 장소가 없습니다
                      </Typography>
                    </Box>
                  )}
                </Paper>

                <AddLocationForm
                  tripId={parseInt(id)}
                  dayId={activeDay.id}
                  onLocationAdded={(payload) => handleAddLocation(activeDay.id, payload)}
                  existingCount={activeDay.locations?.length || 0}
                />
              </Box>

              {/* 우측: 지도 */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  경로 지도
                </Typography>
                <TripMap locations={activeDay.locations || []} />
              </Box>
            </Box>
          )}
        </>
      ) : (
        <Alert severity="info">이 여행에 등록된 날짜가 없습니다.</Alert>
      )}
    </Container>
  );
};

export default TripDetailPage;
