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
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { Add, Delete, Edit, AddCircle, RemoveCircle } from '@mui/icons-material';
import { getTasks, saveTasks, getPlayerData, savePlayerData } from '../utils/storage';

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
    replaceAtEndOfDay: false,
    isDaily: false,
    daysOfWeek: [],
    canBeDaily: false,
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

  const handleDaysChange = (day) => {
    const days = formData.daysOfWeek.includes(day)
      ? formData.daysOfWeek.filter((d) => d !== day)
      : [...formData.daysOfWeek, day];
    setFormData({ ...formData, daysOfWeek: days });
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
      replaceAtEndOfDay: task.replaceAtEndOfDay || false,
      isDaily: task.isDaily || false,
      daysOfWeek: task.daysOfWeek || [],
      canBeDaily: task.canBeDaily || false,
    });
  };

  const handleUpdate = () => {
    const updatedTasks = tasks.map((t) =>
      t.id === editDialog.task.id ? { ...t, ...formData } : t
    );
    saveTasks(updatedTasks);
    setTasks(updatedTasks);
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
      replaceAtEndOfDay: false,
      isDaily: false,
      daysOfWeek: [],
      canBeDaily: false,
    });
  };

  const adjustLevel = (delta) => {
    if (!playerData) return;
    const newLevel = Math.max(1, playerData.level + delta);
    const updatedData = { ...playerData, level: newLevel };
    savePlayerData(updatedData);
    setPlayerData(updatedData);
  };

  const adjustSkillLevel = (skillName, delta) => {
    if (!playerData || !playerData.skills[skillName]) return;
    const newLevel = Math.max(1, playerData.skills[skillName].level + delta);
    const updatedData = {
      ...playerData,
      skills: {
        ...playerData.skills,
        [skillName]: {
          ...playerData.skills[skillName],
          level: newLevel,
          xp: 0, // Reset XP when manually adjusting level
        }
      }
    };
    savePlayerData(updatedData);
    setPlayerData(updatedData);
  };

  const resetXP = () => {
    if (!playerData) return;
    const updatedData = {
      ...playerData,
      xp: 0,
      skills: Object.keys(playerData.skills).reduce((acc, skill) => {
        acc[skill] = { ...playerData.skills[skill], xp: 0 };
        return acc;
      }, {})
    };
    savePlayerData(updatedData);
    setPlayerData(updatedData);
  };

  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
  ];

  const skillNames = {
    strength: 'Força',
    vitality: 'Vitalidade',
    agility: 'Agilidade',
    intelligence: 'Inteligência',
    persistence: 'Persistência',
  };

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
          ADMIN - GERENCIAR TAREFAS
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
          {editDialog.open ? 'Editar Tarefa' : 'Adicionar Nova Tarefa'}
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
                  checked={formData.replaceAtEndOfDay}
                  onChange={(e) => handleInputChange('replaceAtEndOfDay', e.target.checked)}
                />
              }
              label="Substituir ao final do dia (tarefas não finalizadas serão deletadas)"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDaily}
                  onChange={(e) => handleInputChange('isDaily', e.target.checked)}
                />
              }
              label="Tarefa Quotidiana (aparecerá nos dias selecionados)"
            />
          </Grid>
          {formData.isDaily && (
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Dias da semana:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {daysOfWeek.map((day) => (
                  <Chip
                    key={day.value}
                    label={day.label}
                    onClick={() => handleDaysChange(day.value)}
                    color={formData.daysOfWeek.includes(day.value) ? 'primary' : 'default'}
                    variant={formData.daysOfWeek.includes(day.value) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>
          )}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.canBeDaily}
                  onChange={(e) => handleInputChange('canBeDaily', e.target.checked)}
                />
              }
              label="Pode ser selecionada como Tarefa Diária aleatória"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={editDialog.open ? <Edit /> : <Add />}
              onClick={editDialog.open ? handleUpdate : handleSubmit}
              fullWidth
            >
              {editDialog.open ? 'Atualizar Tarefa' : 'Adicionar Tarefa'}
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
        Tarefas Existentes ({tasks.length})
      </Typography>

      {tasks.length === 0 ? (
        <Typography sx={{ color: '#6B7A99', textAlign: 'center', py: 4 }}>
          Nenhuma tarefa cadastrada
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
                  {task.replaceAtEndOfDay && (
                    <Chip
                      label="Substitui ao final do dia"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255, 193, 7, 0.2)',
                        color: '#FFC107',
                        border: '1px solid rgba(255, 193, 7, 0.5)',
                      }}
                    />
                  )}
                  {task.isDaily && (
                    <Chip
                      label="Quotidiana"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                        color: '#2196F3',
                        border: '1px solid rgba(33, 150, 243, 0.5)',
                      }}
                    />
                  )}
                  {task.canBeDaily && (
                    <Chip
                      label="Pode ser diária"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(0, 255, 136, 0.2)',
                        color: '#00FF88',
                        border: '1px solid rgba(0, 255, 136, 0.5)',
                      }}
                    />
                  )}
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
      {/* Seção de Gerenciamento de Níveis */}
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
            GERENCIAR NÍVEIS
          </Typography>

          <Grid container spacing={3}>
            {/* Nível Geral */}
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00D4FF', mb: 2 }}>
                    Nível Geral
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#B0E0FF' }}>
                      Nível Atual: {playerData.level}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        onClick={() => adjustLevel(-1)}
                        sx={{ color: '#FF6B6B' }}
                        size="small"
                      >
                        <RemoveCircle />
                      </IconButton>
                      <IconButton
                        onClick={() => adjustLevel(1)}
                        sx={{ color: '#00FF88' }}
                        size="small"
                      >
                        <AddCircle />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#6B7A99' }}>
                    XP: {playerData.xp}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Habilidades */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ color: '#B0E0FF', mb: 2 }}>
                Habilidades
              </Typography>
              {Object.entries(playerData.skills).map(([skillName, skillData]) => {
                const skillNamesMap = {
                  strength: 'Força',
                  vitality: 'Vitalidade',
                  agility: 'Agilidade',
                  intelligence: 'Inteligência',
                  persistence: 'Persistência',
                };

                return (
                  <Box key={skillName} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#00D4FF' }}>
                        {skillNamesMap[skillName]}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7A99' }}>
                        Nível {skillData.level} • XP: {skillData.xp}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        onClick={() => adjustSkillLevel(skillName, -1)}
                        sx={{ color: '#FF6B6B' }}
                        size="small"
                      >
                        <RemoveCircle fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => adjustSkillLevel(skillName, 1)}
                        sx={{ color: '#00FF88' }}
                        size="small"
                      >
                        <AddCircle fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: 'rgba(0, 212, 255, 0.3)' }} />
        </Paper>
      )}
    </Box>
  );
};

export default Admin;

