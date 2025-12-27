import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, LinearProgress, Grid, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, IconButton } from '@mui/material';
import { FitnessCenter, Favorite, Speed, Psychology, Whatshot, Star, Close, EmojiEvents, Apps } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { 
  getPlayerData, 
  getXPForNextLevel, 
  getSkillXPForNextLevel,
  getTitles,
  getEarnedTitles,
  getSelectedTitle,
  setSelectedTitle,
} from '../utils/storage-compat';
import { checkAndAwardTitles } from '../utils/titles';
import { openAppSettings } from '../utils/settings';

const Statistics = () => {
  const theme = useTheme();
  const playerData = getPlayerData();
  const xpNeeded = getXPForNextLevel(playerData.level);
  const xpProgress = (playerData.xp / xpNeeded) * 100;
  
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [selectedTitleId, setSelectedTitleIdState] = useState(getSelectedTitle());
  const [earnedTitles, setEarnedTitles] = useState(getEarnedTitles());
  const [titles, setTitles] = useState(getTitles());
  
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const titleTextShadow = theme.custom?.titleTextShadow || `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`;
  const textShadow = theme.custom?.textShadow || `0 0 10px ${primaryColor}`;
  const textShadowLarge = theme.custom?.textShadowLarge || `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`;
  
  // Verificar e conceder títulos quando necessário
  useEffect(() => {
    console.log('📊 Statistics: Verificando títulos (nível/ouro mudou)');
    const allTitles = getTitles();
    const allEarnedTitles = getEarnedTitles();
    
    // Limpar títulos deletados da lista de ganhos
    const validEarnedTitles = allEarnedTitles.filter(earnedId => {
      const titleIdStr = String(earnedId);
      const exists = allTitles.some(t => String(t.id) === titleIdStr);
      if (!exists) {
        console.warn(`🧹 Título deletado encontrado na lista de ganhos: ${titleIdStr}`);
      }
      return exists;
    });
    
    // Se algum título foi removido, atualizar o localStorage
    if (validEarnedTitles.length !== allEarnedTitles.length) {
      console.log(`🧹 Limpando ${allEarnedTitles.length - validEarnedTitles.length} título(s) deletado(s) da lista de ganhos`);
      localStorage.setItem('leveling_earned_titles', JSON.stringify(validEarnedTitles));
    }
    
    const newTitles = checkAndAwardTitles();
    if (newTitles.length > 0) {
      console.log(`🎉 Statistics: ${newTitles.length} novo(s) título(s) ganho(s)!`);
      // Se novos títulos foram ganhos, atualizar o estado
      setEarnedTitles(getEarnedTitles());
      setTitles(getTitles());
    } else {
      setEarnedTitles(validEarnedTitles);
      setTitles(allTitles);
    }
    setSelectedTitleIdState(getSelectedTitle());
    
    // Log para debug
    console.log('📋 Títulos disponíveis:', allTitles.map(t => ({ id: String(t.id), name: t.name })));
    console.log('✅ Títulos ganhos (IDs):', validEarnedTitles);
    console.log('✅ Títulos ganhos (detalhes):', validEarnedTitles.map(id => {
      const title = allTitles.find(t => String(t.id) === String(id));
      return title ? { id: String(id), name: title.name } : { id: String(id), name: 'NÃO ENCONTRADO' };
    }));
  }, [playerData.level, playerData.gold]);
  
  // Verificar títulos quando a página é carregada ou quando tarefas são concluídas
  useEffect(() => {
    const handleTaskCompleted = () => {
      console.log('📊 Statistics: Evento taskCompleted recebido!');
      const newTitles = checkAndAwardTitles();
      if (newTitles.length > 0) {
        console.log(`🎉 Statistics: ${newTitles.length} novo(s) título(s) ganho(s) via evento!`);
        setEarnedTitles(getEarnedTitles());
        setTitles(getTitles());
      } else {
        console.log('⚠️ Statistics: Nenhum novo título ganho');
      }
    };
    
    console.log('👂 Statistics: Registrando listener para taskCompleted');
    window.addEventListener('taskCompleted', handleTaskCompleted);
    return () => {
      console.log('🔇 Statistics: Removendo listener para taskCompleted');
      window.removeEventListener('taskCompleted', handleTaskCompleted);
    };
  }, []);
  
  const selectedTitle = selectedTitleId ? titles.find(t => String(t.id) === String(selectedTitleId)) : null;
  const displayTitle = selectedTitle ? selectedTitle.name : 'Sem Título';
  
  const handleSelectTitle = (titleId) => {
    // Normalizar para string para manter consistência
    const normalizedId = titleId ? String(titleId) : null;
    setSelectedTitle(normalizedId);
    setSelectedTitleIdState(normalizedId);
    // Forçar atualização do componente
    window.dispatchEvent(new CustomEvent('titleChanged'));
  };

  const skills = [
    { key: 'strength', name: 'STR', fullName: 'Força', icon: FitnessCenter, color: '#FF6B6B' },
    { key: 'vitality', name: 'VIT', fullName: 'Vitalidade', icon: Favorite, color: '#FF6B6B' },
    { key: 'agility', name: 'AGI', fullName: 'Agilidade', icon: Speed, color: '#4ECDC4' },
    { key: 'intelligence', name: 'INT', fullName: 'Inteligência', icon: Psychology, color: '#95E1D3' },
    { key: 'persistence', name: 'PER', fullName: 'Persistência', icon: Whatshot, color: '#FFD93D' },
  ];

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
        duration: 0.5,
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
        <Paper
          component={motion.div}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setTitleDialogOpen(true)}
          sx={{
            cursor: 'pointer',
            mb: 4,
            backgroundColor: 'background.paper',
            border: `2px solid ${primaryColor}80`,
            boxShadow: `0 0 30px ${primaryColor}33`,
            p: 2,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${primaryColor}1A 0%, ${primaryColor}0D 100%)`,
              zIndex: 0,
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                color: textPrimary,
                textShadow: titleTextShadow,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontSize: '1.8rem',
              }}
            >
              {displayTitle}
            </Typography>
            {selectedTitle && selectedTitle.description && (
              <Typography
                variant="caption"
                sx={{
                  color: textSecondary,
                  fontSize: '0.7rem',
                  mt: 0.5,
                  display: 'block',
                }}
              >
                {selectedTitle.description}
              </Typography>
            )}
          </Box>
        </Paper>
      </motion.div>

      {/* Nível Geral */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <Paper
          component={motion.div}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: 'background.paper',
            border: `2px solid ${primaryColor}80`,
            boxShadow: `0 0 30px ${primaryColor}33, inset 0 0 30px ${primaryColor}0D`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ color: textSecondary, textTransform: 'uppercase', letterSpacing: '2px' }}>
              LEVEL
            </Typography>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 'bold',
                  color: textPrimary,
                  textShadow: textShadowLarge,
                  fontSize: '4rem',
                }}
              >
                {playerData.level}
              </Typography>
            </motion.div>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: textSecondary, fontWeight: 600 }}>
                XP
              </Typography>
              <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 600 }}>
                {playerData.xp} / {xpNeeded}
              </Typography>
            </Box>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ originX: 0 }}
            >
              <LinearProgress
                variant="determinate"
                value={xpProgress}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: `${primaryColor}1A`,
                  border: `1px solid ${primaryColor}4D`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: primaryColor,
                    boxShadow: `0 0 10px ${primaryColor}`,
                  },
                }}
              />
            </motion.div>
          </Box>
          <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem', opacity: 0.7, mb: 2 }}>
            Faltam {xpNeeded - playerData.xp} XP para o próximo nível
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 2, borderTop: `1px solid ${primaryColor}4D` }}>
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 600, textShadow: '0 0 10px #FFD700' }}>
              {playerData.gold || 0} 🪙
            </Typography>
          </Box>
        </Paper>

        {/* Botão para abrir configurações do Android */}
        {Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && (
          <Paper
            component={motion.div}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              try {
                await openAppSettings();
              } catch (error) {
                console.error('Erro ao abrir configurações:', error);
                alert('Não foi possível abrir as configurações. Por favor, abra manualmente em Configurações > Apps.');
              }
            }}
            sx={{
              cursor: 'pointer',
              mb: 4,
              backgroundColor: 'background.paper',
              border: `2px solid ${primaryColor}80`,
              boxShadow: `0 0 20px ${primaryColor}33`,
              p: 2,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, ${primaryColor}1A 0%, ${primaryColor}0D 100%)`,
                zIndex: 0,
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Apps sx={{ color: primaryColor, fontSize: 28 }} />
              <Typography
                variant="h6"
                sx={{
                  color: textPrimary,
                  fontWeight: 600,
                  textShadow: textShadow,
                }}
              >
                Ver Todos os Apps
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: textSecondary,
                fontSize: '0.75rem',
                mt: 1,
                display: 'block',
              }}
            >
              Abre as configurações do Android
            </Typography>
          </Paper>
        )}
      </motion.div>

      {/* Habilidades */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{
            mb: 3,
            fontWeight: 'bold',
            color: textPrimary,
            textShadow: textShadow,
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          Habilidades
        </Typography>
      </motion.div>
      <Grid container spacing={2} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
        {skills.map((skill, index) => {
          const skillData = playerData.skills[skill.key];
          const skillXPNeeded = getSkillXPForNextLevel(skillData.level);
          const skillXPProgress = (skillData.xp / skillXPNeeded) * 100;
          const IconComponent = skill.icon;

          return (
            <Grid item xs={12} sm={6} md={4} key={skill.key} component={motion.div} variants={itemVariants}>
              <Paper
                component={motion.div}
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ duration: 0.2 }}
                sx={{
                  p: 3,
                  height: '100%',
                  backgroundColor: 'background.paper',
                  border: `1px solid ${primaryColor}4D`,
                  boxShadow: `0 0 20px ${primaryColor}1A`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <motion.div
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                      delay: index * 0.2,
                    }}
                  >
                    <IconComponent
                      sx={{
                        fontSize: 32,
                        color: skill.color,
                        filter: `drop-shadow(0 0 5px ${skill.color})`,
                      }}
                    />
                  </motion.div>
                  <Box>
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.75rem', opacity: 0.7 }}>
                      {skill.fullName}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 'bold',
                        color: textPrimary,
                        textShadow: textShadow,
                      }}
                    >
                      {skill.name}: {skillData.level}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.7rem' }}>
                      {skillData.xp} / {skillXPNeeded} XP
                    </Typography>
                  </Box>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    style={{ originX: 0 }}
                  >
                    <LinearProgress
                      variant="determinate"
                      value={skillXPProgress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: `${primaryColor}1A`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: skill.color,
                          boxShadow: `0 0 5px ${skill.color}`,
                        },
                      }}
                    />
                  </motion.div>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
      
      {/* Dialog de Seleção de Títulos */}
      <Dialog
        open={titleDialogOpen}
        onClose={() => setTitleDialogOpen(false)}
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
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${primaryColor}4D`,
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents sx={{ color: '#FFD700', fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{
                color: textPrimary,
                textShadow: textShadow,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Seus Títulos
            </Typography>
          </Box>
          <IconButton
            onClick={() => setTitleDialogOpen(false)}
            sx={{
              color: textSecondary,
              '&:hover': {
                backgroundColor: `${primaryColor}1A`,
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {earnedTitles.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: textSecondary, opacity: 0.7 }}>
                Você ainda não ganhou nenhum título
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Opção de remover título */}
              <Paper
                component={motion.div}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleSelectTitle(null);
                  setTitleDialogOpen(false);
                }}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: selectedTitleId === null ? `2px solid ${primaryColor}` : `1px solid ${primaryColor}4D`,
                  backgroundColor: selectedTitleId === null ? `${primaryColor}1A` : 'background.paper',
                  boxShadow: selectedTitleId === null ? `0 0 20px ${primaryColor}4D` : 'none',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: textPrimary,
                    fontWeight: 600,
                  }}
                >
                  Sem Título
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                  Não exibir nenhum título
                </Typography>
              </Paper>
              
              {earnedTitles.map((titleId) => {
                // Normalizar comparação de IDs (pode ser string ou número)
                const titleIdStr = String(titleId);
                const title = titles.find(t => String(t.id) === titleIdStr);
                if (!title) {
                  console.warn(`⚠️ Título com ID ${titleIdStr} não encontrado na lista de títulos. Pode ter sido deletado.`);
                  return null;
                }
                const isSelected = String(selectedTitleId) === titleIdStr;
                
                return (
                  <Paper
                    key={titleId}
                    component={motion.div}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleSelectTitle(titleId);
                      setTitleDialogOpen(false);
                    }}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${primaryColor}` : `1px solid ${primaryColor}4D`,
                      backgroundColor: isSelected ? `${primaryColor}1A` : 'background.paper',
                      boxShadow: isSelected ? `0 0 20px ${primaryColor}4D` : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <EmojiEvents sx={{ color: '#FFD700', fontSize: 20 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          color: textPrimary,
                          fontWeight: 600,
                        }}
                      >
                        {title.name}
                      </Typography>
                      {isSelected && (
                        <Chip
                          label="Ativo"
                          size="small"
                          sx={{
                            backgroundColor: primaryColor,
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                    {title.description && (
                      <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem', mt: 0.5 }}>
                        {title.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {title.requiresLevel && (
                        <Chip
                          label={`Nível ${title.requiredLevel}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            backgroundColor: `${primaryColor}1A`,
                            color: textSecondary,
                          }}
                        />
                      )}
                      {title.requiresGold && (
                        <Chip
                          label={`${title.requiredGold} 🪙`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            backgroundColor: '#FFD7001A',
                            color: '#FFD700',
                          }}
                        />
                      )}
                      {title.requiresTasks && title.requiredTasks && title.requiredTasks.length > 0 && (
                        <Chip
                          label={`${title.requiredTasks.length} Tarefa(s)`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            backgroundColor: `${primaryColor}1A`,
                            color: textSecondary,
                          }}
                        />
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${primaryColor}4D`, p: 2 }}>
          <Button
            onClick={() => setTitleDialogOpen(false)}
            sx={{
              color: textSecondary,
              '&:hover': {
                backgroundColor: `${primaryColor}1A`,
              },
            }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Statistics;

