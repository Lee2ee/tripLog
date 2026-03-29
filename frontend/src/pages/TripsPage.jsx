import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Button, Grid, Card, CardContent,
  CardActions, Chip, CircularProgress, Alert, IconButton, Tooltip, Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import CreateTripDialog from '../components/Trip/CreateTripDialog';
import AddIcon from '@mui/icons-material/Add';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import DeleteIcon from '@mui/icons-material/Delete';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';

const TripsPage = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/trips');
      setTrips(response.data.data || []);
    } catch {
      setError('여행 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleCreateTrip = async (formData) => {
    setCreating(true);
    try {
      const response = await axiosInstance.post('/trips', formData);
      setTrips((prev) => [response.data.data, ...prev]);
      setDialogOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTrip = async (e, tripId) => {
    e.stopPropagation();
    if (!window.confirm('이 여행을 삭제하시겠습니까? 모든 데이터가 삭제됩니다.')) return;
    setActionLoading(tripId);
    try {
      await axiosInstance.delete(`/trips/${tripId}`);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch {
      setError('여행 삭제에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveTrip = async (e, tripId) => {
    e.stopPropagation();
    if (!window.confirm('이 여행에서 나가시겠습니까?')) return;
    setActionLoading(tripId);
    try {
      await axiosInstance.delete(`/trips/${tripId}/leave`);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) {
      setError(err.response?.data?.message || '여행 나가기에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDuration = (s, e) => {
    if (!s || !e) return 0;
    return Math.round((new Date(e) - new Date(s)) / 86400000) + 1;
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>내 여행</Typography>
          <Typography variant="body1" color="text.secondary">총 {trips.length}개의 여행</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} size="large" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          새 여행
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {trips.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'grey.50', borderRadius: 3, border: '2px dashed', borderColor: 'grey.300' }}>
          <FlightTakeoffIcon sx={{ fontSize: 72, color: 'grey.400', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>아직 여행이 없습니다</Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>첫 번째 여행을 계획해보세요!</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>첫 여행 만들기</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {trips.map((trip) => {
            const duration = getDuration(trip.startDate, trip.endDate);
            const isOwner = trip.isOwner !== false; // default true for backward compat
            return (
              <Grid item xs={12} sm={6} md={4} key={trip.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                  }}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <Box sx={{ height: 8, bgcolor: isOwner ? 'primary.main' : 'secondary.main', borderRadius: '8px 8px 0 0' }} />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ wordBreak: 'keep-all' }}>
                        {trip.title}
                      </Typography>
                      <Chip label={`${duration}일`} size="small" color={isOwner ? 'primary' : 'secondary'} variant="outlined" sx={{ flexShrink: 0 }} />
                    </Box>

                    {!isOwner && (
                      <Chip
                        icon={<PeopleIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${trip.ownerNickname}의 여행`}
                        size="small"
                        color="secondary"
                        variant="filled"
                        sx={{ mb: 1, fontSize: '0.7rem' }}
                      />
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <CalendarTodayIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'keep-all' }}>
                        {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                      </Typography>
                    </Box>

                    {trip.memberCount > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          멤버 {trip.memberCount}명
                        </Typography>
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 1.5 }}>
                    {isOwner ? (
                      <Tooltip title="여행 삭제">
                        <IconButton
                          size="small" color="error"
                          onClick={(e) => handleDeleteTrip(e, trip.id)}
                          disabled={actionLoading === trip.id}
                        >
                          {actionLoading === trip.id ? <CircularProgress size={20} color="error" /> : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="여행에서 나가기">
                        <IconButton
                          size="small" color="warning"
                          onClick={(e) => handleLeaveTrip(e, trip.id)}
                          disabled={actionLoading === trip.id}
                        >
                          {actionLoading === trip.id ? <CircularProgress size={20} color="warning" /> : <ExitToAppIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <CreateTripDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreateTrip}
        loading={creating}
      />
    </Container>
  );
};

export default TripsPage;
