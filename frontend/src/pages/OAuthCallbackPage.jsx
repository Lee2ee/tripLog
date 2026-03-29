import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { login as storeLogin } from '../store/authStore';

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const nickname = searchParams.get('nickname');
    const role = searchParams.get('role');

    if (token && email && nickname && role) {
      storeLogin({ token, userId: userId ? Number(userId) : null, email, nickname, role });
      navigate('/trips', { replace: true });
    } else {
      navigate('/login?error=oauth', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <Box sx={{ mt: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <CircularProgress />
      <Typography color="text.secondary">로그인 처리 중...</Typography>
    </Box>
  );
};

export default OAuthCallbackPage;
