import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Chatbot from '../Chatbot/Chatbot';
import Footer from './Footer';

const Layout = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const { sidebarOpen } = useSelector(state => state.ui);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <Box sx={{ display: 'flex', flex: 1 }}>
        {isAuthenticated && <Sidebar />}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            width: { xs: '100%', md: sidebarOpen ? 'calc(100% - 280px)' : '100%' },
            transition: 'width 0.3s ease',
            minHeight: 'calc(100vh - 64px)'
          }}
        >
          <Outlet />
        </Box>
      </Box>

      <Footer />

      {isAuthenticated && <Chatbot />}
    </Box>
  );
};

export default Layout;
