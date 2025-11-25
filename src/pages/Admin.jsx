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
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { getTasks, saveTasks, getPlayerData, savePlayerData } from '../utils/storage';

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
  const [tasks, setTasks] = useState([]);
  const [playerData, setPlayerData] = useState(null);
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

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 4,
          border: '1px solid rgba(0, 212, 255, 0.3)',
          p: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: '#00D4FF',
            textShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF',
            textTransform: 'uppercase',
            letterSpacing: '3px',
          }}
        >
          ADMIN - GERENCIAR TEMPLATES DE TAREFAS
        </Typography>
      </Box>

      
      <Paper
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: 'background.paper',
          border: '2px solid rgba(0, 212, 255, 0.5)',
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.2)',
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            mb: 3,
            color: '#00D4FF',
            textShadow: '0 0 10px #00D4FF',
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
            <Typography variant="body2" sx={{ mb: 1, color: '#B0E0FF', fontWeight: 600 }}>
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
                      ? '#00D4FF'
                      : 'rgba(0, 212, 255, 0.3)',
                    color: formData.skills.includes(skill.value) ? '#00D4FF' : '#6B7A99',
                    backgroundColor: formData.skills.includes(skill.value)
                      ? 'rgba(0, 212, 255, 0.2)'
                      : 'transparent',
                    border: '1px solid',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: '#00D4FF',
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
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
            <Button
              variant="contained"
              startIcon={editDialog.open ? <Edit /> : <Add />}
              onClick={editDialog.open ? handleUpdate : handleSubmit}
              fullWidth
            >
              {editDialog.open ? 'Atualizar Template' : 'Adicionar Template'}
            </Button>
            {editDialog.open && (
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
            )}
          </Grid>
        </Grid>
      </Paper>

      <Typography
        variant="h6"
        gutterBottom
        sx={{
          mb: 2,
          color: '#00D4FF',
          textShadow: '0 0 10px #00D4FF',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}
      >
        Templates de Tarefas ({tasks.length})
      </Typography>

      {tasks.length === 0 ? (
        <Typography sx={{ color: '#6B7A99', textAlign: 'center', py: 4 }}>
          Nenhum template de tarefa cadastrado
        </Typography>
      ) : (
        tasks.map((task) => (
          <Paper
            key={task.id}
            sx={{
              p: 2.5,
              mb: 2,
              backgroundColor: 'background.paper',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: '#00D4FF', fontWeight: 600, mb: 1 }}>
                  {task.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5, color: '#B0E0FF', lineHeight: 1.6 }}>
                  {task.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Typography variant="body2" sx={{ color: '#B0E0FF' }}>
                    Status:
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={task.active !== false}
                        onChange={() => handleToggleActive(task.id)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#00FF88',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 255, 136, 0.1)',
                            },
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#00FF88',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: task.active !== false ? '#00FF88' : '#FF6B6B' }}>
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
                      backgroundColor: 'rgba(0, 212, 255, 0.2)',
                      color: '#00D4FF',
                      border: '1px solid rgba(0, 212, 255, 0.5)',
                    }}
                  />
                  <Chip
                    label={`${task.xp} XP`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(0, 212, 255, 0.2)',
                      color: '#00D4FF',
                      border: '1px solid rgba(0, 212, 255, 0.5)',
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
                          backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          color: '#B0E0FF',
                          border: '1px solid rgba(0, 212, 255, 0.3)',
                        }}
                      />
                    ));
                  })()}
                </Box>
              </Box>
              <Box>
                <IconButton
                  onClick={() => handleEdit(task)}
                  sx={{
                    color: '#00D4FF',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                    },
                  }}
                >
                  <Edit />
                </IconButton>
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
              </Box>
            </Box>
          </Paper>
        ))
      )}

{playerData && (
        <Paper
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: 'background.paper',
            border: '2px solid rgba(0, 212, 255, 0.5)',
            boxShadow: '0 0 30px rgba(0, 212, 255, 0.2)',
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              mb: 3,
              color: '#00D4FF',
              textShadow: '0 0 10px #00D4FF',
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
                <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 212, 255, 0.05)' }}>
                  <Typography variant="subtitle1" sx={{ color: '#00D4FF', mb: 1 }}>
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
      )}

    </Box>
    
  );
};

export default Admin;

