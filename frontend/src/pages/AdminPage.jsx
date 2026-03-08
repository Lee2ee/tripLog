import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  IconButton, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, FormControl, InputLabel,
  Alert, CircularProgress, ImageList, ImageListItem, ImageListItemBar,
  TextField, Divider, Tooltip, Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../api/axios';

/* ── 상수 ─────────────────────────────────────────────── */
const EMPTY_EDIT = { open: false, user: null, email: '', nickname: '', role: '', newPassword: '', errors: {} };
const EMPTY_DETAIL = { open: false, user: null };
const EMPTY_CONFIRM = { open: false, action: null, label: '' };

/* ── 컴포넌트 ─────────────────────────────────────────── */
const AdminPage = () => {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editDialog, setEditDialog] = useState(EMPTY_EDIT);
  const [detailDialog, setDetailDialog] = useState(EMPTY_DETAIL);
  const [confirmDialog, setConfirmDialog] = useState(EMPTY_CONFIRM);

  /* ── 데이터 fetch ──────────────────────────────────── */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch {
      setError('회원 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/trips');
      setTrips(res.data.data);
    } catch {
      setError('여행 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/images');
      setImages(res.data.data);
    } catch {
      setError('이미지 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError('');
    if (tab === 0) fetchUsers();
    else if (tab === 1) fetchTrips();
    else fetchImages();
  }, [tab]);

  /* ── 수정 다이얼로그 ───────────────────────────────── */
  const openEdit = (u) =>
    setEditDialog({ open: true, user: u, email: u.email, nickname: u.nickname, role: u.role, newPassword: '', errors: {} });

  const closeEdit = () => setEditDialog(EMPTY_EDIT);

  const validateEdit = () => {
    const errs = {};
    if (!editDialog.email.trim()) errs.email = '이메일을 입력해주세요';
    else if (!/\S+@\S+\.\S+/.test(editDialog.email)) errs.email = '올바른 이메일 형식이 아닙니다';
    if (!editDialog.nickname.trim()) errs.nickname = '닉네임을 입력해주세요';
    if (editDialog.newPassword && editDialog.newPassword.length < 8)
      errs.newPassword = '비밀번호는 8자 이상이어야 합니다';
    return errs;
  };

  const handleEditChange = (field) => (e) =>
    setEditDialog((prev) => ({ ...prev, [field]: e.target.value, errors: { ...prev.errors, [field]: '' } }));

  const handleEditSave = async () => {
    const errs = validateEdit();
    if (Object.keys(errs).length > 0) {
      setEditDialog((prev) => ({ ...prev, errors: errs }));
      return;
    }
    setSaving(true);
    try {
      await api.put(`/admin/users/${editDialog.user.id}`, {
        email: editDialog.email,
        nickname: editDialog.nickname,
        role: editDialog.role,
        newPassword: editDialog.newPassword || null,
      });
      closeEdit();
      fetchUsers();
    } catch (e) {
      setEditDialog((prev) => ({
        ...prev,
        errors: { server: e.response?.data?.message || '수정에 실패했습니다.' },
      }));
    } finally {
      setSaving(false);
    }
  };

  /* ── 삭제 확인 ─────────────────────────────────────── */
  const openConfirm = (label, action) => setConfirmDialog({ open: true, action, label });
  const closeConfirm = () => setConfirmDialog(EMPTY_CONFIRM);

  const handleConfirm = async () => {
    try { await confirmDialog.action(); }
    catch { setError('삭제에 실패했습니다.'); }
    finally { closeConfirm(); }
  };

  const deleteUser = (u) =>
    openConfirm(`"${u.nickname}" 회원을 삭제하시겠습니까? 해당 회원의 모든 여행 데이터가 함께 삭제됩니다.`, async () => {
      await api.delete(`/admin/users/${u.id}`);
      fetchUsers();
    });

  const deleteTrip = (t) =>
    openConfirm(`"${t.title}" 여행을 삭제하시겠습니까?`, async () => {
      await api.delete(`/admin/trips/${t.id}`);
      fetchTrips();
    });

  const deleteImage = (img) =>
    openConfirm('이 이미지를 삭제하시겠습니까?', async () => {
      await api.delete(`/admin/images/${img.id}`);
      fetchImages();
    });

  /* ── 렌더 ──────────────────────────────────────────── */
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>관리자 페이지</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`회원 관리 (${users.length})`} />
        <Tab label={`여행 관리 (${trips.length})`} />
        <Tab label={`이미지 관리 (${images.length})`} />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <>
          {/* ── 회원 관리 탭 ─────────────────────────── */}
          {tab === 0 && (
            <TableContainer component={Paper}>
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
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        회원이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : users.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.id}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.nickname}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role === 'ADMIN' ? '관리자' : '일반회원'}
                          color={u.role === 'ADMIN' ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{u.tripCount}개</TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="상세 보기">
                            <IconButton size="small" onClick={() => setDetailDialog({ open: true, user: u })}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="정보 수정">
                            <IconButton size="small" color="primary" onClick={() => openEdit(u)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={u.role === 'ADMIN' ? '관리자 계정은 삭제할 수 없습니다' : '회원 삭제'}>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteUser(u)}
                                disabled={u.role === 'ADMIN'}
                              >
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

          {/* ── 여행 관리 탭 ─────────────────────────── */}
          {tab === 1 && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>제목</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>시작일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>종료일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>등록일</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>삭제</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        여행이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : trips.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell>{t.id}</TableCell>
                      <TableCell>{t.title}</TableCell>
                      <TableCell>{t.startDate}</TableCell>
                      <TableCell>{t.endDate}</TableCell>
                      <TableCell>{new Date(t.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="여행 삭제">
                          <IconButton size="small" color="error" onClick={() => deleteTrip(t)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* ── 이미지 관리 탭 ───────────────────────── */}
          {tab === 2 && (
            images.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
                이미지가 없습니다.
              </Paper>
            ) : (
              <ImageList cols={4} gap={12}>
                {images.map((img) => (
                  <ImageListItem key={img.id}>
                    <img
                      src={img.imageUrl}
                      alt={`image-${img.id}`}
                      loading="lazy"
                      style={{ height: 180, objectFit: 'cover', borderRadius: 4 }}
                    />
                    <ImageListItemBar
                      title={`ID: ${img.id}`}
                      actionIcon={
                        <Tooltip title="이미지 삭제">
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

      {/* ── 상세 보기 다이얼로그 ──────────────────────── */}
      <Dialog open={detailDialog.open} onClose={() => setDetailDialog(EMPTY_DETAIL)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>회원 상세 정보</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {detailDialog.user && (
            <Stack spacing={1.5}>
              {[
                { label: 'ID', value: detailDialog.user.id },
                { label: '이메일', value: detailDialog.user.email },
                { label: '닉네임', value: detailDialog.user.nickname },
                {
                  label: '권한',
                  value: (
                    <Chip
                      label={detailDialog.user.role === 'ADMIN' ? '관리자' : '일반회원'}
                      color={detailDialog.user.role === 'ADMIN' ? 'error' : 'default'}
                      size="small"
                    />
                  ),
                },
                { label: '여행 수', value: `${detailDialog.user.tripCount}개` },
                {
                  label: '가입일',
                  value: new Date(detailDialog.user.createdAt).toLocaleString('ko-KR'),
                },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 60, flexShrink: 0 }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(EMPTY_DETAIL)}>닫기</Button>
          <Button
            variant="outlined"
            onClick={() => {
              setDetailDialog(EMPTY_DETAIL);
              openEdit(detailDialog.user);
            }}
            startIcon={<EditIcon />}
          >
            정보 수정
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 회원 정보 수정 다이얼로그 ────────────────── */}
      <Dialog open={editDialog.open} onClose={closeEdit} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          회원 정보 수정
          <Typography variant="body2" color="text.secondary">ID: {editDialog.user?.id}</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {editDialog.errors?.server && (
            <Alert severity="error" sx={{ mb: 2 }}>{editDialog.errors.server}</Alert>
          )}
          <Stack spacing={2}>
            <TextField
              label="이메일"
              value={editDialog.email}
              onChange={handleEditChange('email')}
              error={!!editDialog.errors?.email}
              helperText={editDialog.errors?.email}
              fullWidth
              size="small"
            />
            <TextField
              label="닉네임"
              value={editDialog.nickname}
              onChange={handleEditChange('nickname')}
              error={!!editDialog.errors?.nickname}
              helperText={editDialog.errors?.nickname}
              fullWidth
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>권한</InputLabel>
              <Select
                value={editDialog.role}
                label="권한"
                onChange={handleEditChange('role')}
              >
                <MenuItem value="USER">일반회원 (USER)</MenuItem>
                <MenuItem value="ADMIN">관리자 (ADMIN)</MenuItem>
              </Select>
            </FormControl>
            <Divider />
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                비밀번호 초기화 (변경하지 않으려면 비워두세요)
              </Typography>
              <TextField
                label="새 비밀번호"
                type="password"
                value={editDialog.newPassword}
                onChange={handleEditChange('newPassword')}
                error={!!editDialog.errors?.newPassword}
                helperText={editDialog.errors?.newPassword || '8자 이상 입력하세요'}
                fullWidth
                size="small"
                autoComplete="new-password"
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeEdit} disabled={saving}>취소</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={saving}>
            {saving ? <CircularProgress size={22} color="inherit" /> : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 삭제 확인 다이얼로그 ──────────────────────── */}
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
