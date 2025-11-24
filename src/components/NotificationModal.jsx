import React from 'react';
import { Dialog, DialogContent, Typography, Button, Box } from '@mui/material';
import { ErrorOutline, EmojiEvents, TrendingUp, Refresh } from '@mui/icons-material';

const NotificationModal = ({ open, notification, onClose }) => {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'level_up':
        return <EmojiEvents sx={{ fontSize: 80, color: '#FFD700', filter: 'drop-shadow(0 0 10px #FFD700)' }} />;
      case 'skill_level_up':
        return <TrendingUp sx={{ fontSize: 80, color: '#00FF88', filter: 'drop-shadow(0 0 10px #00FF88)' }} />;
      case 'task_reset':
        return <Refresh sx={{ fontSize: 80, color: '#00D4FF', filter: 'drop-shadow(0 0 10px #00D4FF)' }} />;
      default:
        return <ErrorOutline sx={{ fontSize: 80, color: '#00D4FF', filter: 'drop-shadow(0 0 10px #00D4FF)' }} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          m: 0,
          borderRadius: 0,
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          p: 4,
          minHeight: '100vh',
          background: '#0a0e27',
          backgroundImage: 
            'radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 70%)',
          color: '#00D4FF',
          border: '2px solid rgba(0, 212, 255, 0.5)',
          boxShadow: 'inset 0 0 50px rgba(0, 212, 255, 0.1), 0 0 50px rgba(0, 212, 255, 0.3)',
        }}
      >
        <Box
          sx={{
            mb: 4,
            p: 2,
            borderRadius: '50%',
            border: '2px solid rgba(0, 212, 255, 0.5)',
            boxShadow: '0 0 30px rgba(0, 212, 255, 0.5)',
          }}
        >
          {getIcon()}
        </Box>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            mb: 2,
            color: '#00D4FF',
            textShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF, 0 0 30px #00D4FF',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          {notification.title}
        </Typography>
        <Typography
          variant="h5"
          component="p"
          sx={{
            mb: 4,
            color: '#B0E0FF',
            textShadow: '0 0 5px #00D4FF',
            maxWidth: '80%',
          }}
        >
          {notification.message}
        </Typography>
        <Button
          variant="outlined"
          size="large"
          onClick={onClose}
          sx={{
            mt: 2,
            px: 6,
            py: 1.5,
            fontSize: '1.1rem',
            borderColor: '#00D4FF',
            color: '#00D4FF',
            borderWidth: '2px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
            '&:hover': {
              borderColor: '#00D4FF',
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              boxShadow: '0 0 30px rgba(0, 212, 255, 0.8)',
            },
          }}
        >
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;

