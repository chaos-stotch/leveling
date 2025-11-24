import React from 'react';
import { Box, Typography, Paper, LinearProgress, Grid } from '@mui/material';
import { FitnessCenter, Favorite, Speed, Psychology, Whatshot } from '@mui/icons-material';
import { getPlayerData, getXPForNextLevel, getSkillXPForNextLevel } from '../utils/storage';

const Statistics = () => {
  const playerData = getPlayerData();
  const xpNeeded = getXPForNextLevel(playerData.level);
  const xpProgress = (playerData.xp / xpNeeded) * 100;

  const skills = [
    { key: 'strength', name: 'STR', fullName: 'Força', icon: FitnessCenter, color: '#FF6B6B' },
    { key: 'vitality', name: 'VIT', fullName: 'Vitalidade', icon: Favorite, color: '#FF6B6B' },
    { key: 'agility', name: 'AGI', fullName: 'Agilidade', icon: Speed, color: '#4ECDC4' },
    { key: 'intelligence', name: 'INT', fullName: 'Inteligência', icon: Psychology, color: '#95E1D3' },
    { key: 'persistence', name: 'PER', fullName: 'Persistência', icon: Whatshot, color: '#FFD93D' },
  ];

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          mb: 4,
          color: '#00D4FF',
          textShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          p: 2,
          textAlign: 'center',
        }}
      >
        STATUS
      </Typography>

      {/* Nível Geral */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: 'background.paper',
          border: '2px solid rgba(0, 212, 255, 0.5)',
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.2), inset 0 0 30px rgba(0, 212, 255, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#B0E0FF', textTransform: 'uppercase', letterSpacing: '2px' }}>
            LEVEL
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 'bold',
              color: '#00D4FF',
              textShadow: '0 0 20px #00D4FF, 0 0 40px #00D4FF',
              fontSize: '4rem',
            }}
          >
            {playerData.level}
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#B0E0FF', fontWeight: 600 }}>
              XP
            </Typography>
            <Typography variant="body2" sx={{ color: '#00D4FF', fontWeight: 600 }}>
              {playerData.xp} / {xpNeeded}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={xpProgress}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#00D4FF',
                boxShadow: '0 0 10px #00D4FF',
              },
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: '#6B7A99', fontSize: '0.85rem' }}>
          Faltam {xpNeeded - playerData.xp} XP para o próximo nível
        </Typography>
      </Paper>

      {/* Habilidades */}
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{
          mb: 3,
          fontWeight: 'bold',
          color: '#00D4FF',
          textShadow: '0 0 10px #00D4FF',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}
      >
        Habilidades
      </Typography>
      <Grid container spacing={2}>
        {skills.map((skill) => {
          const skillData = playerData.skills[skill.key];
          const skillXPNeeded = getSkillXPForNextLevel(skillData.level);
          const skillXPProgress = (skillData.xp / skillXPNeeded) * 100;
          const IconComponent = skill.icon;

          return (
            <Grid item xs={12} sm={6} md={4} key={skill.key}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  backgroundColor: 'background.paper',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'rgba(0, 212, 255, 0.6)',
                    boxShadow: '0 0 30px rgba(0, 212, 255, 0.3)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <IconComponent
                    sx={{
                      fontSize: 32,
                      color: skill.color,
                      filter: `drop-shadow(0 0 5px ${skill.color})`,
                    }}
                  />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#6B7A99', fontSize: '0.75rem' }}>
                      {skill.fullName}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 'bold',
                        color: '#00D4FF',
                        textShadow: '0 0 10px #00D4FF',
                      }}
                    >
                      {skill.name}: {skillData.level}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#B0E0FF', fontSize: '0.7rem' }}>
                      {skillData.xp} / {skillXPNeeded} XP
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={skillXPProgress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: skill.color,
                        boxShadow: `0 0 5px ${skill.color}`,
                      },
                    }}
                  />
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

