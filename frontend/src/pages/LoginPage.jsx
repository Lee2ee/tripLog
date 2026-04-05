import React from 'react';
import { Container, Box, Typography, Button, Paper, Alert } from '@mui/material';
import { useLocation } from 'react-router-dom';
import ExploreIcon from '@mui/icons-material/Explore';

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
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: { xs: 4, sm: 8 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: { xs: 2.5, sm: 4 }, width: '100%', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <ExploreIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography component="h1" variant="h5" fontWeight="bold">
              TripLog
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              나의 여행을 기록하세요
            </Typography>
          </Box>

          {oauthError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {oauthErrorCode === 'missing_email'
                ? '카카오 계정의 이메일 제공에 동의가 필요합니다. 카카오 설정에서 이메일 동의 후 다시 시도해주세요.'
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
              py: 1.5,
              bgcolor: '#FEE500',
              color: '#191919',
              fontWeight: 'bold',
              fontSize: '1rem',
              '&:hover': { bgcolor: '#F0D900' },
            }}
          >
            카카오로 로그인
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              로그인 시 TripLog 서비스 이용약관에 동의하게 됩니다.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
