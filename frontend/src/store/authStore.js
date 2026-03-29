const TOKEN_KEY = 'triplog_token';
const USER_KEY = 'triplog_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try { return JSON.parse(userStr); } catch { return null; }
};

export const getUserId = () => getUser()?.id ?? null;

export const isAuthenticated = () => !!getToken();

export const isAdmin = () => getUser()?.role === 'ADMIN';

export const login = (data) => {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    id: data.userId,
    email: data.email,
    nickname: data.nickname,
    role: data.role,
  }));
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
