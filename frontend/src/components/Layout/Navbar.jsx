import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Select,
  FormControl,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Language,
  Notifications,
  AccountCircle,
  Logout,
  Settings as SettingsIcon,
  DarkMode,
  LightMode
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';
import { setLanguage, setTheme, toggleSidebar } from '../../store/slices/uiSlice';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { language, theme: appTheme } = useSelector(state => state.ui);

  const [anchorEl, setAnchorEl] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate('/');
  };

  const handleLanguageChange = (lang) => {
    dispatch(setLanguage(lang));
    i18n.changeLanguage(lang);
    setLangAnchorEl(null);
  };

  const toggleTheme = () => {
    dispatch(setTheme(appTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <AppBar position="sticky" elevation={2} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar>
        {isAuthenticated && isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => dispatch(toggleSidebar())}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'primary.main',
            fontWeight: 800,
            fontSize: { xs: '1.2rem', md: '1.5rem' }
          }}
        >
          CityFix
        </Typography>

        {!isMobile && !isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
            <Button component={Link} to="/" color="inherit">
              {t('nav.home')}
            </Button>
            <Button component={Link} to="/contact" color="inherit">
              {t('nav.contact')}
            </Button>
          </Box>
        )}

        <IconButton
          onClick={(e) => setLangAnchorEl(e.currentTarget)}
          color="inherit"
          sx={{ mr: 1 }}
        >
          <Language />
        </IconButton>

        <Menu
          anchorEl={langAnchorEl}
          open={Boolean(langAnchorEl)}
          onClose={() => setLangAnchorEl(null)}
        >
          <MenuItem onClick={() => handleLanguageChange('en')} selected={language === 'en'}>
            English
          </MenuItem>
          <MenuItem onClick={() => handleLanguageChange('ar')} selected={language === 'ar'}>
            العربية
          </MenuItem>
          <MenuItem onClick={() => handleLanguageChange('he')} selected={language === 'he'}>
            עברית
          </MenuItem>
        </Menu>

        <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 1 }}>
          {appTheme === 'light' ? <DarkMode /> : <LightMode />}
        </IconButton>

        {isAuthenticated ? (
          <>
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Notifications />
            </IconButton>

            <IconButton onClick={handleMenu} sx={{ p: 0 }}>
              <Avatar alt={user?.username} src={user?.profile?.avatar}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { navigate('/dashboard'); handleClose(); }}>
                <AccountCircle sx={{ mr: 1 }} /> {t('nav.dashboard')}
              </MenuItem>
              <MenuItem onClick={() => { navigate('/settings'); handleClose(); }}>
                <SettingsIcon sx={{ mr: 1 }} /> {t('nav.settings')}
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} /> {t('nav.logout')}
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button component={Link} to="/login" variant="outlined" size="small">
              {t('nav.login')}
            </Button>
            <Button component={Link} to="/register" variant="contained" size="small">
              {t('nav.signup')}
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
