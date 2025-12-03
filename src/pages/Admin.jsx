import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Chip,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  useTheme,
} from '@mui/material';
import { Add, Delete, Edit, Palette } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getTasks, saveTasks, getPlayerData, savePlayerData, getSelectedTheme, saveSelectedTheme } from '../utils/storage';
import { themes } from '../themes';

// Funções auxiliares para gerenciar tarefas concluídas
const COMPLETED_TASKS_KEY = 'leveling_completed_tasks';

const getCompletedTasks = () => {
  const data = localStorage.getItem(COMPLETED_TASKS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveCompletedTasks = (completedTasks) => {
  localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(completedTasks));
};

const removeCompletedTask = (taskId) => {
  const completedTasks = getCompletedTasks();
  const filtered = completedTasks.filter(id => id !== taskId);
  saveCompletedTasks(filtered);
};

const Admin = () => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  
  const [tasks, setTasks] = useState([]);
  const [playerData, setPlayerData] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(getSelectedTheme());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'common',
    xp: 10,
    skills: [],
    duration: 60,
    active: true,
  });
  const [editDialog, setEditDialog] = useState({ open: false, task: null });

  useEffect(() => {
    loadTasks();
    loadPlayerData();
  }, []);

  const loadTasks = () => {
    const allTasks = getTasks();
    setTasks(allTasks);
  };

  const loadPlayerData = () => {
    const data = getPlayerData();
    setPlayerData(data);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };


  const handleSkillChange = (skill) => {
    const skills = formData.skills.includes(skill)
      ? formData.skills.filter((s) => s !== skill)
      : [...formData.skills, skill];
    setFormData({ ...formData, skills });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description) {
      alert('Preencha título e descrição');
      return;
    }

    const newTask = {
      id: Date.now(),
      ...formData,
      completed: false,
    };

    const updatedTasks = [...tasks, newTask];
    saveTasks(updatedTasks);
    setTasks(updatedTasks);
    resetForm();
  };

  const handleEdit = (task) => {
    setEditDialog({ open: true, task });
    // Compatibilidade: se task.skill existe (string antiga), converter para array
    const skills = task.skills
      ? (Array.isArray(task.skills) ? task.skills : [task.skills])
      : (task.skill ? [task.skill] : []);

    setFormData({
      title: task.title,
      description: task.description,
      type: task.type,
      xp: task.xp,
      skills: skills,
      duration: task.duration || 60,
      active: task.active !== false, // Default true se não definido
    });
  };

  const handleUpdate = () => {
    const taskBeingEdited = tasks.find(t => t.id === editDialog.task.id);
    const isChangingActiveStatus = taskBeingEdited && taskBeingEdited.active !== formData.active;

    const updatedTasks = tasks.map((t) =>
      t.id === editDialog.task.id ? { ...t, ...formData } : t
    );
    saveTasks(updatedTasks);
    setTasks(updatedTasks);

    // Se o status ativo mudou (desabilitada->habilitada ou vice-versa), resetar status de concluída
    if (isChangingActiveStatus) {
      removeCompletedTask(editDialog.task.id);
    }

    setEditDialog({ open: false, task: null });
    resetForm();
  };

  const handleDelete = (taskId) => {
    if (window.confirm('Tem certeza que deseja deletar esta tarefa?')) {
      const updatedTasks = tasks.filter((t) => t.id !== taskId);
      saveTasks(updatedTasks);
      setTasks(updatedTasks);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'common',
      xp: 10,
      skills: [],
      duration: 60,
      active: true,
    });
  };

  const handlePlayerLevelChange = (field, value) => {
    const updatedData = { ...playerData };
    if (field === 'level' || field === 'xp') {
      updatedData[field] = parseInt(value) || 0;
    } else if (field.includes('.')) {
      const [skill, skillField] = field.split('.');
      if (updatedData.skills[skill]) {
        updatedData.skills[skill][skillField] = parseInt(value) || 0;
      }
    }
    setPlayerData(updatedData);
    savePlayerData(updatedData);
  };

  const handleToggleActive = (taskId) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const newActiveStatus = t.active !== false ? false : true;
        // Se estiver sendo desabilitada ou reabilitada, resetar status de concluída
        if (t.active !== newActiveStatus) {
          removeCompletedTask(taskId);
        }
        return { ...t, active: newActiveStatus };
      }
      return t;
    });
    saveTasks(updatedTasks);
    setTasks(updatedTasks);
  };

  const handleThemeChange = (themeId) => {
    saveSelectedTheme(themeId);
    setSelectedTheme(themeId);
    // Disparar evento para atualizar o tema no App
    window.dispatchEvent(new CustomEvent('themeChanged'));
  };

  useEffect(() => {
    const handleThemeChangeEvent = () => {
      setSelectedTheme(getSelectedTheme());
    };
    window.addEventListener('themeChanged', handleThemeChangeEvent);
    return () => {
      window.removeEventListener('themeChanged', handleThemeChangeEvent);
    };
  }, []);

  const skillNames = {
    strength: 'Força',
    vitality: 'Vitalidade',
    agility: 'Agilidade',
    intelligence: 'Inteligência',
    persistence: 'Persistência',
  };

  const skillsList = [
    { value: 'strength', label: 'Força' },
    { value: 'vitality', label: 'Vitalidade' },
    { value: 'agility', label: 'Agilidade' },
    { value: 'intelligence', label: 'Inteligência' },
    { value: 'persistence', label: 'Persistência' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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
            mb: 4,
            border: `1px solid ${primaryColor}4D`,
            p: 2,
          }}
        >
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
            ADMIN - GERENCIAR TEMPLATES DE TAREFAS
          </Typography>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <Paper
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: 'background.paper',
            border: `2px solid ${primaryColor}80`,
            boxShadow: `0 0 30px ${primaryColor}33`,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              mb: 3,
              color: textPrimary,
              textShadow: `0 0 10px ${primaryColor}`,
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
          {editDialog.open ? 'Editar Template de Tarefa' : 'Adicionar Novo Template de Tarefa'}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Título"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descrição"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.type}
                label="Tipo"
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                <MenuItem value="common">Comum</MenuItem>
                <MenuItem value="time">Por Tempo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="XP"
              value={formData.xp}
              onChange={(e) => handleInputChange('xp', parseInt(e.target.value) || 0)}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ mb: 1, color: textSecondary, fontWeight: 600 }}>
              Habilidades (pode selecionar múltiplas):
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[
                { value: 'strength', label: 'Força' },
                { value: 'vitality', label: 'Vitalidade' },
                { value: 'agility', label: 'Agilidade' },
                { value: 'intelligence', label: 'Inteligência' },
                { value: 'persistence', label: 'Persistência' },
              ].map((skill) => (
                <Chip
                  key={skill.value}
                  label={skill.label}
                  onClick={() => handleSkillChange(skill.value)}
                  sx={{
                    borderColor: formData.skills.includes(skill.value)
                      ? primaryColor
                      : `${primaryColor}4D`,
                    color: formData.skills.includes(skill.value) ? textPrimary : textSecondary,
                    opacity: formData.skills.includes(skill.value) ? 1 : 0.6,
                    backgroundColor: formData.skills.includes(skill.value)
                      ? `${primaryColor}33`
                      : 'transparent',
                    border: '1px solid',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: primaryColor,
                      backgroundColor: `${primaryColor}1A`,
                    },
                  }}
                  variant={formData.skills.includes(skill.value) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Grid>
          {formData.type === 'time' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Duração (segundos)"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 60)}
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                />
              }
              label="Tarefa Ativa (aparecerá na lista de tarefas disponíveis)"
            />
          </Grid>
          <Grid item xs={12}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="contained"
                startIcon={editDialog.open ? <Edit /> : <Add />}
                onClick={editDialog.open ? handleUpdate : handleSubmit}
                fullWidth
              >
                {editDialog.open ? 'Atualizar Template' : 'Adicionar Template'}
              </Button>
            </motion.div>
            {editDialog.open && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditDialog({ open: false, task: null });
                    resetForm();
                  }}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Cancelar
                </Button>
              </motion.div>
            )}
          </Grid>
        </Grid>
      </Paper>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            mb: 2,
            color: textPrimary,
            textShadow: `0 0 10px ${primaryColor}`,
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          Templates de Tarefas ({tasks.length})
        </Typography>
      </motion.div>

      {tasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Typography sx={{ color: textSecondary, opacity: 0.7, textAlign: 'center', py: 4 }}>
            Nenhum template de tarefa cadastrado
          </Typography>
        </motion.div>
      ) : (
        <Box>
          {tasks.map((task, index) => (
            <motion.div 
              key={task.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.05,
                ease: [0.22, 1, 0.36, 1] 
              }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <Paper
                sx={{
                  p: 2.5,
                  mb: 2,
                  backgroundColor: 'background.paper',
                  border: `1px solid ${primaryColor}4D`,
                  boxShadow: `0 0 20px ${primaryColor}1A`,
                }}
              >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: textPrimary, fontWeight: 600, mb: 1 }}>
                  {task.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5, color: textSecondary, lineHeight: 1.6 }}>
                  {task.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Typography variant="body2" sx={{ color: textSecondary }}>
                    Status:
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={task.active !== false}
                        onChange={() => handleToggleActive(task.id)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: theme.palette.secondary.main,
                            '&:hover': {
                              backgroundColor: `${theme.palette.secondary.main}1A`,
                            },
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: theme.palette.secondary.main,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: task.active !== false ? theme.palette.secondary.main : '#FF6B6B' }}>
                        {task.active !== false ? 'Ativa' : 'Inativa'}
                      </Typography>
                    }
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={task.type === 'common' ? 'Comum' : 'Por Tempo'}
                    size="small"
                    sx={{
                      backgroundColor: `${primaryColor}33`,
                      color: textPrimary,
                      border: `1px solid ${primaryColor}80`,
                    }}
                  />
                  <Chip
                    label={`${task.xp} XP`}
                    size="small"
                    sx={{
                      backgroundColor: `${primaryColor}33`,
                      color: textPrimary,
                      border: `1px solid ${primaryColor}80`,
                    }}
                  />
                  {(() => {
                    // Compatibilidade: suporta tanto task.skills (array) quanto task.skill (string antiga)
                    const skills = task.skills
                      ? (Array.isArray(task.skills) ? task.skills : [task.skills])
                      : (task.skill ? [task.skill] : []);

                    return skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skillNames[skill]}
                        size="small"
                        sx={{
                          backgroundColor: `${primaryColor}1A`,
                          color: textSecondary,
                          border: `1px solid ${primaryColor}4D`,
                        }}
                      />
                    ));
                  })()}
                </Box>
              </Box>
              <Box>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    onClick={() => handleEdit(task)}
                    sx={{
                      color: primaryColor,
                      '&:hover': {
                        backgroundColor: `${primaryColor}1A`,
                        boxShadow: `0 0 10px ${primaryColor}80`,
                      },
                    }}
                  >
                    <Edit />
                  </IconButton>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    onClick={() => handleDelete(task.id)}
                    sx={{
                      color: '#FF0000',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)',
                      },
                    }}
                  >
                    <Delete />
                  </IconButton>
                </motion.div>
              </Box>
            </Box>
          </Paper>
            </motion.div>
          ))}
        </Box>
      )}

      {playerData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Paper
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: 'background.paper',
            border: `2px solid ${primaryColor}80`,
            boxShadow: `0 0 30px ${primaryColor}33`,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              mb: 3,
              color: textPrimary,
              textShadow: `0 0 10px ${primaryColor}`,
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            GERENCIAR NÍVEIS E XP
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nível Geral"
                type="number"
                value={playerData.level}
                onChange={(e) => handlePlayerLevelChange('level', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="XP Geral"
                type="number"
                value={playerData.xp}
                onChange={(e) => handlePlayerLevelChange('xp', e.target.value)}
              />
            </Grid>

            {skillsList.map((skill) => (
              <Grid item xs={12} sm={6} md={4} key={skill.value}>
                <Paper sx={{ p: 2, backgroundColor: `${primaryColor}0D` }}>
                  <Typography variant="subtitle1" sx={{ color: textPrimary, mb: 1 }}>
                    {skill.label}
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nível"
                    type="number"
                    value={playerData.skills[skill.value].level}
                    onChange={(e) => handlePlayerLevelChange(`${skill.value}.level`, e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="XP"
                    type="number"
                    value={playerData.skills[skill.value].xp}
                    onChange={(e) => handlePlayerLevelChange(`${skill.value}.xp`, e.target.value)}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
        </motion.div>
      )}

      {/* Seção de Seleção de Tema */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Paper
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: 'background.paper',
            border: `2px solid ${primaryColor}80`,
            boxShadow: `0 0 30px ${primaryColor}33`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Palette sx={{ color: primaryColor, fontSize: 32 }} />
            <Typography
              variant="h6"
              sx={{
                color: textPrimary,
                textShadow: `0 0 10px ${primaryColor}`,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 600,
              }}
            >
              Selecionar Tema
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {Object.values(themes).map((themeItem) => (
              <Grid item xs={12} sm={6} key={themeItem.id}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleThemeChange(themeItem.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      border: selectedTheme === themeItem.id ? '2px solid' : '1px solid',
                      borderColor: selectedTheme === themeItem.id ? primaryColor : `${primaryColor}4D`,
                      backgroundColor: selectedTheme === themeItem.id ? `${primaryColor}1A` : 'background.paper',
                      boxShadow: selectedTheme === themeItem.id 
                        ? `0 0 20px ${primaryColor}4D` 
                        : `0 0 10px ${primaryColor}1A`,
                      transition: 'all 0.3s',
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: 200,
                      backgroundImage: themeItem.backgroundImage ? `url(${themeItem.backgroundImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: themeItem.palette.background.default,
                        opacity: 0.7,
                        zIndex: 0,
                        pointerEvents: 'none',
                      },
                    }}
                  >
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: themeItem.palette.text.primary,
                          fontWeight: 600,
                          mb: 1,
                          textShadow: `0 0 10px ${themeItem.palette.primary.main}`,
                        }}
                      >
                        {themeItem.name}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: themeItem.palette.primary.main,
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: `0 0 10px ${themeItem.palette.primary.main}`,
                          }}
                        />
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: themeItem.palette.secondary.main,
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: `0 0 10px ${themeItem.palette.secondary.main}`,
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </motion.div>

    </Box>
    
  );
};

export default Admin;

