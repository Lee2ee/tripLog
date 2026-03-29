import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton,
  Badge, Popover, List, ListItem, ListItemText, Divider, Tooltip,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, isAuthenticated, isAdmin, getUser } from '../../store/authStore';
import axiosInstance from '../../api/axios';
import ExploreIcon from '@mui/icons-material/Explore';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PublicIcon from '@mui/icons-material/Public';
import NotificationsIcon from '@mui/icons-material/Notifications';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  const user = getUser();
  const admin = isAdmin();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const pollRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await axiosInstance.get('/notifications/unread-count');
      setUnreadCount(res.data.data?.count ?? 0);
    } catch { /* 무시 */ }
  };

  useEffect(() => {
    if (!authenticated || admin) return;
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(pollRef.current);
  }, [authenticated, admin]);

  const handleOpenNotif = async (e) => {
    setNotifAnchor(e.currentTarget);
    try {
      const res = await axiosInstance.get('/notifications');
      setNotifications(res.data.data || []);
    } catch { /* 무시 */ }
  };

  const handleCloseNotif = () => setNotifAnchor(null);

  const handleClickNotif = async (notif) => {
    if (!notif.isRead) {
      await axiosInstance.patch(`/notifications/${notif.id}/read`).catch(() => {});
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.tripId) {
      handleCloseNotif();
      navigate(`/trips/${notif.tripId}`);
    }
  };

  const handleMarkAllRead = async () => {
    await axiosInstance.patch('/notifications/read-all').catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    logout();
    navigate(admin ? '/admin/login' : '/login');
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

        <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
          <Button
            color="inherit"
            startIcon={<PublicIcon />}
            onClick={() => navigate('/explore')}
            sx={navBtnStyle('/explore')}
          >
            탐색
          </Button>
          {authenticated && (
            <>
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
            </>
          )}
        </Box>

        {authenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Typography
              variant="body2"
              sx={{ opacity: 0.9, whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}
            >
              {user?.nickname}
            </Typography>
            {!admin && (
              <Tooltip title="알림">
                <IconButton color="inherit" onClick={handleOpenNotif} size="small">
                  <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
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
          </Box>
        )}
      </Toolbar>

      {/* 알림 팝오버 */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={handleCloseNotif}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight="bold">알림</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.75rem' }}>
              모두 읽음
            </Button>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">알림이 없습니다</Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ overflow: 'auto', maxHeight: 320 }}>
            {notifications.map((notif, idx) => (
              <React.Fragment key={notif.id}>
                {idx > 0 && <Divider />}
                <ListItem
                  button
                  onClick={() => handleClickNotif(notif)}
                  sx={{ bgcolor: notif.isRead ? 'transparent' : 'action.hover', cursor: 'pointer', px: 2, py: 1 }}
                >
                  <ListItemText
                    primary={notif.message}
                    secondary={new Date(notif.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: notif.isRead ? 'normal' : 'bold' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Popover>
    </AppBar>
  );
};

export default Navbar;
