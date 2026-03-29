import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Typography, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  IconButton, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, FormControl, InputLabel,
  Alert, CircularProgress, ImageList, ImageListItem, ImageListItemBar,
  TextField, Divider, Tooltip, Stack, Grid, Card, CardContent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import ExploreIcon from '@mui/icons-material/Explore';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';

/* ── 상수 ─────────────────────────────────────────────── */
const EMPTY_CONFIRM = { open: false, action: null, label: '' };
const EMPTY_USER_EDIT = { open: false, user: null, email: '', nickname: '', role: '', newPassword: '', errors: {} };
const EMPTY_TRIP_DIALOG = { open: false, mode: 'create', trip: null, userId: '', title: '', startDate: '', endDate: '', errors: {} };

/* ── 통계 카드 컴포넌트 ──────────────────────────────── */
const StatCard = ({ icon, label, value, color }) => (
  <Card elevation={2} sx={{ borderRadius: 2, borderLeft: `4px solid ${color}` }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}20`, color }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" fontWeight="bold">{value ?? '—'}</Typography>
      </Box>
    </CardContent>
  </Card>
);

/* ── 메인 컴포넌트 ──────────────────────────────────── */
const AdminPage = () => {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [userEditDialog, setUserEditDialog] = useState(EMPTY_USER_EDIT);
  const [userDetailDialog, setUserDetailDialog] = useState({ open: false, user: null });
  const [tripDialog, setTripDialog] = useState(EMPTY_TRIP_DIALOG);
  const [confirmDialog, setConfirmDialog] = useState(EMPTY_CONFIRM);

  /* ── 데이터 fetch ──────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch { setError('통계를 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch { setError('회원 목록을 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/trips');
      setTrips(res.data.data);
    } catch { setError('여행 목록을 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  }, []);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/images');
      setImages(res.data.data);
    } catch { setError('이미지 목록을 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setError('');
    if (tab === 0) fetchStats();
    else if (tab === 1) fetchTrips();
    else if (tab === 2) fetchUsers();
    else fetchImages();
  }, [tab, fetchStats, fetchTrips, fetchUsers, fetchImages]);

  /* ── 삭제 확인 ─────────────────────────────────────── */
  const openConfirm = (label, action) => setConfirmDialog({ open: true, action, label });
  const closeConfirm = () => setConfirmDialog(EMPTY_CONFIRM);
  const handleConfirm = async () => {
    try { await confirmDialog.action(); }
    catch { setError('삭제에 실패했습니다.'); }
    finally { closeConfirm(); }
  };

  /* ── 회원 수정 ─────────────────────────────────────── */
  const openUserEdit = (u) =>
    setUserEditDialog({ open: true, user: u, email: u.email, nickname: u.nickname, role: u.role, newPassword: '', errors: {} });
  const closeUserEdit = () => setUserEditDialog(EMPTY_USER_EDIT);
  const handleUserEditChange = (field) => (e) =>
    setUserEditDialog((p) => ({ ...p, [field]: e.target.value, errors: { ...p.errors, [field]: '' } }));

  const validateUserEdit = () => {
    const errs = {};
    if (!userEditDialog.email.trim()) errs.email = '이메일을 입력해주세요';
    else if (!/\S+@\S+\.\S+/.test(userEditDialog.email)) errs.email = '올바른 이메일 형식이 아닙니다';
    if (!userEditDialog.nickname.trim()) errs.nickname = '닉네임을 입력해주세요';
    if (userEditDialog.newPassword && userEditDialog.newPassword.length < 8)
      errs.newPassword = '비밀번호는 8자 이상이어야 합니다';
    return errs;
  };

  const handleUserEditSave = async () => {
    const errs = validateUserEdit();
    if (Object.keys(errs).length > 0) { setUserEditDialog((p) => ({ ...p, errors: errs })); return; }
    setSaving(true);
    try {
      await api.put(`/admin/users/${userEditDialog.user.id}`, {
        email: userEditDialog.email, nickname: userEditDialog.nickname,
        role: userEditDialog.role, newPassword: userEditDialog.newPassword || null,
      });
      closeUserEdit();
      fetchUsers();
    } catch (e) {
      setUserEditDialog((p) => ({ ...p, errors: { server: e.response?.data?.message || '수정에 실패했습니다.' } }));
    } finally { setSaving(false); }
  };

  /* ── 여행 다이얼로그 ────────────────────────────────── */
  const openTripCreate = () => {
    if (users.length === 0) {
      // users가 없으면 먼저 불러오기
      api.get('/admin/users').then((r) => setUsers(r.data.data));
    }
    setTripDialog({ open: true, mode: 'create', trip: null, userId: '', title: '', startDate: '', endDate: '', errors: {} });
  };

  const openTripEdit = (t) => {
    setTripDialog({ open: true, mode: 'edit', trip: t, userId: '', title: t.title, startDate: t.startDate, endDate: t.endDate, errors: {} });
  };

  const closeTripDialog = () => setTripDialog(EMPTY_TRIP_DIALOG);
  const handleTripChange = (field) => (e) =>
    setTripDialog((p) => ({ ...p, [field]: e.target.value, errors: { ...p.errors, [field]: '' } }));

  const validateTripDialog = () => {
    const errs = {};
    if (tripDialog.mode === 'create' && !tripDialog.userId) errs.userId = '회원을 선택해주세요';
    if (!tripDialog.title.trim()) errs.title = '제목을 입력해주세요';
    if (!tripDialog.startDate) errs.startDate = '시작일을 입력해주세요';
    if (!tripDialog.endDate) errs.endDate = '종료일을 입력해주세요';
    if (tripDialog.startDate && tripDialog.endDate && tripDialog.endDate < tripDialog.startDate)
      errs.endDate = '종료일은 시작일 이후여야 합니다';
    return errs;
  };

  const handleTripSave = async () => {
    const errs = validateTripDialog();
    if (Object.keys(errs).length > 0) { setTripDialog((p) => ({ ...p, errors: errs })); return; }
    setSaving(true);
    try {
      if (tripDialog.mode === 'create') {
        await api.post('/admin/trips', {
          userId: Number(tripDialog.userId),
          title: tripDialog.title,
          startDate: tripDialog.startDate,
          endDate: tripDialog.endDate,
        });
      } else {
        await api.put(`/admin/trips/${tripDialog.trip.id}`, {
          title: tripDialog.title,
          startDate: tripDialog.startDate,
          endDate: tripDialog.endDate,
        });
      }
      closeTripDialog();
      fetchTrips();
    } catch (e) {
      setTripDialog((p) => ({ ...p, errors: { server: e.response?.data?.message || '저장에 실패했습니다.' } }));
    } finally { setSaving(false); }
  };

  /* ── 삭제 핸들러 ───────────────────────────────────── */
  const deleteUser = (u) =>
    openConfirm(`"${u.nickname}" 회원을 삭제하시겠습니까? 해당 회원의 모든 여행 데이터가 함께 삭제됩니다.`, async () => {
      await api.delete(`/admin/users/${u.id}`); fetchUsers();
    });

  const deleteTrip = (t) =>
    openConfirm(`"${t.title}" 여행을 삭제하시겠습니까?`, async () => {
      await api.delete(`/admin/trips/${t.id}`); fetchTrips();
    });

  const deleteImage = (img) =>
    openConfirm('이 이미지를 삭제하시겠습니까?', async () => {
      await api.delete(`/admin/images/${img.id}`); fetchImages();
    });

  /* ── 렌더 ──────────────────────────────────────────── */
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={1}>관리자 페이지</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>시스템 현황 및 콘텐츠 관리</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="대시보드" />
        <Tab label={`여행 관리${trips.length ? ` (${trips.length})` : ''}`} />
        <Tab label={`회원 관리${users.length ? ` (${users.length})` : ''}`} />
        <Tab label={`이미지 관리${images.length ? ` (${images.length})` : ''}`} />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <>
          {/* ─────────────────── 대시보드 탭 ─────────────────── */}
          {tab === 0 && stats && (
            <Box>
              {/* 통계 카드 */}
              <Grid container spacing={2} mb={4}>
                {[
                  { icon: <PeopleIcon />, label: '총 회원 수', value: stats.totalUsers, color: '#1976d2' },
                  { icon: <ExploreIcon />, label: '총 여행 수', value: stats.totalTrips, color: '#388e3c' },
                  { icon: <PhotoLibraryIcon />, label: '총 이미지 수', value: stats.totalImages, color: '#f57c00' },
                  { icon: <TrendingUpIcon />, label: '이번달 여행', value: stats.tripsPerMonth?.at(-1)?.count ?? 0, color: '#7b1fa2' },
                ].map((s) => (
                  <Grid item xs={12} sm={6} md={3} key={s.label}>
                    <StatCard {...s} />
                  </Grid>
                ))}
              </Grid>

              {/* 차트 영역 */}
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>월별 여행 등록 수</Typography>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={stats.tripsPerMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <RTooltip />
                        <Legend />
                        <Line
                          type="monotone" dataKey="count" name="여행 수"
                          stroke="#1976d2" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>월별 신규 회원 수</Typography>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={stats.usersPerMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <RTooltip />
                        <Legend />
                        <Bar dataKey="count" name="신규 회원" fill="#388e3c" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>

              {/* 여행 많은 TOP 5 유저 */}
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>여행 TOP 5 회원</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>순위</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>닉네임</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>이메일</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">여행 수</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 3 }}>데이터 없음</TableCell>
                        </TableRow>
                      ) : stats.topUsers.map((u, idx) => (
                        <TableRow key={u.email} hover>
                          <TableCell>
                            <Chip
                              label={idx + 1}
                              size="small"
                              color={idx === 0 ? 'warning' : idx === 1 ? 'default' : 'default'}
                              sx={{ fontWeight: 'bold', minWidth: 28 }}
                            />
                          </TableCell>
                          <TableCell>{u.nickname}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold" color="primary.main">{u.tripCount}개</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          )}

          {/* ─────────────────── 여행 관리 탭 ─────────────────── */}
          {tab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openTripCreate}>
                  새 여행 등록
                </Button>
              </Box>
              <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>제목</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>작성자</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>시작일</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>종료일</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>등록일</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>관리</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trips.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                          등록된 여행이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : trips.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell>{t.id}</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', maxWidth: 200 }}>
                          <Typography noWrap title={t.title}>{t.title}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{t.userNickname}</Typography>
                          <Typography variant="caption" color="text.secondary">{t.userEmail}</Typography>
                        </TableCell>
                        <TableCell>{t.startDate}</TableCell>
                        <TableCell>{t.endDate}</TableCell>
                        <TableCell>{new Date(t.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="수정">
                              <IconButton size="small" color="primary" onClick={() => openTripEdit(t)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="삭제">
                              <IconButton size="small" color="error" onClick={() => deleteTrip(t)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* ─────────────────── 회원 관리 탭 ─────────────────── */}
          {tab === 2 && (
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>이메일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>닉네임</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>권한</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>여행 수</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>가입일</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>관리</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>회원이 없습니다.</TableCell>
                    </TableRow>
                  ) : users.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.id}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.nickname}</TableCell>
                      <TableCell>
                        <Chip label={u.role === 'ADMIN' ? '관리자' : '일반회원'} color={u.role === 'ADMIN' ? 'error' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>{u.tripCount}개</TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="상세 보기">
                            <IconButton size="small" onClick={() => setUserDetailDialog({ open: true, user: u })}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="정보 수정">
                            <IconButton size="small" color="primary" onClick={() => openUserEdit(u)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={u.role === 'ADMIN' ? '관리자 계정은 삭제할 수 없습니다' : '회원 삭제'}>
                            <span>
                              <IconButton size="small" color="error" onClick={() => deleteUser(u)} disabled={u.role === 'ADMIN'}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* ─────────────────── 이미지 관리 탭 ─────────────────── */}
          {tab === 3 && (
            images.length === 0 ? (
              <Paper sx={{ p: 8, textAlign: 'center', color: 'text.secondary', borderRadius: 2 }} elevation={2}>
                이미지가 없습니다.
              </Paper>
            ) : (
              <ImageList cols={4} gap={12}>
                {images.map((img) => (
                  <ImageListItem key={img.id}>
                    <img src={img.imageUrl} alt={`image-${img.id}`} loading="lazy"
                      style={{ height: 180, objectFit: 'cover', borderRadius: 4 }} />
                    <ImageListItemBar
                      title={`ID: ${img.id}`}
                      actionIcon={
                        <Tooltip title="삭제">
                          <IconButton size="small" sx={{ color: 'white' }} onClick={() => deleteImage(img)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            )
          )}
        </>
      )}

      {/* ─────────────────── 여행 등록/수정 다이얼로그 ─────────────────── */}
      <Dialog open={tripDialog.open} onClose={closeTripDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {tripDialog.mode === 'create' ? '여행 등록' : '여행 수정'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {tripDialog.errors?.server && (
            <Alert severity="error" sx={{ mb: 2 }}>{tripDialog.errors.server}</Alert>
          )}
          <Stack spacing={2}>
            {tripDialog.mode === 'create' && (
              <FormControl fullWidth size="small" error={!!tripDialog.errors?.userId}>
                <InputLabel>회원 선택</InputLabel>
                <Select value={tripDialog.userId} label="회원 선택" onChange={handleTripChange('userId')}>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.nickname} ({u.email})
                    </MenuItem>
                  ))}
                </Select>
                {tripDialog.errors?.userId && (
                  <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>{tripDialog.errors.userId}</Typography>
                )}
              </FormControl>
            )}
            <TextField
              label="제목" size="small" fullWidth
              value={tripDialog.title} onChange={handleTripChange('title')}
              error={!!tripDialog.errors?.title} helperText={tripDialog.errors?.title}
            />
            <TextField
              label="시작일" size="small" fullWidth type="date"
              InputLabelProps={{ shrink: true }}
              value={tripDialog.startDate} onChange={handleTripChange('startDate')}
              error={!!tripDialog.errors?.startDate} helperText={tripDialog.errors?.startDate}
            />
            <TextField
              label="종료일" size="small" fullWidth type="date"
              InputLabelProps={{ shrink: true }}
              value={tripDialog.endDate} onChange={handleTripChange('endDate')}
              inputProps={{ min: tripDialog.startDate }}
              error={!!tripDialog.errors?.endDate} helperText={tripDialog.errors?.endDate}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeTripDialog} disabled={saving}>취소</Button>
          <Button variant="contained" onClick={handleTripSave} disabled={saving}>
            {saving ? <CircularProgress size={22} color="inherit" /> : (tripDialog.mode === 'create' ? '등록' : '저장')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────── 회원 상세 다이얼로그 ─────────────────── */}
      <Dialog open={userDetailDialog.open} onClose={() => setUserDetailDialog({ open: false, user: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>회원 상세 정보</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {userDetailDialog.user && (
            <Stack spacing={1.5}>
              {[
                { label: 'ID', value: userDetailDialog.user.id },
                { label: '이메일', value: userDetailDialog.user.email },
                { label: '닉네임', value: userDetailDialog.user.nickname },
                { label: '권한', value: <Chip label={userDetailDialog.user.role === 'ADMIN' ? '관리자' : '일반회원'} color={userDetailDialog.user.role === 'ADMIN' ? 'error' : 'default'} size="small" /> },
                { label: '여행 수', value: `${userDetailDialog.user.tripCount}개` },
                { label: '가입일', value: new Date(userDetailDialog.user.createdAt).toLocaleString('ko-KR') },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 60, flexShrink: 0 }}>{label}</Typography>
                  <Typography variant="body2" fontWeight="medium">{value}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailDialog({ open: false, user: null })}>닫기</Button>
          <Button variant="outlined" startIcon={<EditIcon />}
            onClick={() => { setUserDetailDialog({ open: false, user: null }); openUserEdit(userDetailDialog.user); }}>
            정보 수정
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────── 회원 정보 수정 다이얼로그 ─────────────────── */}
      <Dialog open={userEditDialog.open} onClose={closeUserEdit} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          회원 정보 수정
          <Typography variant="body2" color="text.secondary">ID: {userEditDialog.user?.id}</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {userEditDialog.errors?.server && (
            <Alert severity="error" sx={{ mb: 2 }}>{userEditDialog.errors.server}</Alert>
          )}
          <Stack spacing={2}>
            <TextField label="이메일" value={userEditDialog.email} onChange={handleUserEditChange('email')}
              error={!!userEditDialog.errors?.email} helperText={userEditDialog.errors?.email} fullWidth size="small" />
            <TextField label="닉네임" value={userEditDialog.nickname} onChange={handleUserEditChange('nickname')}
              error={!!userEditDialog.errors?.nickname} helperText={userEditDialog.errors?.nickname} fullWidth size="small" />
            <FormControl fullWidth size="small">
              <InputLabel>권한</InputLabel>
              <Select value={userEditDialog.role} label="권한" onChange={handleUserEditChange('role')}>
                <MenuItem value="USER">일반회원 (USER)</MenuItem>
                <MenuItem value="ADMIN">관리자 (ADMIN)</MenuItem>
              </Select>
            </FormControl>
            <Divider />
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>비밀번호 초기화 (변경하지 않으려면 비워두세요)</Typography>
              <TextField label="새 비밀번호" type="password" value={userEditDialog.newPassword}
                onChange={handleUserEditChange('newPassword')}
                error={!!userEditDialog.errors?.newPassword}
                helperText={userEditDialog.errors?.newPassword || '8자 이상 입력하세요'}
                fullWidth size="small" autoComplete="new-password" />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeUserEdit} disabled={saving}>취소</Button>
          <Button variant="contained" onClick={handleUserEditSave} disabled={saving}>
            {saving ? <CircularProgress size={22} color="inherit" /> : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────── 삭제 확인 다이얼로그 ─────────────────── */}
      <Dialog open={confirmDialog.open} onClose={closeConfirm}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.label}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>취소</Button>
          <Button variant="contained" color="error" onClick={handleConfirm}>삭제</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;
