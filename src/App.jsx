import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { BottomNavigation, BottomNavigationAction, Box } from '@mui/material';
import { BarChart, Assignment, Notifications, Settings, ShoppingCart } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Statistics from './pages/Statistics';
import Tasks from './pages/Tasks';
import NotificationsPage from './pages/Notifications';
import Admin from './pages/Admin';
import Shop from './pages/Shop';
import NotificationModal from './components/NotificationModal';
import BlockedScreen from './components/BlockedScreen';
import ClickSoundProvider from './components/ClickSoundProvider';
import SyncConflictDialog from './components/SyncConflictDialog';
import ConfirmDialog from './components/ConfirmDialog';
import { useSound } from './hooks/useSound';
import { isBlocked, getNotifications, getSelectedTheme } from './utils/storage';
import { getTheme } from './themes';
import { getSupabaseConfig, checkSyncStatus, saveProgressToCloud, loadProgressFromCloud } from './utils/supabase';

const createAppTheme = (themeConfig) => {
  return createTheme({
    palette: themeConfig.palette,
    typography: themeConfig.typography,
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: themeConfig.palette.background.paper,
            border: themeConfig.effects.paperBorder,
            boxShadow: themeConfig.effects.paperShadow,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: themeConfig.effects.buttonShadow,
            '&:hover': {
              boxShadow: themeConfig.effects.buttonShadowHover,
            },
          },
          contained: {
            backgroundColor: themeConfig.palette.primary.main,
            color: themeConfig.palette.background.default,
            '&:hover': {
              backgroundColor: themeConfig.palette.primary.dark || themeConfig.palette.primary.main,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              color: themeConfig.palette.text.primary,
              '& fieldset': {
                borderColor: themeConfig.effects.textFieldBorder,
              },
              '&:hover fieldset': {
                borderColor: themeConfig.effects.textFieldBorderHover,
              },
              '&.Mui-focused fieldset': {
                borderColor: themeConfig.palette.primary.main,
                boxShadow: themeConfig.effects.textFieldShadow,
              },
            },
            '& .MuiInputLabel-root': {
              color: themeConfig.palette.text.secondary,
              '&.Mui-focused': {
                color: themeConfig.palette.primary.main,
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: themeConfig.palette.text.secondary,
              opacity: 0.6,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            color: themeConfig.palette.text.primary,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: themeConfig.effects.textFieldBorder,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: themeConfig.effects.textFieldBorderHover,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: themeConfig.palette.primary.main,
              boxShadow: themeConfig.effects.textFieldShadow,
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: themeConfig.palette.text.secondary,
            '&.Mui-focused': {
              color: themeConfig.palette.primary.main,
            },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: themeConfig.palette.text.secondary,
            opacity: 0.6,
            '&.Mui-checked': {
              color: themeConfig.effects.checkboxColor,
            },
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          label: {
            color: themeConfig.palette.text.secondary,
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: themeConfig.palette.background.paper,
            borderTop: themeConfig.effects.bottomNavBorder,
            boxShadow: themeConfig.effects.bottomNavShadow,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: themeConfig.palette.text.secondary,
            opacity: 0.6,
            '&.Mui-selected': {
              color: themeConfig.effects.bottomNavSelected,
              textShadow: themeConfig.effects.textShadow,
            },
          },
        },
      },
    },
    custom: {
      titleTextShadow: themeConfig.effects.titleTextShadow,
      textShadow: themeConfig.effects.textShadow,
      textShadowLarge: themeConfig.effects.textShadowLarge,
    },
  });
};

function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [blocked, setBlockedState] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [lastNotificationCheck, setLastNotificationCheck] = useState(Date.now());
  const [selectedThemeId, setSelectedThemeId] = useState(getSelectedTheme());
  const [syncConflictOpen, setSyncConflictOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const { playSound } = useSound();

  const themeConfig = getTheme(selectedThemeId);
  const theme = createAppTheme(themeConfig);

  useEffect(() => {
    const handleThemeChange = () => {
      setSelectedThemeId(getSelectedTheme());
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const checkSync = async () => {
      const config = getSupabaseConfig();
      if (config && config.userId) {
        try {
          const status = await checkSyncStatus(config.userId);
          if (status) {
            setSyncStatus(status);
            setSyncConflictOpen(true);
          }
        } catch (error) {
          console.error('Erro ao verificar sincronização:', error);
        }
      }
    };
    checkSync();
  }, []);

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

  // Tocar som quando uma notificação aparece
  useEffect(() => {
    if (notification && notification.sound) {
      playSound(notification.sound);
    }
  }, [notification, playSound]);


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
    { component: <Shop />, label: 'Loja', icon: <ShoppingCart /> },
    { component: <NotificationsPage />, label: 'Notificações', icon: <Notifications /> },
    { component: <Admin />, label: 'Admin', icon: <Settings /> },
  ];

  const pageVariants = {
    initial: {
      opacity: 0,
      x: 20,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1], // easeOutCubic
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.98,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ClickSoundProvider>
        <Box 
          sx={{ 
            pb: 7, // Espaço para o BottomNavigation
            minHeight: '100vh', 
            backgroundColor: 'background.default', 
            position: 'relative', 
            overflow: 'hidden',
            backgroundImage: themeConfig.backgroundImage 
              ? `url(${themeConfig.backgroundImage})` 
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: themeConfig.palette.background.default,
              backgroundImage: themeConfig.effects.backgroundOverlay,
              opacity: 0.95,
              zIndex: 0,
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ width: '100%' }}
              >
                {pages[currentPage].component}
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 1 }}
        >
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
            }}
          >
            {pages.map((page, index) => (
              <BottomNavigationAction 
                key={index} 
                label={page.label} 
                icon={
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {page.icon}
                  </motion.div>
                } 
              />
            ))}
          </BottomNavigation>
        </motion.div>
        <NotificationModal
          open={showNotification}
          notification={notification}
          onClose={handleCloseNotification}
        />
        <SyncConflictDialog
          open={syncConflictOpen}
          onClose={() => setSyncConflictOpen(false)}
          onRestore={() => {
            setSyncConflictOpen(false);
            setRestoreConfirmOpen(true);
          }}
          onOverwrite={async () => {
            const config = getSupabaseConfig();
            if (config && config.userId) {
              try {
                await saveProgressToCloud(config.userId);
                setSyncConflictOpen(false);
                window.location.reload();
              } catch (error) {
                alert(`Erro ao sobrescrever: ${error.message}`);
              }
            }
          }}
          onIgnore={() => {
            setSyncConflictOpen(false);
          }}
          syncStatus={syncStatus}
        />
        <ConfirmDialog
          open={restoreConfirmOpen}
          onClose={() => setRestoreConfirmOpen(false)}
          onConfirm={async () => {
            const config = getSupabaseConfig();
            if (config && config.userId) {
              try {
                await loadProgressFromCloud(config.userId);
                window.location.reload();
              } catch (error) {
                alert(`Erro ao restaurar: ${error.message}`);
              }
            }
          }}
          action="restaurar"
          title="Confirmar Restauração"
          message="Tem certeza que deseja restaurar o progresso da nuvem? Esta ação irá sobrescrever todos os dados locais atuais."
        />
      </ClickSoundProvider>
    </ThemeProvider>
  );
}

export default App;

