import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Box, Typography, Grid, Card, CardContent, CardActionArea,
  CircularProgress, Alert, Chip, Divider, Button,
  TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  IconButton, Tooltip, Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { TRIP_TAGS } from '../components/Trip/CreateTripDialog';
import PublicIcon from '@mui/icons-material/Public';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import ShareIcon from '@mui/icons-material/Share';
import FavoriteIcon from '@mui/icons-material/Favorite';

const PublicTripsPage = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState('');

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedTag, setSelectedTag] = useState('');

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
    return Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleShare = (e, trip) => {
    e.stopPropagation();
    const url = `${window.location.origin}/explore/${trip.id}`;
    navigator.clipboard.writeText(url).then(() => setSnackbar('링크가 복사되었습니다.'));
  };

  const filteredTrips = useMemo(() => {
    let list = [...trips];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.ownerNickname || '').toLowerCase().includes(q)
      );
    }
    if (selectedTag) {
      list = list.filter((t) => (t.tags || []).includes(selectedTag));
    }
    if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sort === 'startDate') list.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    else if (sort === 'duration') list.sort((a, b) => calcDays(b.startDate, b.endDate) - calcDays(a.startDate, a.endDate));
    return list;
  }, [trips, search, selectedTag, sort]);

  const EXPLORE_GRADIENTS = [
    'linear-gradient(135deg, #1A3A5C 0%, #42A5F5 100%)',
    'linear-gradient(135deg, #BF360C 0%, #FFCC02 100%)',
    'linear-gradient(135deg, #1B5E20 0%, #69F0AE 100%)',
    'linear-gradient(135deg, #4A148C 0%, #EA80FC 100%)',
    'linear-gradient(135deg, #880E4F 0%, #FF80AB 100%)',
    'linear-gradient(135deg, #004D40 0%, #64FFDA 100%)',
    'linear-gradient(135deg, #E65100 0%, #FFCA28 100%)',
    'linear-gradient(135deg, #0D47A1 0%, #82B1FF 100%)',
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* 히어로 배너 */}
      <Box sx={{
        background: 'linear-gradient(145deg, #0D2137 0%, #1A3A5C 40%, #C4612A 100%)',
        color: 'white',
        px: { xs: 2, md: 6 },
        py: { xs: 5, md: 7 },
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)' }} />
        <Box sx={{ position: 'absolute', bottom: -40, left: '20%', width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(244,162,97,0.08)' }} />
        <Container maxWidth="lg" disableGutters>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 1 }}>
            Explore Trips
          </Typography>
          <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.5px', mb: 1.5, wordBreak: 'keep-all', lineHeight: 1.2 }}>
            세계의 여행을<br />
            <Box component="span" sx={{ color: '#F4A261' }}>탐색</Box>해보세요
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.68)', maxWidth: 480, wordBreak: 'keep-all', lineHeight: 1.8 }}>
            여행자들이 공유한 생생한 여행 일정과 경로를 발견하고 영감을 받아보세요.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
        )}
        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

        {!loading && !error && (
          <>
            {/* 검색 / 정렬 / 태그 필터 */}
            {trips.length > 0 && (
              <Box sx={{
                display: 'flex', gap: 1.5, mb: 4, flexWrap: 'wrap', alignItems: 'center',
                p: 2, bgcolor: 'white', borderRadius: 3, boxShadow: 1,
              }}>
                <TextField
                  size="small"
                  placeholder="제목 또는 작성자 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                  sx={{ flex: { xs: '1 1 100%', sm: '1 1 220px' }, minWidth: 0 }}
                />
                <FormControl size="small" sx={{ flex: '1 1 110px', minWidth: 0 }}>
                  <InputLabel>정렬</InputLabel>
                  <Select value={sort} label="정렬" onChange={(e) => setSort(e.target.value)}>
                    <MenuItem value="newest">최신순</MenuItem>
                    <MenuItem value="oldest">오래된순</MenuItem>
                    <MenuItem value="startDate">여행일순</MenuItem>
                    <MenuItem value="duration">기간 긴 순</MenuItem>
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

            {filteredTrips.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                {trips.length === 0 ? (
                  <>
                    <PublicIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight={600}>아직 공개된 여행이 없습니다</Typography>
                  </>
                ) : (
                  <>
                    <SearchIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight={600}>검색 결과가 없습니다</Typography>
                  </>
                )}
              </Box>
            )}

            <Grid container spacing={2.5}>
              {filteredTrips.map((trip, index) => (
                <Grid item xs={12} sm={6} md={4} key={trip.id}>
                  <Card
                    sx={{
                      height: '100%', display: 'flex', flexDirection: 'column',
                      transition: 'transform 0.22s, box-shadow 0.22s',
                      '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 32px rgba(0,0,0,0.14)' },
                    }}
                  >
                    {/* 커버 영역 */}
                    <Box
                      sx={{ position: 'relative', height: 170, borderRadius: '16px 16px 0 0', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}
                      onClick={() => navigate(`/explore/${trip.id}`)}
                    >
                      {trip.coverImageUrl ? (
                        <Box component="img" src={trip.coverImageUrl} alt={trip.title}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <Box sx={{ width: '100%', height: '100%', background: EXPLORE_GRADIENTS[index % EXPLORE_GRADIENTS.length] }} />
                      )}
                      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />
                      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.75 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="white"
                          sx={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)', wordBreak: 'keep-all', lineHeight: 1.3,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {trip.title}
                        </Typography>
                      </Box>
                      {/* 좋아요 */}
                      {trip.likeCount > 0 && (
                        <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 0.4,
                          bgcolor: 'rgba(0,0,0,0.45)', px: 1, py: 0.3, borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                          <FavoriteIcon sx={{ fontSize: 12, color: '#FF6B6B' }} />
                          <Typography variant="caption" color="white" fontWeight={700}>{trip.likeCount}</Typography>
                        </Box>
                      )}
                      {/* 공유 버튼 */}
                      <Box sx={{ position: 'absolute', top: 6, left: 6 }}>
                        <Tooltip title="링크 복사">
                          <IconButton size="small" onClick={(e) => handleShare(e, trip)}
                            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', backdropFilter: 'blur(4px)',
                              width: 28, height: 28, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                            <ShareIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* 카드 본문 */}
                    <CardActionArea sx={{ flexGrow: 1 }} onClick={() => navigate(`/explore/${trip.id}`)}>
                      <CardContent sx={{ py: 1.5, px: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(trip.startDate)} · {calcDays(trip.startDate, trip.endDate)}일
                          </Typography>
                        </Box>

                        {trip.tags && trip.tags.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                            {[...trip.tags].slice(0, 3).map((tag) => (
                              <Chip key={tag} label={tag} size="small"
                                sx={{ height: 19, fontSize: '0.62rem', bgcolor: '#FFF3E8', color: 'secondary.dark', border: 'none' }} />
                            ))}
                          </Box>
                        )}

                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>{trip.ownerNickname}</Typography>
                          </Box>
                          {trip.memberCount > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                              <PeopleIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                              <Typography variant="caption" color="text.secondary">{trip.memberCount + 1}명</Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <Snackbar
          open={!!snackbar}
          autoHideDuration={3000}
          onClose={() => setSnackbar('')}
          message={snackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Container>
    </Box>
  );
};

export default PublicTripsPage;
