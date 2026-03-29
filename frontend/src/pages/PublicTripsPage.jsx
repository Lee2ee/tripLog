import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Grid, Card, CardContent, CardActionArea,
  CircularProgress, Alert, Chip, Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import PublicIcon from '@mui/icons-material/Public';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';

const PublicTripsPage = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance.get('/trips/public')
      .then((res) => setTrips(res.data.data || []))
      .catch(() => setError('공개 여행 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calcDays = (start, end) => {
    if (!start || !end) return 0;
    const diff = new Date(end) - new Date(start);
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <PublicIcon color="primary" />
          <Typography variant="h4" fontWeight="bold">여행 탐색</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          다른 사람들의 공개 여행 일정을 탐색해 보세요
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && trips.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <PublicIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">아직 공개된 여행이 없습니다</Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {trips.map((trip) => (
          <Grid item xs={12} sm={6} md={4} key={trip.id}>
            <Card
              variant="outlined"
              sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}
            >
              <CardActionArea sx={{ flexGrow: 1 }} onClick={() => navigate(`/explore/${trip.id}`)}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ wordBreak: 'keep-all' }}>
                    {trip.title}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, color: 'text.secondary' }}>
                    <CalendarTodayIcon sx={{ fontSize: 14 }} />
                    <Typography variant="body2">
                      {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    총 {calcDays(trip.startDate, trip.endDate)}일
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {trip.ownerNickname}
                      </Typography>
                    </Box>
                    {trip.memberCount > 0 && (
                      <Chip
                        icon={<PeopleIcon />}
                        label={`${trip.memberCount + 1}명`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default PublicTripsPage;
