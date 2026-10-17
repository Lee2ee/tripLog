import React from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { useLocation } from 'react-router-dom';
import CompassCalibrateIcon from '@mui/icons-material/CompassCalibration';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import RouteIcon from '@mui/icons-material/Route';

const FEATURES = [
  { icon: <RouteIcon sx={{ fontSize: 20 }} />, text: '여행 경로를 지도 위에 기록' },
  { icon: <PhotoLibraryIcon sx={{ fontSize: 20 }} />, text: '장소별 사진 앨범 관리' },
  { icon: <FlightTakeoffIcon sx={{ fontSize: 20 }} />, text: '나만의 여행 일지 공유' },
];

const LoginPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const oauthError = params.get('error');
  const oauthErrorCode = params.get('code');

  const handleKakaoLogin = () => {
    const base = import.meta.env.VITE_API_URL || '';
    window.location.href = `${base}/oauth2/authorization/kakao`;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* 좌측 히어로 패널 (데스크탑) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '0 0 52%',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { md: 6, lg: 10 },
          py: 8,
          background: 'linear-gradient(145deg, #0D2137 0%, #1A3A5C 35%, #1E5F8C 65%, #166D82 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 장식 원들 */}
        <Box sx={{
          position: 'absolute', top: -80, right: -80,
          width: 320, height: 320, borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.04)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -60, left: -60,
          width: 240, height: 240, borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.04)',
        }} />
        <Box sx={{
          position: 'absolute', top: '40%', right: '10%',
          width: 120, height: 120, borderRadius: '50%',
          bgcolor: 'rgba(244,162,97,0.12)',
        }} />

        {/* 로고 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
          <CompassCalibrateIcon sx={{ fontSize: 32, color: '#F4A261' }} />
          <Typography variant="h5" fontWeight={800} color="white">TripLog</Typography>
        </Box>

        {/* 헤드라인 */}
        <Typography
          variant="h2"
          fontWeight={800}
          color="white"
          sx={{ lineHeight: 1.2, mb: 2, wordBreak: 'keep-all' }}
        >
          여행의 모든 순간을<br />
          <Box component="span" sx={{ color: '#F4A261' }}>기록</Box>하세요
        </Typography>

        <Typography
          variant="body1"
          sx={{ color: 'rgba(255,255,255,0.72)', mb: 5, lineHeight: 1.8, wordBreak: 'keep-all' }}
        >
          지도 위에 경로를 그리고, 사진을 남기고,<br />
          소중한 여행을 이야기로 만들어보세요.
        </Typography>

        {/* 기능 목록 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FEATURES.map((f, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 2,
                bgcolor: 'rgba(244,162,97,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#F4A261', flexShrink: 0,
              }}>
                {f.icon}
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>
                {f.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* 우측 로그인 폼 */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 4 },
          py: 6,
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* 모바일용 로고 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 4, justifyContent: 'center' }}>
            <CompassCalibrateIcon sx={{ fontSize: 28, color: 'secondary.main' }} />
            <Typography variant="h5" fontWeight={800} color="primary.main">TripLog</Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} color="primary.main" gutterBottom>
            시작하기
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
            카카오 계정으로 간편하게 로그인하고<br />
            나만의 여행 일지를 만들어보세요.
          </Typography>

          {oauthError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {oauthErrorCode === 'missing_email'
                ? '카카오 계정의 이메일 제공에 동의가 필요합니다.'
                : oauthErrorCode === 'local_account_exists'
                  ? '이미 일반 계정으로 가입된 이메일입니다.'
                  : '소셜 로그인에 실패했습니다. 다시 시도해주세요.'}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={handleKakaoLogin}
            sx={{
              py: 1.75,
              bgcolor: '#FEE500',
              color: '#191919',
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#F0D800',
                boxShadow: '0 4px 16px rgba(254,229,0,0.4)',
              },
              mb: 3,
            }}
          >
            카카오로 로그인
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', lineHeight: 1.8 }}>
            로그인 시 TripLog의{' '}
            <Box component="a" href="/privacy" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}>
              서비스 이용약관
            </Box>
            에 동의하게 됩니다.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
