import React from 'react';
import { Box, Typography, Paper, Chip, useTheme } from '@mui/material';
import { EmojiEvents, TrendingUp, Refresh, ErrorOutline } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getNotifications } from '../utils/storage';

const Notifications = () => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  
  const notifications = getNotifications();

  const getIcon = (type) => {
    const secondaryColor = theme.palette.secondary.main;
    switch (type) {
      case 'level_up':
        return <EmojiEvents sx={{ color: '#FFD700', filter: 'drop-shadow(0 0 5px #FFD700)' }} />;
      case 'skill_level_up':
        return <TrendingUp sx={{ color: secondaryColor, filter: `drop-shadow(0 0 5px ${secondaryColor})` }} />;
      case 'task_reset':
        return <Refresh sx={{ color: primaryColor, filter: `drop-shadow(0 0 5px ${primaryColor})` }} />;
      default:
        return <ErrorOutline sx={{ color: primaryColor, filter: `drop-shadow(0 0 5px ${primaryColor})` }} />;
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'background.default' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            border: `1px solid ${primaryColor}4D`,
            p: 2,
          }}
        >
          <ErrorOutline sx={{ color: textPrimary, filter: `drop-shadow(0 0 5px ${primaryColor})` }} />
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: textPrimary,
              textShadow: `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontSize: '1.5rem',
            }}
          >
            NOTIFICAÇÕES
          </Typography>
        </Box>
      </motion.div>

      {notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography sx={{ color: textSecondary, opacity: 0.7, textAlign: 'center', py: 4 }}>
            Nenhuma notificação ainda
          </Typography>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {notifications.map((notification, index) => (
            <motion.div key={notification.id} variants={itemVariants}>
              <Paper
                component={motion.div}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                sx={{
                  p: 2.5,
                  mb: 2,
                  backgroundColor: 'background.paper',
                  border: `1px solid ${primaryColor}4D`,
                  boxShadow: `0 0 20px ${primaryColor}1A`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                  <Box sx={{ mt: 0.5 }}>{getIcon(notification.type)}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: textPrimary,
                        textShadow: `0 0 5px ${primaryColor}`,
                        fontWeight: 600,
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5, color: textSecondary, lineHeight: 1.6 }}>
                      {notification.message}
                    </Typography>
                    <Chip
                      label={formatDate(notification.timestamp)}
                      size="small"
                      sx={{
                        borderColor: `${primaryColor}80`,
                        color: textSecondary,
                        backgroundColor: `${primaryColor}1A`,
                      }}
                      variant="outlined"
                    />
              </Box>
            </Box>
          </Paper>
            </motion.div>
          ))}
        </motion.div>
      )}
    </Box>
  );
};

export default Notifications;

