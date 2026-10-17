import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton,
  Badge, Popover, List, ListItem, ListItemText, Divider, Tooltip,
  Drawer, ListItemButton, ListItemIcon, Avatar,
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
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CompassCalibrateIcon from '@mui/icons-material/CompassCalibrate';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  const user = getUser();
  const admin = isAdmin();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    setDrawerOpen(false);
    navigate(admin ? '/admin/login' : '/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: '탐색', path: '/explore', icon: <PublicIcon /> },
    ...(authenticated ? [
      { label: '내 여행', path: '/trips', icon: <FlightTakeoffIcon /> },
      { label: '갤러리', path: '/gallery', icon: <PhotoLibraryIcon /> },
      ...(!admin ? [{ label: '위시리스트', path: '/wishlist', icon: <BookmarkIcon /> }] : []),
      ...(admin ? [{ label: '관리자', path: '/admin', icon: <AdminPanelSettingsIcon />, admin: true }] : []),
    ] : []),
  ];

  const handleNavDrawer = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const userInitial = user?.nickname?.[0]?.toUpperCase() || '?';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#FFFFFF',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: 0.5 }}>
        {/* 모바일 햄버거 */}
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{ mr: 0.5, display: { md: 'none' }, color: 'text.primary' }}
        >
          <MenuIcon />
        </IconButton>

        {/* 로고 */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            cursor: 'pointer', mr: 3,
            '&:hover': { opacity: 0.85 },
            transition: 'opacity 0.15s',
          }}
        >
          <CompassCalibrateIcon sx={{ color: 'secondary.main', fontSize: 26 }} />
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ color: 'primary.main', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}
          >
            TripLog
          </Typography>
        </Box>

        {/* 데스크탑 네비게이션 */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.25, flexGrow: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                color: item.admin ? 'warning.dark' : isActive(item.path) ? 'primary.main' : 'text.secondary',
                fontWeight: isActive(item.path) ? 700 : 500,
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: isActive(item.path) ? '60%' : '0%',
                  height: 2,
                  bgcolor: 'secondary.main',
                  borderRadius: 1,
                  transition: 'width 0.2s',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  color: 'primary.main',
                  '&::after': { width: '60%' },
                },
              }}
              startIcon={React.cloneElement(item.icon, { sx: { fontSize: '16px !important' } })}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

        {/* 우측 액션 */}
        {authenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
            {!admin && (
              <Tooltip title="알림">
                <IconButton onClick={handleOpenNotif} size="small" sx={{ color: 'text.secondary' }}>
                  <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
            {!admin && (
              <Tooltip title={`${user?.nickname} 프로필`}>
                <Box
                  onClick={() => navigate('/profile')}
                  sx={{
                    display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1,
                    cursor: 'pointer', px: 1.25, py: 0.5, borderRadius: 6,
                    border: '1.5px solid', borderColor: 'divider',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                    transition: 'all 0.15s',
                  }}
                >
                  <Avatar
                    sx={{ width: 26, height: 26, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}
                  >
                    {userInitial}
                  </Avatar>
                  <Typography variant="body2" fontWeight={500} color="text.primary" sx={{ whiteSpace: 'nowrap' }}>
                    {user?.nickname}
                  </Typography>
                </Box>
              </Tooltip>
            )}
            {admin && (
              <Typography variant="body2" sx={{ opacity: 0.8, display: { xs: 'none', sm: 'block' }, color: 'text.primary' }}>
                {user?.nickname}
              </Typography>
            )}
            <Tooltip title="로그아웃">
              <IconButton
                onClick={handleLogout}
                size="small"
                sx={{ color: 'text.secondary', display: { xs: 'flex', md: 'none' } }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              onClick={handleLogout}
              sx={{
                display: { xs: 'none', md: 'flex' },
                color: 'text.secondary', borderColor: 'divider',
                '&:hover': { borderColor: 'text.secondary', bgcolor: 'transparent' },
              }}
            >
              로그아웃
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate('/login')}
              sx={{ borderRadius: 6, px: 2 }}
              startIcon={<LoginIcon fontSize="small" />}
            >
              로그인
            </Button>
          </Box>
        )}
      </Toolbar>

      {/* 모바일 드로어 */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 260, bgcolor: '#FDFCF8' } }}
      >
        {/* 드로어 헤더 */}
        <Box sx={{
          p: 3,
          background: 'linear-gradient(135deg, #1A3A5C 0%, #2C6BAD 100%)',
          color: 'white',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: authenticated ? 2 : 0 }}>
            <CompassCalibrateIcon sx={{ fontSize: 22, color: '#F4A261' }} />
            <Typography variant="h6" fontWeight={800}>TripLog</Typography>
          </Box>
          {authenticated && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 700, border: '2px solid rgba(255,255,255,0.4)' }}>
                {userInitial}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700}>{user?.nickname}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>{user?.email}</Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Divider />
        <List sx={{ flexGrow: 1, py: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => handleNavDrawer(item.path)}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 2, mx: 1, mb: 0.25,
                color: item.admin ? 'warning.dark' : 'text.primary',
                '&.Mui-selected': {
                  bgcolor: 'primary.50',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: item.admin ? 'warning.dark' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: isActive(item.path) ? 700 : 500, fontSize: '0.9rem' }}
              />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <List sx={{ py: 1 }}>
          {authenticated ? (
            <>
              {!admin && (
                <ListItemButton onClick={() => handleNavDrawer('/profile')} sx={{ borderRadius: 2, mx: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}><AccountCircleIcon /></ListItemIcon>
                  <ListItemText primary="내 프로필" primaryTypographyProps={{ fontSize: '0.9rem' }} />
                </ListItemButton>
              )}
              <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, mx: 1, color: 'error.main' }}>
                <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}><LogoutIcon /></ListItemIcon>
                <ListItemText primary="로그아웃" primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
            </>
          ) : (
            <ListItemButton onClick={() => handleNavDrawer('/login')} sx={{ borderRadius: 2, mx: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}><LoginIcon /></ListItemIcon>
              <ListItemText primary="로그인" primaryTypographyProps={{ fontSize: '0.9rem' }} />
            </ListItemButton>
          )}
        </List>
      </Drawer>

      {/* 알림 팝오버 */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={handleCloseNotif}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: { xs: 'calc(100vw - 32px)', sm: 320 },
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: 3,
            mt: 0.5,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight={700}>알림</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.75rem', color: 'secondary.main' }}>
              모두 읽음
            </Button>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 32, color: 'grey.300', mb: 1 }} />
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
                  sx={{ bgcolor: notif.isRead ? 'transparent' : 'primary.50', cursor: 'pointer', px: 2, py: 1 }}
                >
                  <ListItemText
                    primary={notif.message}
                    secondary={new Date(notif.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: notif.isRead ? 'normal' : 700 }}
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
