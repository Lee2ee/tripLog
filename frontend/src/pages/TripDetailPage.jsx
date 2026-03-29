import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Tabs, Tab, CircularProgress, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, ListItemAvatar,
  Avatar, IconButton, Chip, Paper, Divider, Breadcrumbs, Link, Tooltip,
  TextField, Button, Stack,
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios';
import TripMap from '../components/Map/TripMap';
import AddLocationForm from '../components/Trip/AddLocationForm';
import { getUser } from '../store/authStore';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';

const TripDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

  // 멤버 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [memberActionLoading, setMemberActionLoading] = useState(null);

  const fetchTrip = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/trips/${id}`);
      setTrip(response.data.data);
    } catch {
      setError('여행 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

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

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await axiosInstance.get(`/users/search?q=${encodeURIComponent(q.trim())}`);
      // 이미 멤버인 사람 제외
      const memberIds = new Set((trip.members || []).map((m) => m.id));
      setSearchResults((res.data.data || []).filter((u) => !memberIds.has(u.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInvite = async (userId) => {
    setInviteLoading(userId);
    setInviteError('');
    try {
      const res = await axiosInstance.post(`/trips/${id}/members`, { userId });
      const newMember = res.data.data;
      setTrip((prev) => ({ ...prev, members: [...(prev.members || []), newMember], memberCount: (prev.memberCount || 0) + 1 }));
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      setSearchQuery('');
    } catch (err) {
      setInviteError(err.response?.data?.message || '초대에 실패했습니다.');
    } finally {
      setInviteLoading(null);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('이 멤버를 내보내시겠습니까?')) return;
    setMemberActionLoading(memberId);
    try {
      await axiosInstance.delete(`/trips/${id}/members/${memberId}`);
      setTrip((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
        memberCount: Math.max(0, (prev.memberCount || 1) - 1),
      }));
    } catch (err) {
      setError(err.response?.data?.message || '멤버 제거에 실패했습니다.');
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleToggleVisibility = async () => {
    const newIsPublic = !trip.isPublic;
    const msg = newIsPublic ? '이 여행을 공개하시겠습니까?' : '이 여행을 비공개로 변경하시겠습니까?';
    if (!window.confirm(msg)) return;
    setVisibilityLoading(true);
    try {
      const res = await axiosInstance.patch(`/trips/${id}/visibility`, { isPublic: newIsPublic });
      setTrip((prev) => ({ ...prev, isPublic: res.data.data.isPublic }));
    } catch (err) {
      setError(err.response?.data?.message || '공개 설정 변경에 실패했습니다.');
    } finally {
      setVisibilityLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('이 여행에서 나가시겠습니까?')) return;
    try {
      await axiosInstance.delete(`/trips/${id}/leave`);
      navigate('/trips', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || '나가기에 실패했습니다.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (error && !trip) return <Container maxWidth="lg" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
  if (!trip) return null;

  const isOwner = trip.isOwner !== false;
  const activeDay = trip.tripDays?.[activeTab];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 브레드크럼 */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/trips" underline="hover" color="inherit">내 여행</Link>
        <Typography color="text.primary">{trip.title}</Typography>
      </Breadcrumbs>

      {/* 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ wordBreak: 'keep-all' }}>
              {trip.title}
            </Typography>
            {!isOwner && (
              <Chip icon={<PeopleIcon />} label={`${trip.ownerNickname}의 여행`} color="secondary" size="small" />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary">
            {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)} &nbsp;&bull;&nbsp; 총 {trip.tripDays?.length}일
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {isOwner && (
            <Button
              variant="outlined"
              size="small"
              startIcon={visibilityLoading ? <CircularProgress size={14} /> : (trip.isPublic ? <PublicIcon /> : <LockIcon />)}
              onClick={handleToggleVisibility}
              disabled={visibilityLoading}
              color={trip.isPublic ? 'success' : 'inherit'}
            >
              {trip.isPublic ? '공개' : '비공개'}
            </Button>
          )}
          {!isOwner && (
            <Button variant="outlined" color="warning" startIcon={<ExitToAppIcon />} onClick={handleLeave} size="small">
              여행 나가기
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

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
              {/* 좌측: 장소 목록 + 추가 폼 */}
              <Box sx={{ flex: '0 0 340px', minWidth: 0 }}>
                <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
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
                            <ListItemSecondaryAction>
                              <Tooltip title="장소 삭제">
                                <IconButton edge="end" size="small" color="error"
                                  onClick={() => handleDeleteLocation(activeDay.id, loc.id)}
                                  disabled={deleteLoading === loc.id}>
                                  {deleteLoading === loc.id ? <CircularProgress size={16} color="error" /> : <DeleteIcon fontSize="small" />}
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
                      <Typography variant="body2" color="text.secondary">이 날짜에 등록된 장소가 없습니다</Typography>
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

              {/* 우측: 지도 + 멤버 패널 */}
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>경로 지도</Typography>
                  <TripMap key={activeDay.id} locations={activeDay.locations || []} />
                </Box>

                {/* 멤버 패널 */}
                <MemberPanel
                  trip={trip}
                  isOwner={isOwner}
                  currentUser={currentUser}
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  searchLoading={searchLoading}
                  inviteLoading={inviteLoading}
                  inviteError={inviteError}
                  memberActionLoading={memberActionLoading}
                  onSearch={handleSearch}
                  onInvite={handleInvite}
                  onRemoveMember={handleRemoveMember}
                />
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

/* ── 멤버 패널 컴포넌트 ──────────────────────────────── */
const MemberPanel = ({
  trip, isOwner, currentUser,
  searchQuery, searchResults, searchLoading, inviteLoading, inviteError, memberActionLoading,
  onSearch, onInvite, onRemoveMember,
}) => {
  const members = trip.members || [];

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PeopleIcon color="action" fontSize="small" />
        <Typography variant="subtitle1" fontWeight="bold">여행 멤버</Typography>
        <Chip label={members.length + 1} size="small" sx={{ ml: 'auto' }} />
      </Box>
      <Divider />

      <List dense disablePadding>
        {/* 소유자 */}
        <ListItem sx={{ px: 2 }}>
          <ListItemAvatar sx={{ minWidth: 40 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {trip.ownerNickname?.[0]?.toUpperCase()}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={trip.ownerNickname}
            secondary={isOwner ? '나 (소유자)' : '소유자'}
            primaryTypographyProps={{ fontWeight: 'medium', fontSize: '0.9rem' }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
          <Chip icon={<StarIcon />} label="소유자" size="small" color="primary" variant="outlined" />
        </ListItem>

        {/* 초대된 멤버들 */}
        {members.map((member) => {
          const isMe = currentUser?.email === member.email;
          return (
            <React.Fragment key={member.id}>
              <Divider />
              <ListItem sx={{ px: 2 }}>
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                    {member.nickname[0].toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.nickname}
                  secondary={isMe ? '나' : '멤버'}
                  primaryTypographyProps={{ fontWeight: 'medium', fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
                {isOwner && (
                  <Tooltip title="멤버 내보내기">
                    <span>
                      <IconButton
                        size="small" color="error"
                        onClick={() => onRemoveMember(member.id)}
                        disabled={memberActionLoading === member.id}
                      >
                        {memberActionLoading === member.id
                          ? <CircularProgress size={16} />
                          : <DeleteIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>

      {/* 닉네임 검색 초대 (소유자만) */}
      {isOwner && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              <PersonAddIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              닉네임으로 멤버 검색
            </Typography>
            {inviteError && (
              <Alert severity="error" sx={{ mb: 1, py: 0 }}>{inviteError}</Alert>
            )}
            <TextField
              size="small"
              fullWidth
              placeholder="닉네임 입력..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              InputProps={{
                endAdornment: searchLoading && <CircularProgress size={16} />,
              }}
            />
            {searchResults.length > 0 && (
              <Paper variant="outlined" sx={{ mt: 1, maxHeight: 180, overflow: 'auto' }}>
                <List dense disablePadding>
                  {searchResults.map((user, idx) => (
                    <React.Fragment key={user.id}>
                      {idx > 0 && <Divider />}
                      <ListItem sx={{ px: 1.5 }}>
                        <ListItemAvatar sx={{ minWidth: 36 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                            {user.nickname[0].toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.nickname}
                          primaryTypographyProps={{ fontSize: '0.875rem' }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => onInvite(user.id)}
                          disabled={inviteLoading === user.id}
                          sx={{ flexShrink: 0, minWidth: 52 }}
                        >
                          {inviteLoading === user.id ? <CircularProgress size={14} color="inherit" /> : '초대'}
                        </Button>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
            {searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                검색 결과가 없습니다
              </Typography>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default TripDetailPage;
