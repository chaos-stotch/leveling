import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { EmojiEvents, TrendingUp, Refresh, ErrorOutline } from '@mui/icons-material';
import { getNotifications } from '../utils/storage';

const Notifications = () => {
  const notifications = getNotifications();

  const getIcon = (type) => {
    switch (type) {
      case 'level_up':
        return <EmojiEvents sx={{ color: '#FFD700', filter: 'drop-shadow(0 0 5px #FFD700)' }} />;
      case 'skill_level_up':
        return <TrendingUp sx={{ color: '#00FF88', filter: 'drop-shadow(0 0 5px #00FF88)' }} />;
      case 'task_reset':
        return <Refresh sx={{ color: '#00D4FF', filter: 'drop-shadow(0 0 5px #00D4FF)' }} />;
      default:
        return <ErrorOutline sx={{ color: '#00D4FF', filter: 'drop-shadow(0 0 5px #00D4FF)' }} />;
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 3,
          border: '1px solid rgba(0, 212, 255, 0.3)',
          p: 2,
        }}
      >
        <ErrorOutline sx={{ color: '#00D4FF', filter: 'drop-shadow(0 0 5px #00D4FF)' }} />
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: '#00D4FF',
            textShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF',
            textTransform: 'uppercase',
            letterSpacing: '3px',
          }}
        >
          NOTIFICAÇÕES
        </Typography>
      </Box>

      {notifications.length === 0 ? (
        <Typography sx={{ color: '#6B7A99', textAlign: 'center', py: 4 }}>
          Nenhuma notificação ainda
        </Typography>
      ) : (
        notifications.map((notification) => (
          <Paper
            key={notification.id}
            sx={{
              p: 2.5,
              mb: 2,
              backgroundColor: 'background.paper',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
              <Box sx={{ mt: 0.5 }}>{getIcon(notification.type)}</Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: '#00D4FF',
                    textShadow: '0 0 5px #00D4FF',
                    fontWeight: 600,
                  }}
                >
                  {notification.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5, color: '#B0E0FF', lineHeight: 1.6 }}>
                  {notification.message}
                </Typography>
                <Chip
                  label={formatDate(notification.timestamp)}
                  size="small"
                  sx={{
                    borderColor: 'rgba(0, 212, 255, 0.5)',
                    color: '#B0E0FF',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                  }}
                  variant="outlined"
                />
              </Box>
            </Box>
          </Paper>
        ))
      )}
    </Box>
  );
};

export default Notifications;

