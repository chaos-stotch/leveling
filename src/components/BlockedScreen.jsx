import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, useTheme } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { setBlocked } from '../utils/storage-compat';

const BlockedScreen = ({ onUnblock }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const titleTextShadow = theme.custom?.titleTextShadow || `0 0 10px ${primaryColor}`;
  
  const [punishment, setPunishment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (punishment.trim().toLowerCase() === 'concluido') {
      setBlocked(false);
      onUnblock();
    } else {
      setError('Digite "concluido" para desbloquear');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.background.default,
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0.1) 0%, transparent 70%)',
        p: 2,
      }}
    >
      <Paper
        component={motion.div}
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          backgroundColor: theme.palette.background.paper,
          border: '2px solid rgba(255, 0, 0, 0.5)',
          boxShadow: 'inset 0 0 50px rgba(255, 0, 0, 0.1), 0 0 50px rgba(255, 0, 0, 0.3)',
        }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
        >
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
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
              <ErrorOutline
                sx={{
                  fontSize: 60,
                  color: '#FF0000',
                  filter: 'drop-shadow(0 0 10px #FF0000)',
                }}
              />
            </motion.div>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                color: '#FF0000',
                textShadow: '0 0 10px #FF0000, 0 0 20px #FF0000',
                textTransform: 'uppercase',
                letterSpacing: '3px',
              }}
            >
              NOTIFICATION
            </Typography>
          </Box>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Typography
            variant="h5"
            sx={{
              mb: 2,
              color: textPrimary,
              textShadow: titleTextShadow,
              fontWeight: 600,
            }}
          >
            Você não completou a tarefa diária a tempo.
          </Typography>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: textSecondary,
              lineHeight: 1.8,
            }}
          >
            Para desbloquear o aplicativo, você deve realizar uma punição.
          </Typography>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Typography
            variant="body2"
            sx={{
              mb: 3,
              fontWeight: 'bold',
              color: textPrimary,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Descreva a punição que você realizou:
          </Typography>
        </motion.div>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={punishment}
          onChange={(e) => {
            setPunishment(e.target.value);
            setError('');
          }}
          error={!!error}
          helperText={error}
          placeholder="Descreva a punição realizada..."
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: textPrimary,
              '& fieldset': {
                borderColor: `${primaryColor}80`,
              },
              '&:hover fieldset': {
                borderColor: `${primaryColor}CC`,
              },
              '&.Mui-focused fieldset': {
                borderColor: primaryColor,
                boxShadow: `0 0 10px ${primaryColor}80`,
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: textSecondary,
              opacity: 0.6,
            },
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ flex: 1 }}
            >
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleSubmit}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderColor: primaryColor,
                  color: textPrimary,
                  borderWidth: '2px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: `0 0 20px ${primaryColor}4D`,
                  '&:hover': {
                    borderColor: primaryColor,
                    backgroundColor: `${primaryColor}1A`,
                    boxShadow: `0 0 30px ${primaryColor}99`,
                  },
                }}
              >
                Sim
              </Button>
            </motion.div>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => {}}
              disabled
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                borderColor: '#6B7A99',
                color: '#6B7A99',
                borderWidth: '2px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Não
            </Button>
          </Box>
        </motion.div>
        <Typography
          variant="caption"
          sx={{
            mt: 3,
            display: 'block',
            color: '#6B7A99',
            fontSize: '0.75rem',
          }}
        >
          Digite "concluido" no campo acima após realizar a punição
        </Typography>
      </Paper>
    </Box>
  );
};

export default BlockedScreen;

