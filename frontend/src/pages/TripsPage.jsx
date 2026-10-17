import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Box, Typography, Button, Grid, Card, CardContent,
  CardActions, Chip, CircularProgress, Alert, IconButton, Tooltip, Stack,
  TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import CreateTripDialog, { TRIP_TAGS } from '../components/Trip/CreateTripDialog';
import AddIcon from '@mui/icons-material/Add';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import DeleteIcon from '@mui/icons-material/Delete';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const TripsPage = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [snackbar, setSnackbar] = useState('');

  // 검색 / 정렬 / 태그 필터
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedTag, setSelectedTag] = useState('');

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

  const handleCopyTrip = async (e, tripId) => {
    e.stopPropagation();
    setActionLoading(`copy-${tripId}`);
    try {
      const res = await axiosInstance.post(`/trips/${tripId}/copy`);
      setTrips((prev) => [res.data.data, ...prev]);
      setSnackbar('여행이 복사되었습니다.');
    } catch (err) {
      setError(err.response?.data?.message || '여행 복사에 실패했습니다.');
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

  const filteredTrips = useMemo(() => {
    let list = [...trips];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (selectedTag) {
      list = list.filter((t) => (t.tags || []).includes(selectedTag));
    }
    if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    else if (sort === 'startDate') list.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    return list;
  }, [trips, search, selectedTag, sort]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  // 커버 이미지 없을 때 사용할 여행 테마 그라데이션
  const CARD_GRADIENTS = [
    'linear-gradient(135deg, #1A3A5C 0%, #2196F3 100%)',
    'linear-gradient(135deg, #C4612A 0%, #F9C74F 100%)',
    'linear-gradient(135deg, #1B5E20 0%, #66BB6A 100%)',
    'linear-gradient(135deg, #4A148C 0%, #9C27B0 100%)',
    'linear-gradient(135deg, #880E4F 0%, #F06292 100%)',
    'linear-gradient(135deg, #004D40 0%, #26C6DA 100%)',
    'linear-gradient(135deg, #BF360C 0%, #FFAB40 100%)',
    'linear-gradient(135deg, #1A237E 0%, #7986CB 100%)',
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* 히어로 배너 */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0D2137 0%, #1A3A5C 50%, #1E6A82 100%)',
        color: 'white',
        px: { xs: 2, md: 6 },
        py: { xs: 4, md: 5 },
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)' }} />
        <Box sx={{ position: 'absolute', bottom: -30, left: '30%', width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(244,162,97,0.08)' }} />
        <Container maxWidth="lg" disableGutters>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FlightTakeoffIcon sx={{ color: '#F4A261', fontSize: 20 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  My Journeys
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px', wordBreak: 'keep-all' }}>
                내 여행 기록
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mt: 0.5 }}>
                총 <strong style={{ color: '#F4A261' }}>{trips.length}</strong>개의 여행
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{
                bgcolor: '#E07B39',
                flexShrink: 0,
                px: 3, py: 1.25,
                borderRadius: 2,
                fontWeight: 700,
                '&:hover': { bgcolor: '#C4612A', boxShadow: '0 4px 16px rgba(224,123,57,0.4)' },
              }}
            >
              새 여행
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* 검색 / 정렬 / 태그 필터 */}
        {trips.length > 0 && (
          <Box sx={{
            display: 'flex', gap: 1.5, mb: 4, flexWrap: 'wrap', alignItems: 'center',
            p: 2, bgcolor: 'white', borderRadius: 3, boxShadow: 1,
          }}>
            <TextField
              size="small"
              placeholder="제목 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
              sx={{ flex: { xs: '1 1 100%', sm: '1 1 200px' }, minWidth: 0 }}
            />
            <FormControl size="small" sx={{ flex: '1 1 110px', minWidth: 0 }}>
              <InputLabel>정렬</InputLabel>
              <Select value={sort} label="정렬" onChange={(e) => setSort(e.target.value)}>
                <MenuItem value="newest">최신순</MenuItem>
                <MenuItem value="oldest">오래된순</MenuItem>
                <MenuItem value="startDate">여행일순</MenuItem>
                <MenuItem value="title">제목순</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: '1 1 110px', minWidth: 0 }}>
              <InputLabel>태그</InputLabel>
              <Select value={selectedTag} label="태그" onChange={(e) => setSelectedTag(e.target.value)}>
                <MenuItem value="">전체</MenuItem>
                {TRIP_TAGS.map((tag) => <MenuItem key={tag} value={tag}>{tag}</MenuItem>)}
              </Select>
            </FormControl>
            {(search || selectedTag) && (
              <Button size="small" color="secondary" onClick={() => { setSearch(''); setSelectedTag(''); }}>초기화</Button>
            )}
          </Box>
        )}

        {trips.length === 0 ? (
          <Box sx={{
            textAlign: 'center', py: { xs: 8, md: 12 },
            background: 'linear-gradient(135deg, #f0f4ff 0%, #fdf6ee 100%)',
            borderRadius: 4, border: '2px dashed #D0D8E8',
          }}>
            <FlightTakeoffIcon sx={{ fontSize: 64, color: 'primary.light', mb: 2, opacity: 0.5 }} />
            <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
              아직 여행이 없습니다
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4} sx={{ wordBreak: 'keep-all' }}>
              첫 번째 여행을 계획하고 기록을 시작해보세요
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              size="large"
              sx={{ borderRadius: 2, px: 4 }}
            >
              첫 여행 만들기
            </Button>
          </Box>
        ) : filteredTrips.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <SearchIcon sx={{ fontSize: 48, mb: 1.5, color: 'text.disabled' }} />
            <Typography color="text.secondary" fontWeight={500}>검색 결과가 없습니다</Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {filteredTrips.map((trip, index) => {
              const duration = getDuration(trip.startDate, trip.endDate);
              const isOwner = trip.isOwner !== false;
              const isCopying = actionLoading === `copy-${trip.id}`;
              const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
              return (
                <Grid item xs={12} sm={6} md={4} key={trip.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.22s, box-shadow 0.22s',
                      '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 32px rgba(0,0,0,0.14)' },
                    }}
                    onClick={() => navigate(`/trips/${trip.id}`)}
                  >
                    {/* 커버 영역 */}
                    <Box sx={{ position: 'relative', height: 160, borderRadius: '16px 16px 0 0', overflow: 'hidden', flexShrink: 0 }}>
                      {trip.coverImageUrl ? (
                        <Box
                          component="img"
                          src={trip.coverImageUrl}
                          alt={trip.title}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <Box sx={{ width: '100%', height: '100%', background: gradient }} />
                      )}
                      {/* 오버레이 그라데이션 */}
                      <Box sx={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)',
                      }} />
                      {/* 카드 제목 */}
                      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.75 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color="white"
                          sx={{
                            wordBreak: 'keep-all', lineHeight: 1.3,
                            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}
                        >
                          {trip.title}
                        </Typography>
                      </Box>
                      {/* 기간 뱃지 */}
                      <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                        <Box sx={{
                          bgcolor: 'rgba(255,255,255,0.92)', px: 1.25, py: 0.3,
                          borderRadius: 4, backdropFilter: 'blur(4px)',
                        }}>
                          <Typography variant="caption" fontWeight={700} color="primary.main">
                            {duration}일
                          </Typography>
                        </Box>
                      </Box>
                      {/* 초대 여행 뱃지 */}
                      {!isOwner && (
                        <Box sx={{ position: 'absolute', top: 10, left: 10 }}>
                          <Box sx={{ bgcolor: 'rgba(224,123,57,0.9)', px: 1.25, py: 0.3, borderRadius: 4 }}>
                            <Typography variant="caption" fontWeight={700} color="white" sx={{ fontSize: '0.65rem' }}>
                              초대됨
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {/* 카드 본문 */}
                    <CardContent sx={{ flexGrow: 1, py: 1.5, px: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                        <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                        </Typography>
                      </Box>

                      {trip.memberCount > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                          <PeopleIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">멤버 {trip.memberCount}명</Typography>
                        </Box>
                      )}

                      {trip.tags && trip.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {[...trip.tags].slice(0, 3).map((tag) => (
                            <Chip key={tag} label={tag} size="small"
                              sx={{ height: 19, fontSize: '0.62rem', bgcolor: '#F0F4FF', color: 'primary.main', border: 'none' }} />
                          ))}
                          {trip.tags.length > 3 && (
                            <Chip label={`+${trip.tags.length - 3}`} size="small"
                              sx={{ height: 19, fontSize: '0.62rem', bgcolor: '#F5F5F5' }} />
                          )}
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'flex-end', px: 1.5, pb: 1.25, pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                      {isOwner && (
                        <Tooltip title="여행 복사">
                          <IconButton size="small" onClick={(e) => handleCopyTrip(e, trip.id)} disabled={!!actionLoading} sx={{ p: '5px' }}>
                            {isCopying ? <CircularProgress size={16} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </Tooltip>
                      )}
                      {isOwner ? (
                        <Tooltip title="여행 삭제">
                          <IconButton size="small" color="error" onClick={(e) => handleDeleteTrip(e, trip.id)} disabled={!!actionLoading} sx={{ p: '5px' }}>
                            {actionLoading === trip.id ? <CircularProgress size={16} color="error" /> : <DeleteIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="여행에서 나가기">
                          <IconButton size="small" color="warning" onClick={(e) => handleLeaveTrip(e, trip.id)} disabled={!!actionLoading} sx={{ p: '5px' }}>
                            {actionLoading === trip.id ? <CircularProgress size={16} color="warning" /> : <ExitToAppIcon sx={{ fontSize: 16 }} />}
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
      </Container>
    </Box>
  );

      <CreateTripDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreateTrip}
        loading={creating}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
};

export default TripsPage;
