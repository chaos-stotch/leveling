import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { setBlocked } from '../utils/storage';

const BlockedScreen = ({ onUnblock }) => {
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
        background: '#0a0e27',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0.1) 0%, transparent 70%)',
        p: 2,
      }}
    >
      <Paper
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          backgroundColor: '#0f1629',
          border: '2px solid rgba(255, 0, 0, 0.5)',
          boxShadow: 'inset 0 0 50px rgba(255, 0, 0, 0.1), 0 0 50px rgba(255, 0, 0, 0.3)',
        }}
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
          <ErrorOutline
            sx={{
              fontSize: 60,
              color: '#FF0000',
              filter: 'drop-shadow(0 0 10px #FF0000)',
            }}
          />
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
        <Typography
          variant="h5"
          sx={{
            mb: 2,
            color: '#00D4FF',
            textShadow: '0 0 10px #00D4FF',
            fontWeight: 600,
          }}
        >
          Você não completou a tarefa diária a tempo.
        </Typography>
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: '#B0E0FF',
            lineHeight: 1.8,
          }}
        >
          Para desbloquear o aplicativo, você deve realizar uma punição.
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 3,
            fontWeight: 'bold',
            color: '#00D4FF',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Descreva a punição que você realizou:
        </Typography>
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
            '& .MuiInputBase-input::placeholder': {
              color: '#6B7A99',
            },
          }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={handleSubmit}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              borderColor: '#00D4FF',
              color: '#00D4FF',
              borderWidth: '2px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
              '&:hover': {
                borderColor: '#00D4FF',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                boxShadow: '0 0 30px rgba(0, 212, 255, 0.6)',
              },
            }}
          >
            Sim
          </Button>
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

