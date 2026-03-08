import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, isAuthenticated, isAdmin, getUser } from '../../store/authStore';
import ExploreIcon from '@mui/icons-material/Explore';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  const user = getUser();
  const admin = isAdmin();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navBtnStyle = (path) => ({
    whiteSpace: 'nowrap',
    fontWeight: isActive(path) ? 'bold' : 'normal',
    borderBottom: isActive(path) ? '2px solid white' : '2px solid transparent',
    borderRadius: 0,
    px: 1.5,
  });

  return (
    <AppBar position="sticky" elevation={2}>
      <Toolbar>
        <IconButton
          color="inherit"
          onClick={() => navigate('/')}
          sx={{ mr: 1 }}
        >
          <ExploreIcon />
        </IconButton>
        <Typography
          variant="h6"
          component="div"
          sx={{ cursor: 'pointer', fontWeight: 'bold', mr: 3, whiteSpace: 'nowrap' }}
          onClick={() => navigate('/')}
        >
          TripLog
        </Typography>

        {authenticated && (
          <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/trips')}
              sx={navBtnStyle('/trips')}
            >
              내 여행
            </Button>
            <Button
              color="inherit"
              startIcon={<PhotoLibraryIcon />}
              onClick={() => navigate('/gallery')}
              sx={navBtnStyle('/gallery')}
            >
              갤러리
            </Button>
            {admin && (
              <Button
                color="inherit"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => navigate('/admin')}
                sx={{
                  ...navBtnStyle('/admin'),
                  color: isActive('/admin') ? 'white' : '#ffcc80',
                }}
              >
                관리자
              </Button>
            )}
          </Box>
        )}

        <Box sx={{ flexGrow: authenticated ? 0 : 1 }} />

        {authenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Typography
              variant="body2"
              sx={{ opacity: 0.9, whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}
            >
              {user?.nickname}
            </Typography>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              size="small"
              sx={{ whiteSpace: 'nowrap' }}
            >
              로그아웃
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              color="inherit"
              startIcon={<LoginIcon />}
              onClick={() => navigate('/login')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              로그인
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/signup')}
              sx={{ borderColor: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}
            >
              회원가입
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
