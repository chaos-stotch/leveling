import React from 'react';
import { Dialog, DialogContent, Typography, Button, Box, useTheme } from '@mui/material';
import { ErrorOutline, EmojiEvents, TrendingUp, Refresh } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationModal = ({ open, notification, onClose }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const titleTextShadow = theme.custom?.titleTextShadow || `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}, 0 0 30px ${primaryColor}`;
  
  if (!notification) return null;

  const getIcon = () => {
    const secondaryColor = theme.palette.secondary.main;
    switch (notification.type) {
      case 'level_up':
        return <EmojiEvents sx={{ fontSize: 80, color: '#FFD700', filter: 'drop-shadow(0 0 10px #FFD700)' }} />;
      case 'skill_level_up':
        return <TrendingUp sx={{ fontSize: 80, color: secondaryColor, filter: `drop-shadow(0 0 10px ${secondaryColor})` }} />;
      case 'task_reset':
        return <Refresh sx={{ fontSize: 80, color: primaryColor, filter: `drop-shadow(0 0 10px ${primaryColor})` }} />;
      default:
        return <ErrorOutline sx={{ fontSize: 80, color: primaryColor, filter: `drop-shadow(0 0 10px ${primaryColor})` }} />;
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
        component={motion.div}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          p: 4,
          minHeight: '100vh',
          background: theme.palette.background.default,
          backgroundImage: `radial-gradient(circle at 50% 50%, ${primaryColor}1A 0%, transparent 70%)`,
          color: textPrimary,
          border: `2px solid ${primaryColor}80`,
          boxShadow: `inset 0 0 50px ${primaryColor}1A, 0 0 50px ${primaryColor}4D`,
        }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.1 
          }}
        >
          <Box
            sx={{
              mb: 4,
              p: 2,
              borderRadius: '50%',
              border: `2px solid ${primaryColor}80`,
              boxShadow: `0 0 30px ${primaryColor}80`,
            }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              {getIcon()}
            </motion.div>
          </Box>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              mb: 2,
              color: textPrimary,
              textShadow: titleTextShadow,
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            {notification.title}
          </Typography>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Typography
            variant="h5"
            component="p"
            sx={{
              mb: 4,
              color: textSecondary,
              textShadow: titleTextShadow,
              maxWidth: '80%',
            }}
          >
            {notification.message}
          </Typography>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="outlined"
            size="large"
            onClick={onClose}
            sx={{
              mt: 2,
              px: 6,
              py: 1.5,
              fontSize: '1.1rem',
              borderColor: primaryColor,
              color: textPrimary,
              borderWidth: '2px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: `0 0 20px ${primaryColor}80`,
              '&:hover': {
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}1A`,
                boxShadow: `0 0 30px ${primaryColor}CC`,
              },
            }}
          >
            Fechar
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;

