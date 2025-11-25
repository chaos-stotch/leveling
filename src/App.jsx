import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { BottomNavigation, BottomNavigationAction, Box } from '@mui/material';
import { BarChart, Assignment, Notifications, Settings } from '@mui/icons-material';
import Statistics from './pages/Statistics';
import Tasks from './pages/Tasks';
import NotificationsPage from './pages/Notifications';
import Admin from './pages/Admin';
import NotificationModal from './components/NotificationModal';
import BlockedScreen from './components/BlockedScreen';
import { isBlocked, getNotifications } from './utils/storage';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00D4FF',
    },
    secondary: {
      main: '#00FF88',
    },
    background: {
      default: '#0a0e27',
      paper: '#0f1629',
    },
    text: {
      primary: '#00D4FF',
      secondary: '#B0E0FF',
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Segoe UI', sans-serif",
    h4: {
      fontWeight: 700,
      textShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF',
    },
    h5: {
      fontWeight: 600,
      textShadow: '0 0 8px #00D4FF, 0 0 15px #00D4FF',
    },
    h6: {
      fontWeight: 600,
      textShadow: '0 0 5px #00D4FF',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0f1629',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.1), inset 0 0 20px rgba(0, 212, 255, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
          '&:hover': {
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
          },
        },
        contained: {
          backgroundColor: '#00D4FF',
          color: '#0a0e27',
          '&:hover': {
            backgroundColor: '#00B8E6',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            color: '#00D4FF',
            '& fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.5)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.8)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00D4FF',
              boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#B0E0FF',
            '&.Mui-focused': {
              color: '#00D4FF',
            },
          },
          '& .MuiInputBase-input::placeholder': {
            color: '#6B7A99',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          color: '#00D4FF',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 212, 255, 0.5)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 212, 255, 0.8)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00D4FF',
            boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#B0E0FF',
          '&.Mui-focused': {
            color: '#00D4FF',
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#6B7A99',
          '&.Mui-checked': {
            color: '#00D4FF',
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          color: '#B0E0FF',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#0f1629',
          borderTop: '1px solid rgba(0, 212, 255, 0.3)',
          boxShadow: '0 -5px 20px rgba(0, 212, 255, 0.1)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#6B7A99',
          '&.Mui-selected': {
            color: '#00D4FF',
            textShadow: '0 0 10px #00D4FF',
          },
        },
      },
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [blocked, setBlockedState] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [lastNotificationCheck, setLastNotificationCheck] = useState(Date.now());

  useEffect(() => {
    // Verificar se está bloqueado
    const checkBlocked = () => {
      setBlockedState(isBlocked());
    };
    checkBlocked();

    // Verificar novas notificações e adicionar à fila
    const checkNotifications = () => {
      const notifications = getNotifications();
      const newNotifications = notifications.filter(
        (n) => new Date(n.timestamp).getTime() > lastNotificationCheck
      );

      if (newNotifications.length > 0) {
        // Adicionar novas notificações à fila
        setNotificationQueue((prevQueue) => [...prevQueue, ...newNotifications]);
        setLastNotificationCheck(Date.now());
      }
    };

    const notificationInterval = setInterval(checkNotifications, 1000);

    return () => {
      clearInterval(notificationInterval);
    };
  }, [lastNotificationCheck, showNotification]);

  const handleUnblock = () => {
    setBlocked(false);
    setBlockedState(false);
  };

  // Processar fila de notificações
  useEffect(() => {
    if (notificationQueue.length > 0 && !showNotification) {
      // Mostrar primeira notificação da fila
      setNotification(notificationQueue[0]);
      setShowNotification(true);
    }
  }, [notificationQueue, showNotification]);


  const handleCloseNotification = () => {
    setShowNotification(false);
    setNotification(null);
    // Remover a notificação atual da fila e mostrar a próxima
    setNotificationQueue((prevQueue) => prevQueue.slice(1));
  };

  if (blocked) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BlockedScreen onUnblock={handleUnblock} />
      </ThemeProvider>
    );
  }

  const pages = [
    { component: <Statistics />, label: 'Estatísticas', icon: <BarChart /> },
    { component: <Tasks />, label: 'Tarefas', icon: <Assignment /> },
    { component: <NotificationsPage />, label: 'Notificações', icon: <Notifications /> },
    { component: <Admin />, label: 'Admin', icon: <Settings /> },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ pb: 7, minHeight: '100vh', backgroundColor: 'background.default' }}>
        {pages[currentPage].component}
      </Box>
      <BottomNavigation
        value={currentPage}
        onChange={(event, newValue) => {
          setCurrentPage(newValue);
        }}
        showLabels
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {pages.map((page, index) => (
          <BottomNavigationAction key={index} label={page.label} icon={page.icon} />
        ))}
      </BottomNavigation>
      <NotificationModal
        open={showNotification}
        notification={notification}
        onClose={handleCloseNotification}
      />
    </ThemeProvider>
  );
}

export default App;

