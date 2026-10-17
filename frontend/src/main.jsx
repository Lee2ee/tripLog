import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1A3A5C',
      light: '#2C6BAD',
      dark: '#0D2137',
      contrastText: '#ffffff',
      50: '#EBF1F8',
    },
    secondary: {
      main: '#E07B39',
      light: '#F4A261',
      dark: '#C4612A',
      contrastText: '#ffffff',
    },
    background: {
      default: '#FDFCF8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2B3C',
      secondary: '#64748B',
    },
    divider: '#E8EBF0',
    success: { main: '#2E7D32' },
    error:   { main: '#C62828' },
  },
  typography: {
    fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.06)',
    '0 2px 8px rgba(0,0,0,0.08)',
    '0 4px 16px rgba(0,0,0,0.10)',
    '0 6px 20px rgba(0,0,0,0.12)',
    '0 8px 28px rgba(0,0,0,0.14)',
    ...Array(19).fill('0 8px 28px rgba(0,0,0,0.14)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        body: {
          backgroundColor: '#FDFCF8',
          scrollbarWidth: 'thin',
          scrollbarColor: '#C8CDD4 transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#C8CDD4', borderRadius: 3 },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          letterSpacing: 0,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 14px rgba(0,0,0,0.18)' },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          borderRadius: 16,
          border: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        elevation2: { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
        elevation3: { boxShadow: '0 6px 24px rgba(0,0,0,0.12)' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: 0,
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
