import React from 'react';
import { Box, Typography, Paper, LinearProgress, Grid, useTheme } from '@mui/material';
import { FitnessCenter, Favorite, Speed, Psychology, Whatshot } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getPlayerData, getXPForNextLevel, getSkillXPForNextLevel } from '../utils/storage';

const Statistics = () => {
  const theme = useTheme();
  const playerData = getPlayerData();
  const xpNeeded = getXPForNextLevel(playerData.level);
  const xpProgress = (playerData.xp / xpNeeded) * 100;
  
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const titleTextShadow = theme.custom?.titleTextShadow || `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`;
  const textShadow = theme.custom?.textShadow || `0 0 10px ${primaryColor}`;
  const textShadowLarge = theme.custom?.textShadowLarge || `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`;

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
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            mb: 4,
            color: textPrimary,
            textShadow: titleTextShadow,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            border: `1px solid ${primaryColor}40`,
            p: 1.5,
            textAlign: 'center',
            fontSize: '1.5rem',
          }}
        >
          STATUS
        </Typography>
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
          <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem', opacity: 0.7 }}>
            Faltam {xpNeeded - playerData.xp} XP para o próximo nível
          </Typography>
        </Paper>
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
    </Box>
  );
};

export default Statistics;

