import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { setLanguage } from './store/slices/uiSlice';

import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Reports from './pages/Reports/Reports';
import ReportDetails from './pages/Reports/ReportDetails';
import SubmitReport from './pages/Reports/SubmitReport';
import MyImpact from './pages/MyImpact/MyImpact';
import Analytics from './pages/Analytics/Analytics';
import Team from './pages/Team/Team';
import Settings from './pages/Settings/Settings';
import Contact from './pages/Contact/Contact';
import NotFound from './pages/NotFound/NotFound';

function App() {
  const { theme, language } = useSelector(state => state.ui);
  const { i18n } = useTranslation();
  const dispatch = useDispatch();

  const muiTheme = createTheme({
    palette: {
      mode: theme,
      primary: {
        main: '#2563eb',
        light: '#60a5fa',
        dark: '#1d4ed8'
      },
      secondary: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669'
      },
      error: {
        main: '#ef4444'
      },
      warning: {
        main: '#f59e0b'
      },
      info: {
        main: '#3b82f6'
      },
      success: {
        main: '#10b981'
      }
    },
    typography: {
      fontFamily: language === 'ar' || language === 'he'
        ? '"Rubik", "Inter", sans-serif'
        : '"Inter", "Rubik", sans-serif'
    },
    direction: language === 'ar' || language === 'he' ? 'rtl' : 'ltr',
    shape: {
      borderRadius: 12
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            padding: '10px 24px',
            fontWeight: 600
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  });

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.setAttribute('dir', language === 'ar' || language === 'he' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
  }, [language, i18n]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && savedLanguage !== language) {
      dispatch(setLanguage(savedLanguage));
    }
  }, []);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="contact" element={<Contact />} />

          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="reports/:id" element={
            <ProtectedRoute>
              <ReportDetails />
            </ProtectedRoute>
          } />

          <Route path="submit" element={
            <ProtectedRoute>
              <SubmitReport />
            </ProtectedRoute>
          } />

          <Route path="my-impact" element={
            <ProtectedRoute>
              <MyImpact />
            </ProtectedRoute>
          } />

          <Route path="analytics" element={
            <ProtectedRoute roles={['SUPER_SUPER_ADMIN', 'MUNICIPALITY_ADMIN', 'DEPARTMENT_MANAGER']}>
              <Analytics />
            </ProtectedRoute>
          } />

          <Route path="team" element={
            <ProtectedRoute roles={['SUPER_SUPER_ADMIN', 'MUNICIPALITY_ADMIN']}>
              <Team />
            </ProtectedRoute>
          } />

          <Route path="settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
