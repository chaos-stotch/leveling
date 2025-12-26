import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';

const ConfirmDialog = ({ open, onClose, onConfirm, action, title, message }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const requiredText = action === 'salvar' ? 'salvar' : 'restaurar';
  const isValid = confirmText.toLowerCase().trim() === requiredText;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      setConfirmText('');
      setError('');
      onClose();
    } else {
      setError(`Por favor, digite "${requiredText}" para confirmar`);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          border: `2px solid ${primaryColor}80`,
          boxShadow: `0 0 30px ${primaryColor}33`,
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <DialogTitle
          sx={{
            color: textPrimary,
            textShadow: `0 0 10px ${primaryColor}`,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontWeight: 600,
          }}
        >
          {title}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: textSecondary, mb: 3 }}>
            {message}
          </Typography>
          <Box>
            <TextField
              fullWidth
              label={`Digite "${requiredText}" para confirmar`}
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError('');
              }}
              error={!!error}
              helperText={error}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && isValid) {
                  handleConfirm();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: primaryColor,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: primaryColor,
                    boxShadow: `0 0 10px ${primaryColor}33`,
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleClose} variant="outlined">
              Cancelar
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleConfirm}
              variant="contained"
              disabled={!isValid}
              sx={{
                opacity: isValid ? 1 : 0.5,
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
            >
              Confirmar
            </Button>
          </motion.div>
        </DialogActions>
      </motion.div>
    </Dialog>
  );
};

export default ConfirmDialog;

