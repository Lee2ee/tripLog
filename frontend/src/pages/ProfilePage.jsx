import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Paper, CircularProgress, Alert,
  Divider, Chip, Button, TextField, Snackbar,
  Avatar, Card, CardContent, Grid,
} from '@mui/material';
import axiosInstance from '../api/axios';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExploreIcon from '@mui/icons-material/Explore';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import BookmarkIcon from '@mui/icons-material/Bookmark';

const StatCard = ({ icon, label, value, color }) => (
  <Card elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: '12px !important' }}>
      <Box sx={{ color, fontSize: 28 }}>{icon}</Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h6" fontWeight="bold">{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/users/profile');
      setProfile(res.data.data);
    } catch {
      setError('프로필을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleEditStart = () => {
    setNickname(profile.nickname);
    setNicknameError('');
    setEditMode(true);
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setNicknameError('');
  };

  const handleSaveNickname = async () => {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
      setNicknameError('닉네임은 2~20자 사이여야 합니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await axiosInstance.patch('/users/profile/nickname', { nickname: trimmed });
      setProfile(res.data.data);
      setEditMode(false);
      setSnackbar('닉네임이 변경되었습니다.');
    } catch (err) {
      setNicknameError(err.response?.data?.message || '변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (error) return <Container maxWidth="sm" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
  if (!profile) return null;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>내 프로필</Typography>

      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, p: 3, mb: 3 }}>
        {/* 아바타 + 기본 정보 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 28 }}>
            <PersonIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {editMode ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  size="small"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  error={!!nicknameError}
                  helperText={nicknameError}
                  inputProps={{ maxLength: 20 }}
                  sx={{ flex: 1 }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNickname(); if (e.key === 'Escape') handleEditCancel(); }}
                  autoFocus
                />
                <Button
                  size="small" variant="contained" onClick={handleSaveNickname}
                  disabled={saving} sx={{ minWidth: 0, px: 1 }}
                >
                  <CheckIcon fontSize="small" />
                </Button>
                <Button size="small" onClick={handleEditCancel} sx={{ minWidth: 0, px: 1 }}>
                  <CloseIcon fontSize="small" />
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight="bold" noWrap>{profile.nickname}</Typography>
                <Button size="small" startIcon={<EditIcon />} onClick={handleEditStart} sx={{ minWidth: 0, px: 1 }}>
                  수정
                </Button>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">{profile.email}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={profile.provider === 'KAKAO' ? '카카오 로그인' : '일반 계정'}
            size="small"
            color={profile.provider === 'KAKAO' ? 'warning' : 'default'}
            variant="outlined"
          />
          <Chip label={`가입일: ${formatDate(profile.createdAt)}`} size="small" variant="outlined" />
        </Box>
      </Paper>

      {/* 활동 통계 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>활동 통계</Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<ExploreIcon fontSize="inherit" />}
            label="여행"
            value={profile.tripCount}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard
            icon={<PhotoLibraryIcon fontSize="inherit" />}
            label="사진"
            value={profile.imageCount}
            color="#388e3c"
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard
            icon={<BookmarkIcon fontSize="inherit" />}
            label="위시리스트"
            value={profile.wishlistCount}
            color="#f57c00"
          />
        </Grid>
      </Grid>

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

export default ProfilePage;
