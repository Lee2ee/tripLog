import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Box, Typography, Grid, Card, CardContent, CardActionArea,
  CircularProgress, Alert, Chip, Divider,
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <>
          {/* 검색 / 정렬 / 태그 필터 */}
          {trips.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="제목 또는 작성자 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment> }}
                sx={{ minWidth: 220 }}
              />
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>정렬</InputLabel>
                <Select value={sort} label="정렬" onChange={(e) => setSort(e.target.value)}>
                  <MenuItem value="newest">최신순</MenuItem>
                  <MenuItem value="oldest">오래된순</MenuItem>
                  <MenuItem value="startDate">여행일순</MenuItem>
                  <MenuItem value="duration">기간 긴 순</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>태그</InputLabel>
                <Select value={selectedTag} label="태그" onChange={(e) => setSelectedTag(e.target.value)}>
                  <MenuItem value="">전체</MenuItem>
                  {TRIP_TAGS.map((tag) => <MenuItem key={tag} value={tag}>{tag}</MenuItem>)}
                </Select>
              </FormControl>
              {(search || selectedTag) && (
                <Typography
                  variant="body2" color="primary" sx={{ cursor: 'pointer' }}
                  onClick={() => { setSearch(''); setSelectedTag(''); }}
                >
                  초기화
                </Typography>
              )}
            </Box>
          )}

          {filteredTrips.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              {trips.length === 0
                ? <><PublicIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} /><Typography variant="h6" color="text.secondary">아직 공개된 여행이 없습니다</Typography></>
                : <><SearchIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} /><Typography variant="h6" color="text.secondary">검색 결과가 없습니다.</Typography></>
              }
            </Box>
          )}

          <Grid container spacing={3}>
            {filteredTrips.map((trip) => (
              <Grid item xs={12} sm={6} md={4} key={trip.id}>
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column',
                    transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}
                >
                  {/* 커버 이미지 */}
                  {trip.coverImageUrl && (
                    <Box
                      component="img"
                      src={trip.coverImageUrl}
                      alt={trip.title}
                      sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '8px 8px 0 0', display: 'block' }}
                    />
                  )}

                  <CardActionArea sx={{ flexGrow: 1 }} onClick={() => navigate(`/explore/${trip.id}`)}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ wordBreak: 'keep-all', flex: 1 }}>
                          {trip.title}
                        </Typography>
                        <Tooltip title="링크 복사">
                          <IconButton
                            size="small"
                            onClick={(e) => handleShare(e, trip)}
                            sx={{ ml: 0.5, flexShrink: 0 }}
                          >
                            <ShareIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, color: 'text.secondary' }}>
                        <CalendarTodayIcon sx={{ fontSize: 14 }} />
                        <Typography variant="body2">
                          {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                        </Typography>
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        총 {calcDays(trip.startDate, trip.endDate)}일
                      </Typography>

                      {/* 태그 */}
                      {trip.tags && trip.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {[...trip.tags].slice(0, 3).map((tag) => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} />
                          ))}
                          {trip.tags.length > 3 && (
                            <Chip label={`+${trip.tags.length - 3}`} size="small" sx={{ height: 20, fontSize: '0.68rem' }} />
                          )}
                        </Box>
                      )}

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {trip.ownerNickname}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {trip.memberCount > 0 && (
                            <Chip
                              icon={<PeopleIcon />}
                              label={`${trip.memberCount + 1}명`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {trip.likeCount > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: 'error.light' }}>
                              <FavoriteIcon sx={{ fontSize: 14 }} />
                              <Typography variant="caption">{trip.likeCount}</Typography>
                            </Box>
                          )}
                        </Box>
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
  );
};

export default PublicTripsPage;
