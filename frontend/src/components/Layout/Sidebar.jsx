import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Report as ReportIcon,
  AddCircle,
  TrendingUp,
  Analytics,
  Group,
  Settings,
  EmojiEvents
} from '@mui/icons-material';

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { sidebarOpen } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);

  const menuItems = [
    {
      text: t('nav.dashboard'),
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['CITIZEN', 'EMPLOYEE', 'SUPERVISOR', 'DEPARTMENT_MANAGER', 'MUNICIPALITY_ADMIN', 'SUPER_SUPER_ADMIN']
    },
    {
      text: t('nav.submit'),
      icon: <AddCircle />,
      path: '/submit',
      roles: ['CITIZEN', 'EMPLOYEE', 'SUPERVISOR', 'DEPARTMENT_MANAGER', 'MUNICIPALITY_ADMIN', 'SUPER_SUPER_ADMIN']
    },
    {
      text: t('nav.reports'),
      icon: <ReportIcon />,
      path: '/reports',
      roles: ['CITIZEN', 'EMPLOYEE', 'SUPERVISOR', 'DEPARTMENT_MANAGER', 'MUNICIPALITY_ADMIN', 'SUPER_SUPER_ADMIN']
    },
    {
      text: t('nav.myImpact'),
      icon: <EmojiEvents />,
      path: '/my-impact',
      roles: ['CITIZEN', 'EMPLOYEE', 'SUPERVISOR', 'DEPARTMENT_MANAGER', 'MUNICIPALITY_ADMIN', 'SUPER_SUPER_ADMIN']
    },
    {
      text: t('nav.analytics'),
      icon: <Analytics />,
      path: '/analytics',
      roles: ['DEPARTMENT_MANAGER', 'MUNICIPALITY_ADMIN', 'SUPER_SUPER_ADMIN']
    },
    {
      text: t('nav.team'),
      icon: <Group />,
      path: '/team',
      roles: ['MUNICIPALITY_ADMIN', 'SUPER_SUPER_ADMIN']
    },
    {
      text: t('nav.settings'),
      icon: <Settings />,
      path: '/settings',
      roles: ['CITIZEN', 'EMPLOYEE', 'SUPERVISOR', 'DEPARTMENT_MANAGER', 'MUNICIPALITY_ADMIN', 'SUPER_SUPER_ADMIN']
    }
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role)
  );

  const drawer = (
    <Box sx={{ width: 280, height: '100%', bgcolor: 'background.paper' }}>
      <List sx={{ pt: 2 }}>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white'
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'white' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => dispatch(toggleSidebar())}
        ModalProps={{ keepMounted: true }}
      >
        {drawer}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarOpen ? 280 : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          top: 64,
          height: 'calc(100% - 64px)',
          borderRight: '1px solid',
          borderColor: 'divider'
        }
      }}
      open={sidebarOpen}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;
