import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  LinearProgress,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { CheckCircle, PlayArrow, Timer, Delete, ErrorOutline } from '@mui/icons-material';
import { getTasks, saveTasks, getDailyTask, saveDailyTask } from '../utils/storage';
import { addXP } from '../utils/levelSystem';
import { saveNotification } from '../utils/storage';

const Tasks = ({ onTaskComplete }) => {
  const [tasks, setTasks] = useState([]);
  const [dailyTask, setDailyTask] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, task: null });
  const [confirmText, setConfirmText] = useState('');
  const [activeTimers, setActiveTimers] = useState({});

  useEffect(() => {
    loadTasks();
    loadDailyTask();
  }, []);

  const loadTasks = () => {
    const allTasks = getTasks();
    setTasks(allTasks);
  };

  const loadDailyTask = () => {
    const daily = getDailyTask();
    setDailyTask(daily);
  };

  useEffect(() => {
    const checkTimers = () => {
      const allTasks = getTasks();
      const timers = {};
      let needsUpdate = false;
      
      allTasks.forEach((task) => {
        if (task.type === 'time' && task.startedAt && !task.completed) {
          const elapsed = Date.now() - new Date(task.startedAt).getTime();
          const remaining = task.duration * 1000 - elapsed;
          if (remaining > 0) {
            timers[task.id] = remaining;
          } else {
            // Completar tarefa
            const updatedTasks = allTasks.map((t) =>
              t.id === task.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
            );
            saveTasks(updatedTasks);
            setTasks(updatedTasks);
            // Compatibilidade: suporta tanto task.skills (array) quanto task.skill (string antiga)
            const skills = task.skills
              ? (Array.isArray(task.skills) ? task.skills : [task.skills])
              : (task.skill ? [task.skill] : null);
            addXP(task.xp, skills);
            if (onTaskComplete) onTaskComplete();
            needsUpdate = true;
          }
        }
      });
      
      setActiveTimers(timers);
    };

    const interval = setInterval(checkTimers, 1000);
    return () => clearInterval(interval);
  }, [onTaskComplete]);


  const startTimeTask = (task) => {
    const allTasks = getTasks();
    const updatedTasks = allTasks.map((t) =>
      t.id === task.id ? { ...t, startedAt: new Date().toISOString() } : t
    );
    saveTasks(updatedTasks);
    setTasks(updatedTasks);
    setActiveTimers({ ...activeTimers, [task.id]: task.duration * 1000 });
  };

  const handleCompleteClick = (task) => {
    setConfirmDialog({ open: true, task });
    setConfirmText('');
  };

  const handleConfirmComplete = () => {
    if (confirmText.trim().toLowerCase() === 'concluido') {
      const task = confirmDialog.task;
      const allTasks = getTasks();
      const updatedTasks = allTasks.map((t) =>
        t.id === task.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
      );
      saveTasks(updatedTasks);
      setTasks(updatedTasks);

      if (task.isDailyTask) {
        saveDailyTask({ ...task, completed: true });
        setDailyTask({ ...task, completed: true });
      }

      // Compatibilidade: suporta tanto task.skills (array) quanto task.skill (string antiga)
      const skills = task.skills
        ? (Array.isArray(task.skills) ? task.skills : [task.skills])
        : (task.skill ? [task.skill] : null);
      addXP(task.xp, skills);
      setConfirmDialog({ open: false, task: null });
      setConfirmText('');
      if (onTaskComplete) onTaskComplete();
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const commonTasks = tasks.filter((t) => t.type === 'common' && !t.isDailyTask);
  const timeTasks = tasks.filter((t) => t.type === 'time' && !t.isDailyTask);

  const skillNames = {
    strength: 'Força',
    vitality: 'Vitalidade',
    agility: 'Agilidade',
    intelligence: 'Inteligência',
    persistence: 'Persistência',
  };

  const renderTask = (task) => {
    const isTimeTask = task.type === 'time';
    const isStarted = task.startedAt && !task.completed;
    const remaining = activeTimers[task.id] || 0;
    const progress = isStarted ? ((task.duration * 1000 - remaining) / (task.duration * 1000)) * 100 : 0;

    return (
      <Paper
        key={task.id}
        sx={{
          p: 2.5,
          mb: 2,
          backgroundColor: 'background.paper',
          border: task.completed ? '1px solid rgba(0, 255, 136, 0.5)' : '1px solid rgba(0, 212, 255, 0.3)',
          boxShadow: task.completed
            ? '0 0 20px rgba(0, 255, 136, 0.2)'
            : '0 0 20px rgba(0, 212, 255, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
          <Typography
            variant="h6"
            sx={{
              flex: 1,
              color: task.completed ? '#00FF88' : '#00D4FF',
              textShadow: task.completed ? '0 0 10px #00FF88' : '0 0 5px #00D4FF',
              fontWeight: 600,
            }}
          >
            -{task.title.toUpperCase()}
          </Typography>
          {task.completed && (
            <CheckCircle sx={{ color: '#00FF88', filter: 'drop-shadow(0 0 5px #00FF88)' }} />
          )}
        </Box>
        <Typography variant="body2" sx={{ mb: 2, color: '#B0E0FF', lineHeight: 1.6 }}>
          {task.description}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
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
          {isTimeTask && (
            <Chip
              icon={<Timer sx={{ color: '#00D4FF' }} />}
              label={`${task.duration}s`}
              size="small"
              sx={{
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                color: '#B0E0FF',
                border: '1px solid rgba(0, 212, 255, 0.3)',
              }}
            />
          )}
        </Box>
        {isTimeTask && isStarted && !task.completed && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, color: '#00D4FF', fontWeight: 600 }}>
              Tempo restante: {formatTime(remaining)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#00D4FF',
                  boxShadow: '0 0 10px #00D4FF',
                },
              }}
            />
          </Box>
        )}
        {!task.completed && (
          <Button
            variant="outlined"
            startIcon={isTimeTask ? (isStarted ? <Timer /> : <PlayArrow />) : <CheckCircle />}
            onClick={() => (isTimeTask ? (isStarted ? null : startTimeTask(task)) : handleCompleteClick(task))}
            disabled={isTimeTask && isStarted}
            fullWidth
            sx={{
              borderColor: '#00D4FF',
              color: '#00D4FF',
              borderWidth: '2px',
              textTransform: 'uppercase',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#00D4FF',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
              },
              '&:disabled': {
                borderColor: '#6B7A99',
                color: '#6B7A99',
              },
            }}
          >
            {isTimeTask ? (isStarted ? 'Em andamento...' : 'Iniciar Tarefa') : 'Concluir Tarefa'}
          </Button>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 3,
          border: '1px solid rgba(0, 212, 255, 0.3)',
          p: 2,
        }}
      >
        <ErrorOutline sx={{ color: '#00D4FF', filter: 'drop-shadow(0 0 5px #00D4FF)' }} />
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
          QUEST INFO
        </Typography>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(e, v) => setTabValue(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            color: '#6B7A99',
            textTransform: 'uppercase',
            fontWeight: 600,
            '&.Mui-selected': {
              color: '#00D4FF',
              textShadow: '0 0 10px #00D4FF',
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#00D4FF',
            boxShadow: '0 0 10px #00D4FF',
          },
        }}
      >
        <Tab label="Tarefas Comuns" />
        <Tab label="Tarefas por Tempo" />
        <Tab label="Tarefa Diária" />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          {commonTasks.length === 0 ? (
            <Typography sx={{ color: '#6B7A99', textAlign: 'center', py: 4 }}>
              Nenhuma tarefa comum disponível
            </Typography>
          ) : (
            commonTasks.map(renderTask)
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {timeTasks.length === 0 ? (
            <Typography sx={{ color: '#6B7A99', textAlign: 'center', py: 4 }}>
              Nenhuma tarefa por tempo disponível
            </Typography>
          ) : (
            timeTasks.map(renderTask)
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          {dailyTask ? (
            <Paper
              sx={{
                p: 3,
                mb: 2,
                backgroundColor: dailyTask.completed ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                border: dailyTask.completed
                  ? '2px solid rgba(0, 255, 136, 0.5)'
                  : '2px solid rgba(255, 0, 0, 0.5)',
                boxShadow: dailyTask.completed
                  ? '0 0 30px rgba(0, 255, 136, 0.3), inset 0 0 30px rgba(0, 255, 136, 0.05)'
                  : '0 0 30px rgba(255, 0, 0, 0.3), inset 0 0 30px rgba(255, 0, 0, 0.05)',
              }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: dailyTask.completed ? '#00FF88' : '#FF0000',
                  textShadow: dailyTask.completed
                    ? '0 0 10px #00FF88, 0 0 20px #00FF88'
                    : '0 0 10px #FF0000, 0 0 20px #FF0000',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                DAILY QUEST - {dailyTask.title.toUpperCase()}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: '#B0E0FF', lineHeight: 1.8 }}>
                {dailyTask.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label={`${dailyTask.xp} XP`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(0, 212, 255, 0.2)',
                    color: '#00D4FF',
                    border: '1px solid rgba(0, 212, 255, 0.5)',
                  }}
                />
                {(() => {
                  // Compatibilidade: suporta tanto dailyTask.skills (array) quanto dailyTask.skill (string antiga)
                  const skills = dailyTask.skills
                    ? (Array.isArray(dailyTask.skills) ? dailyTask.skills : [dailyTask.skills])
                    : (dailyTask.skill ? [dailyTask.skill] : []);
                  
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
              {!dailyTask.completed && (
                <>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 2,
                      color: '#FF0000',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      textShadow: '0 0 5px #FF0000',
                    }}
                  >
                    CAUTION! - IF THE DAILY QUEST REMAINS INCOMPLETE, PENALTIES WILL BE GIVEN ACCORDINGLY.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<CheckCircle />}
                    onClick={() => handleCompleteClick(dailyTask)}
                    fullWidth
                    sx={{
                      borderColor: '#FF0000',
                      color: '#FF0000',
                      borderWidth: '2px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#FF0000',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
                      },
                    }}
                  >
                    Concluir Tarefa Diária
                  </Button>
                </>
              )}
            </Paper>
          ) : (
            <Typography sx={{ color: '#6B7A99', textAlign: 'center', py: 4 }}>
              Nenhuma tarefa diária disponível
            </Typography>
          )}
        </Box>
      )}

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, task: null })}
        PaperProps={{
          sx: {
            backgroundColor: '#0f1629',
            border: '2px solid rgba(0, 212, 255, 0.5)',
            boxShadow: '0 0 30px rgba(0, 212, 255, 0.3)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#00D4FF', textShadow: '0 0 10px #00D4FF', textTransform: 'uppercase' }}>
          Confirmar Conclusão
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: '#B0E0FF' }}>
            Digite "concluido" para confirmar que você completou a tarefa:
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#00D4FF', fontWeight: 600 }}>
            {confirmDialog.task?.title}
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="concluido"
            autoFocus
            sx={{
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
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, task: null })}
            sx={{ color: '#6B7A99' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmComplete}
            variant="outlined"
            disabled={confirmText.trim().toLowerCase() !== 'concluido'}
            sx={{
              borderColor: '#00D4FF',
              color: '#00D4FF',
              '&:hover': {
                borderColor: '#00D4FF',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
              },
              '&:disabled': {
                borderColor: '#6B7A99',
                color: '#6B7A99',
              },
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;

