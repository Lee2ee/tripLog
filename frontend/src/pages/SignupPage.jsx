import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { login as storeLogin } from '../store/authStore';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const SignupPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = '이메일을 입력해주세요';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = '올바른 이메일 형식이 아닙니다';

    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요';
    else if (formData.password.length < 8)
      newErrors.password = '비밀번호는 8자 이상이어야 합니다';

    if (!formData.confirmPassword) newErrors.confirmPassword = '비밀번호를 다시 입력해주세요';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';

    if (!formData.nickname) newErrors.nickname = '닉네임을 입력해주세요';
    else if (formData.nickname.length < 2 || formData.nickname.length > 30)
      newErrors.nickname = '닉네임은 2자 이상 30자 이하여야 합니다';

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
      };
      const response = await axiosInstance.post('/auth/signup', payload);
      const { data } = response.data;
      storeLogin(data);
      navigate('/trips', { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <PersonAddIcon sx={{ color: 'white' }} />
            </Box>
            <Typography component="h1" variant="h5" fontWeight="bold">
              회원가입
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              TripLog에 가입하고 여행을 계획하세요
            </Typography>
          </Box>

          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {serverError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="nickname"
              label="닉네임"
              name="nickname"
              autoFocus
              value={formData.nickname}
              onChange={handleChange}
              error={!!errors.nickname}
              helperText={errors.nickname}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="이메일"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="비밀번호"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="비밀번호 확인"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '가입하기'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                이미 계정이 있으신가요?{' '}
                <Link component={RouterLink} to="/login" underline="hover">
                  로그인
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignupPage;
