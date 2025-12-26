import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import { CloudUpload, CloudDownload, Close } from '@mui/icons-material';

const SyncConflictDialog = ({ open, onClose, onRestore, onOverwrite, onIgnore, syncStatus }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const titleTextShadow = theme.custom?.titleTextShadow || `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`;

  if (!syncStatus) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessage = () => {
    if (syncStatus.type === 'cloud_newer') {
      return 'A nuvem possui dados mais recentes que o seu dispositivo local.';
    } else if (syncStatus.type === 'local_newer') {
      return 'Seu dispositivo local possui dados mais recentes que a nuvem.';
    }
    return 'Os dados estão dessincronizados.';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
            textShadow: titleTextShadow,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: `${primaryColor}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${primaryColor}`,
            }}
          >
            ⚠️
          </Box>
          Dessincronização Detectada
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: textSecondary, mb: 3, lineHeight: 1.8 }}>
            {getMessage()}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            {syncStatus.cloudLastModified && (
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: `${primaryColor}0D`,
                  border: `1px solid ${primaryColor}4D`,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: textPrimary, fontWeight: 600, mb: 1 }}>
                  Última Modificação na Nuvem:
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary }}>
                  {formatDate(syncStatus.cloudLastModified)}
                </Typography>
              </Paper>
            )}

            {syncStatus.localLastSave && (
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: `${primaryColor}0D`,
                  border: `1px solid ${primaryColor}4D`,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: textPrimary, fontWeight: 600, mb: 1 }}>
                  Último Save Local:
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary }}>
                  {formatDate(syncStatus.localLastSave)}
                </Typography>
              </Paper>
            )}

            {syncStatus.localLastRestore && (
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: `${primaryColor}0D`,
                  border: `1px solid ${primaryColor}4D`,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: textPrimary, fontWeight: 600, mb: 1 }}>
                  Última Restauração Local:
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary }}>
                  {formatDate(syncStatus.localLastRestore)}
                </Typography>
              </Paper>
            )}
          </Box>

          <Typography variant="body2" sx={{ color: textSecondary, fontStyle: 'italic' }}>
            Escolha uma ação:
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, flexDirection: 'column' }}>
          {syncStatus.type === 'cloud_newer' && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%' }}
            >
              <Button
                onClick={onRestore}
                variant="contained"
                fullWidth
                startIcon={<CloudDownload />}
                sx={{
                  mb: 1,
                  backgroundColor: primaryColor,
                  '&:hover': {
                    backgroundColor: primaryColor,
                    boxShadow: `0 0 20px ${primaryColor}80`,
                  },
                }}
              >
                Restaurar Backup da Nuvem
              </Button>
            </motion.div>
          )}

          {syncStatus.type === 'local_newer' && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%' }}
            >
              <Button
                onClick={onOverwrite}
                variant="contained"
                fullWidth
                startIcon={<CloudUpload />}
                sx={{
                  mb: 1,
                  backgroundColor: primaryColor,
                  '&:hover': {
                    backgroundColor: primaryColor,
                    boxShadow: `0 0 20px ${primaryColor}80`,
                  },
                }}
              >
                Sobrescrever Nuvem com Dados Locais
              </Button>
            </motion.div>
          )}

          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
              <Button
                onClick={onIgnore}
                variant="outlined"
                fullWidth
                startIcon={<Close />}
              >
                Ignorar (Salvar Depois)
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
              <Button
                onClick={onClose}
                variant="outlined"
                fullWidth
              >
                Cancelar
              </Button>
            </motion.div>
          </Box>
        </DialogActions>
      </motion.div>
    </Dialog>
  );
};

export default SyncConflictDialog;

