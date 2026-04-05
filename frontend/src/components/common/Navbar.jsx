import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton,
  Badge, Popover, List, ListItem, ListItemText, Divider, Tooltip,
  Drawer, ListItemButton, ListItemIcon,
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

  const navBtnStyle = (path) => ({
    whiteSpace: 'nowrap',
    fontWeight: isActive(path) ? 'bold' : 'normal',
    borderBottom: isActive(path) ? '2px solid white' : '2px solid transparent',
    borderRadius: 0,
    px: 1.5,
  });

  const navItems = [
    { label: '탐색', path: '/explore', icon: <PublicIcon /> },
    ...(authenticated ? [
      { label: '내 여행', path: '/trips', icon: <FlightTakeoffIcon /> },
      { label: '갤러리', path: '/gallery', icon: <PhotoLibraryIcon /> },
      ...(!admin ? [{ label: '위시리스트', path: '/wishlist', icon: <BookmarkIcon /> }] : []),
      ...(admin ? [{ label: '관리자', path: '/admin', icon: <AdminPanelSettingsIcon /> }] : []),
    ] : []),
  ];

  const handleNavDrawer = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <AppBar position="sticky" elevation={2}>
      <Toolbar>
        {/* 모바일 햄버거 메뉴 */}
        <IconButton
          color="inherit"
          onClick={() => setDrawerOpen(true)}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <IconButton
          color="inherit"
          onClick={() => navigate('/')}
          sx={{ mr: 1, display: { xs: 'none', md: 'flex' } }}
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

        {/* 데스크탑 네비게이션 */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                ...navBtnStyle(item.path),
                ...(item.path === '/admin' ? { color: isActive('/admin') ? 'white' : '#ffcc80' } : {}),
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

        {/* 우측 액션 영역 */}
        {authenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {!admin && (
              <Tooltip title="내 프로필">
                <Button
                  color="inherit"
                  startIcon={<AccountCircleIcon />}
                  onClick={() => navigate('/profile')}
                  size="small"
                  sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'flex' } }}
                >
                  {user?.nickname}
                </Button>
              </Tooltip>
            )}
            {admin && (
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}
              >
                {user?.nickname}
              </Typography>
            )}
            {!admin && (
              <Tooltip title="알림">
                <IconButton color="inherit" onClick={handleOpenNotif} size="small">
                  <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              color="inherit"
              onClick={handleLogout}
              size="small"
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              <LogoutIcon />
            </IconButton>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              size="small"
              sx={{ whiteSpace: 'nowrap', display: { xs: 'none', md: 'flex' } }}
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

      {/* 모바일 드로어 */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 240 } }}
      >
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExploreIcon />
          <Typography variant="h6" fontWeight="bold">TripLog</Typography>
        </Box>
        {authenticated && (
          <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">
              {user?.nickname}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        )}
        <Divider />
        <List sx={{ flexGrow: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => handleNavDrawer(item.path)}
              selected={isActive(item.path)}
              sx={{
                ...(item.path === '/admin' && { color: '#e65100' }),
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, ...(item.path === '/admin' && { color: '#e65100' }) }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        {authenticated ? (
          <>
            {!admin && (
              <ListItemButton onClick={() => handleNavDrawer('/profile')}>
                <ListItemIcon sx={{ minWidth: 36 }}><AccountCircleIcon /></ListItemIcon>
                <ListItemText primary="내 프로필" />
              </ListItemButton>
            )}
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon sx={{ minWidth: 36 }}><LogoutIcon /></ListItemIcon>
              <ListItemText primary="로그아웃" />
            </ListItemButton>
          </>
        ) : (
          <ListItemButton onClick={() => handleNavDrawer('/login')}>
            <ListItemIcon sx={{ minWidth: 36 }}><LoginIcon /></ListItemIcon>
            <ListItemText primary="로그인" />
          </ListItemButton>
        )}
      </Drawer>

      {/* 알림 팝오버 */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={handleCloseNotif}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: { xs: 'calc(100vw - 32px)', sm: 320 }, maxHeight: 400 } }}
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
