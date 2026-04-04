import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Tabs, Tab, CircularProgress, Alert,
  List, ListItem, ListItemText, Chip, Paper, Divider, Breadcrumbs, Link,
  Tooltip, IconButton, Snackbar, Button,
} from '@mui/material';
import { useParams, Link as RouterLink, Navigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { getUser } from '../store/authStore';
import TripMap from '../components/Map/TripMap';
import PublicIcon from '@mui/icons-material/Public';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import ShareIcon from '@mui/icons-material/Share';

const PublicTripDetailPage = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState('');

  const fetchTrip = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/trips/public/${id}`);
      setTrip(res.data.data);
    } catch (err) {
      setError(err.response?.status === 403
        ? '비공개 여행입니다.'
        : '여행 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (error) return <Container maxWidth="lg" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
  if (!trip) return null;

  // 내 여행이면 편집 가능한 상세 페이지로 이동
  const currentUser = getUser();
  if (currentUser && trip.ownerId === currentUser.id) {
    return <Navigate to={`/trips/${id}`} replace />;
  }

  const activeDay = trip.tripDays?.[activeTab];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 브레드크럼 */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/explore" underline="hover" color="inherit">여행 탐색</Link>
        <Typography color="text.primary">{trip.title}</Typography>
      </Breadcrumbs>

      {/* 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="h4" fontWeight="bold" sx={{ wordBreak: 'keep-all' }}>
              {trip.title}
            </Typography>
            <Chip icon={<PublicIcon />} label="공개 여행" color="success" size="small" />
          </Box>
          <Typography variant="body1" color="text.secondary">
            {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)} &nbsp;&bull;&nbsp; 총 {trip.tripDays?.length}일
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">{trip.ownerNickname}</Typography>
            {trip.memberCount > 0 && (
              <>
                <Typography variant="body2" color="text.secondary">&bull;</Typography>
                <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{trip.memberCount + 1}명</Typography>
              </>
            )}
          </Box>
          {trip.tags && trip.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7, mt: 1 }}>
              {[...trip.tags].map((tag) => (
                <Chip key={tag} label={tag} size="small" color="primary" variant="outlined" />
              ))}
            </Box>
          )}
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ShareIcon />}
          onClick={() => navigator.clipboard.writeText(window.location.href).then(() => setSnackbar('링크가 복사되었습니다.'))}
        >
          공유
        </Button>
      </Box>

      {/* 일자 탭 */}
      {trip.tripDays && trip.tripDays.length > 0 ? (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
              {trip.tripDays.map((day, index) => (
                <Tab
                  key={day.id}
                  label={
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" display="block" fontWeight="bold">{index + 1}일차</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDateShort(day.date)}</Typography>
                    </Box>
                  }
                  sx={{ minWidth: 80 }}
                />
              ))}
            </Tabs>
          </Box>

          {activeDay && (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              {/* 좌측: 장소 목록 (읽기 전용) */}
              <Box sx={{ flex: '0 0 340px', minWidth: 0 }}>
                <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      장소 목록
                      <Chip label={activeDay.locations?.length || 0} size="small" sx={{ ml: 1 }} />
                    </Typography>
                  </Box>
                  <Divider />
                  {activeDay.locations && activeDay.locations.length > 0 ? (
                    <List dense disablePadding>
                      {activeDay.locations.map((loc, index) => (
                        <React.Fragment key={loc.id}>
                          <ListItem sx={{ px: 2 }}>
                            <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 'bold', mr: 1.5, flexShrink: 0 }}>
                              {index + 1}
                            </Box>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                  <span>{loc.name}</span>
                                  {loc.category && (
                                    <Chip label={loc.category} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.7rem' }} />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box component="span">
                                  <Box component="span" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                                  </Box>
                                  {loc.memo && (
                                    <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', fontStyle: 'italic', mt: 0.25 }}>
                                      {loc.memo}
                                    </Box>
                                  )}
                                </Box>
                              }
                              primaryTypographyProps={{ fontWeight: 'medium', sx: { wordBreak: 'keep-all' } }}
                              secondaryTypographyProps={{ component: 'span' }}
                            />
                          </ListItem>
                          {index < activeDay.locations.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <LocationOnIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                      <Typography variant="body2" color="text.secondary">이 날짜에 등록된 장소가 없습니다</Typography>
                    </Box>
                  )}
                </Paper>
              </Box>

              {/* 우측: 지도 */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>경로 지도</Typography>
                <TripMap key={activeDay.id} locations={activeDay.locations || []} />
              </Box>
            </Box>
          )}
        </>
      ) : (
        <Alert severity="info">이 여행에 등록된 날짜가 없습니다.</Alert>
      )}

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default PublicTripDetailPage;
