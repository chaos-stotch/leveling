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
  useTheme,
} from '@mui/material';
import { CheckCircle, PlayArrow, Timer, Delete, ErrorOutline, DragIndicator, Visibility, Close, Pause, Stop, Add, Remove } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getTasks, saveTasks, getProgressiveTasks, saveProgressiveTasks, getTimeTasks, saveTimeTasks, getCompletedTasks, saveCompletedTasks, addCompletedTask, removeCompletedTask } from '../utils/storage';
import { useSound } from '../hooks/useSound';

import { addXP } from '../utils/levelSystem';
import { saveNotification, addGold } from '../utils/storage';

// Função para calcular recompensas baseado em ciclos (usado tanto para progressivas quanto para ciclos manuais)
const calculateCycleRewards = (task, cycles) => {
  if (task.type !== 'progressive' && task.type !== 'cycle') return { xp: 0, gold: 0, intervals: 0 };
  
  // Validar e limitar valores de entrada
  if (!cycles || cycles < 0 || !isFinite(cycles)) {
    return { xp: 0, gold: 0, intervals: 0 };
  }
  
  const cyclesCount = Math.floor(cycles);
  
  if (cyclesCount === 0 || cyclesCount > 10000) { // Limitar a 10000 ciclos para evitar overflow
    return { xp: 0, gold: 0, intervals: 0 };
  }
  
  let totalXp = 0;
  let totalGold = 0;
  const baseXp = Math.max(0, task.baseXp || 1);
  const baseGold = Math.max(0, task.baseGold || 0);
  const formula = task.formula || 'linear';
  const multiplier = Math.max(0.01, Math.min(100, task.formulaMultiplier || 1)); // Limitar multiplicador
  
  for (let i = 1; i <= cyclesCount; i++) {
    let intervalMultiplier = 1;
    if (formula === 'linear') {
      intervalMultiplier = i;
    } else if (formula === 'exponential') {
      intervalMultiplier = Math.pow(2, Math.min(i - 1, 20)); // Limitar exponencial
    } else if (formula === 'quadratic') {
      intervalMultiplier = i * i;
    }
    intervalMultiplier *= multiplier;
    
    const xpGain = Math.floor(baseXp * intervalMultiplier);
    const goldGain = Math.floor(baseGold * intervalMultiplier);
    
    // Limitar valores individuais para evitar overflow
    totalXp = Math.min(totalXp + xpGain, 2147483647); // Max int32
    totalGold = Math.min(totalGold + goldGain, 2147483647);
  }
  
  return { xp: totalXp, gold: totalGold, intervals: cyclesCount };
};

// Função para calcular recompensas acumuladas de tarefa progressiva
const calculateProgressiveRewards = (task, elapsedSeconds) => {
  if (task.type !== 'progressive') return { xp: 0, gold: 0, intervals: 0 };
  
  // Validar e limitar valores de entrada
  if (!elapsedSeconds || elapsedSeconds < 0 || !isFinite(elapsedSeconds)) {
    return { xp: 0, gold: 0, intervals: 0 };
  }
  
  const intervalSeconds = task.intervalSeconds || 300;
  if (intervalSeconds <= 0 || !isFinite(intervalSeconds)) {
    return { xp: 0, gold: 0, intervals: 0 };
  }
  
  const intervals = Math.floor(elapsedSeconds / intervalSeconds);
  return calculateCycleRewards(task, intervals);
};

// Componente para item de tarefa arrastável
const SortableTaskItem = ({
  task,
  onCompleteClick,
  onStartTimeTask,
  onFocusClick,
  isCompleted,
  isStarted,
  remaining,
  progress,
  formatTime,
  skillNames,
  onPauseProgressive,
  onStopProgressive,
  onStopTimeTask,
  progressiveElapsed,
  progressivePaused,
  progressiveRewards,
  cycleCount,
  onIncrementCycle,
  onDecrementCycle,
  onFinishCycle
}) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const titleTextShadow = theme.custom?.titleTextShadow || `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`;
  const textShadow = theme.custom?.textShadow || `0 0 5px ${primaryColor}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isTimeTask = task.type === 'time';
  const isProgressiveTask = task.type === 'progressive';
  const isCycleTask = task.type === 'cycle';

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      sx={{
        p: 2.5,
        mb: 2,
        backgroundColor: 'background.paper',
        border: isCompleted ? `1px solid ${secondaryColor}80` : `1px solid ${primaryColor}4D`,
        boxShadow: isCompleted
          ? `0 0 20px ${secondaryColor}33`
          : `0 0 20px ${primaryColor}1A`,
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative',
      }}
    >
      {/* Handle de arrastar */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          cursor: 'grab',
          color: textSecondary,
          opacity: 0.6,
          touchAction: 'none', // Só no handle para não interferir com cliques no card
          userSelect: 'none',
          '&:hover': {
            color: primaryColor,
            opacity: 1,
          },
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        <DragIndicator />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5, pr: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              flex: 1,
              color: isCompleted ? secondaryColor : textPrimary,
              textShadow: isCompleted ? `0 0 10px ${secondaryColor}` : textShadow,
              fontWeight: 600,
            }}
          >
            -{task.title.toUpperCase()}
          </Typography>
          {!isCompleted && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onFocusClick(task);
              }}
              size="small"
              sx={{
                color: textSecondary,
                opacity: 0.7,
                '&:hover': {
                  color: primaryColor,
                  opacity: 1,
                  backgroundColor: `${primaryColor}1A`,
                  boxShadow: `0 0 10px ${primaryColor}80`,
                },
              }}
            >
              <Visibility />
            </IconButton>
          )}
        </Box>
        {isCompleted && (
          <CheckCircle sx={{ color: secondaryColor, filter: `drop-shadow(0 0 5px ${secondaryColor})` }} />
        )}
      </Box>
      <Typography variant="body2" sx={{ mb: 2, color: textSecondary, lineHeight: 1.6 }}>
        {task.description}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {(isProgressiveTask || isCycleTask) ? (
          <>
            {(() => {
              const baseXp = task.baseXp || 1;
              const baseGold = task.baseGold || 0;
              
              if (isProgressiveTask) {
                const intervalSeconds = task.intervalSeconds || 300;
                const intervalMinutes = Math.floor(intervalSeconds / 60);
                return (
                  <>
                    <Chip
                      label={`${baseXp} XP a cada ${intervalMinutes}min`}
                      size="small"
                      sx={{
                        backgroundColor: `${primaryColor}33`,
                        color: textPrimary,
                        border: `1px solid ${primaryColor}80`,
                      }}
                    />
                    {baseGold > 0 && (
                      <Chip
                        label={`${baseGold} 🪙 a cada ${intervalMinutes}min`}
                        size="small"
                        sx={{
                          backgroundColor: '#FFD70033',
                          color: '#FFD700',
                          border: '1px solid #FFD70080',
                        }}
                      />
                    )}
                  </>
                );
              } else {
                return (
                  <>
                    <Chip
                      label={`${baseXp} XP por ciclo`}
                      size="small"
                      sx={{
                        backgroundColor: `${primaryColor}33`,
                        color: textPrimary,
                        border: `1px solid ${primaryColor}80`,
                      }}
                    />
                    {baseGold > 0 && (
                      <Chip
                        label={`${baseGold} 🪙 por ciclo`}
                        size="small"
                        sx={{
                          backgroundColor: '#FFD70033',
                          color: '#FFD700',
                          border: '1px solid #FFD70080',
                        }}
                      />
                    )}
                  </>
                );
              }
            })()}
          </>
        ) : (
          <>
            <Chip
              label={`${task.xp} XP`}
              size="small"
              sx={{
                backgroundColor: `${primaryColor}33`,
                color: textPrimary,
                border: `1px solid ${primaryColor}80`,
              }}
            />
            {task.gold > 0 && (
              <Chip
                label={`${task.gold} 🪙`}
                size="small"
                sx={{
                  backgroundColor: '#FFD70033',
                  color: '#FFD700',
                  border: '1px solid #FFD70080',
                }}
              />
            )}
          </>
        )}
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
        {isTimeTask && (
          <Chip
            icon={<Timer sx={{ color: primaryColor }} />}
            label={`${task.duration}s`}
            size="small"
            sx={{
              backgroundColor: `${primaryColor}1A`,
              color: textSecondary,
              border: `1px solid ${primaryColor}4D`,
            }}
          />
        )}
        {isProgressiveTask && (
          <Chip
            icon={<Timer sx={{ color: primaryColor }} />}
            label={`${Math.floor((task.intervalSeconds || 300) / 60)}min/intervalo`}
            size="small"
            sx={{
              backgroundColor: `${primaryColor}1A`,
              color: textSecondary,
              border: `1px solid ${primaryColor}4D`,
            }}
          />
        )}
        {isCycleTask && (
          <Chip
            icon={<CheckCircle sx={{ color: primaryColor }} />}
            label="Ciclos Manuais"
            size="small"
            sx={{
              backgroundColor: `${primaryColor}1A`,
              color: textSecondary,
              border: `1px solid ${primaryColor}4D`,
            }}
          />
        )}
      </Box>
      {isTimeTask && isStarted && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, color: textPrimary, fontWeight: 600 }}>
            Tempo restante: {formatTime(remaining)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: `${primaryColor}1A`,
              '& .MuiLinearProgress-bar': {
                backgroundColor: primaryColor,
                boxShadow: `0 0 10px ${primaryColor}`,
              },
            }}
          />
        </Box>
      )}
      {isProgressiveTask && (isStarted || progressivePaused) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, color: textPrimary, fontWeight: 600 }}>
            Tempo ativo: {formatTime(progressiveElapsed || 0)}
            {progressivePaused && ' (Pausado)'}
          </Typography>
          {progressiveRewards && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ color: textSecondary }}>
                Recompensas acumuladas: {progressiveRewards.xp} XP + {progressiveRewards.gold} 🪙
                {progressiveRewards.intervals > 0 && ` (${progressiveRewards.intervals} intervalo${progressiveRewards.intervals > 1 ? 's' : ''})`}
              </Typography>
            </Box>
          )}
        </Box>
      )}
      {isCycleTask && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, color: textPrimary, fontWeight: 600 }}>
            Ciclos completados: {cycleCount || 0}
          </Typography>
          {(() => {
            const rewards = calculateCycleRewards(task, cycleCount || 0);
            if (rewards && rewards.xp > 0) {
              return (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ color: textSecondary }}>
                    Recompensas acumuladas: {rewards.xp} XP + {rewards.gold} 🪙
                    {rewards.intervals > 0 && ` (${rewards.intervals} ciclo${rewards.intervals > 1 ? 's' : ''})`}
                  </Typography>
                </Box>
              );
            }
            return null;
          })()}
        </Box>
      )}
      {!isCompleted && (
        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          {isCycleTask ? (
            <>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton
                    onClick={() => onDecrementCycle(task)}
                    disabled={(cycleCount || 0) <= 0}
                    sx={{
                      color: secondaryColor,
                      border: `2px solid ${secondaryColor}`,
                      '&:hover': {
                        backgroundColor: `${secondaryColor}1A`,
                      },
                      '&:disabled': {
                        opacity: 0.3,
                      },
                    }}
                  >
                    <Remove />
                  </IconButton>
                </motion.div>
                <Typography
                  variant="h6"
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    color: textPrimary,
                    fontWeight: 700,
                    minWidth: 60,
                  }}
                >
                  {cycleCount || 0}
                </Typography>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton
                    onClick={() => onIncrementCycle(task)}
                    sx={{
                      color: primaryColor,
                      border: `2px solid ${primaryColor}`,
                      '&:hover': {
                        backgroundColor: `${primaryColor}1A`,
                      },
                    }}
                  >
                    <Add />
                  </IconButton>
                </motion.div>
              </Box>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outlined"
                  startIcon={<CheckCircle />}
                  onClick={() => onFinishCycle(task)}
                  disabled={(cycleCount || 0) <= 0}
                  fullWidth
                  sx={{
                    borderColor: primaryColor,
                    color: textPrimary,
                    borderWidth: '2px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: primaryColor,
                      backgroundColor: `${primaryColor}1A`,
                      boxShadow: `0 0 20px ${primaryColor}80`,
                    },
                    '&:disabled': {
                      borderColor: textSecondary,
                      color: textSecondary,
                      opacity: 0.5,
                    },
                  }}
                >
                  Finalizar e Receber Recompensas
                </Button>
              </motion.div>
            </>
          ) : isProgressiveTask ? (
            <>
              {!isStarted && !progressivePaused ? (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrow />}
                    onClick={() => onStartTimeTask(task)}
                    fullWidth
                    sx={{
                      borderColor: primaryColor,
                      color: textPrimary,
                      borderWidth: '2px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: primaryColor,
                        backgroundColor: `${primaryColor}1A`,
                        boxShadow: `0 0 20px ${primaryColor}80`,
                      },
                    }}
                  >
                    Iniciar Tarefa
                  </Button>
                </motion.div>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!progressivePaused ? (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Pause />}
                        onClick={() => onPauseProgressive(task)}
                        fullWidth
                        sx={{
                          borderColor: primaryColor,
                          color: textPrimary,
                          borderWidth: '2px',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: primaryColor,
                            backgroundColor: `${primaryColor}1A`,
                            boxShadow: `0 0 20px ${primaryColor}80`,
                          },
                        }}
                      >
                        Pausar
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<PlayArrow />}
                        onClick={() => onStartTimeTask(task)}
                        fullWidth
                        sx={{
                          borderColor: primaryColor,
                          color: textPrimary,
                          borderWidth: '2px',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: primaryColor,
                            backgroundColor: `${primaryColor}1A`,
                            boxShadow: `0 0 20px ${primaryColor}80`,
                          },
                        }}
                      >
                        Retomar
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Stop />}
                      onClick={() => onStopProgressive(task)}
                      fullWidth
                      sx={{
                        borderColor: secondaryColor,
                        color: secondaryColor,
                        borderWidth: '2px',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: secondaryColor,
                          backgroundColor: `${secondaryColor}1A`,
                          boxShadow: `0 0 20px ${secondaryColor}80`,
                        },
                      }}
                    >
                      Parar
                    </Button>
                  </motion.div>
                </Box>
              )}
            </>
          ) : isTimeTask ? (
            <>
              {!isStarted ? (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrow />}
                    onClick={() => onStartTimeTask(task)}
                    fullWidth
                    sx={{
                      borderColor: primaryColor,
                      color: textPrimary,
                      borderWidth: '2px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: primaryColor,
                        backgroundColor: `${primaryColor}1A`,
                        boxShadow: `0 0 20px ${primaryColor}80`,
                      },
                    }}
                  >
                    Iniciar Tarefa
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Stop />}
                    onClick={() => onStopTimeTask(task)}
                    fullWidth
                    sx={{
                      borderColor: secondaryColor,
                      color: secondaryColor,
                      borderWidth: '2px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: secondaryColor,
                        backgroundColor: `${secondaryColor}1A`,
                        boxShadow: `0 0 20px ${secondaryColor}80`,
                      },
                    }}
                  >
                    Parar Tarefa
                  </Button>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outlined"
                startIcon={<CheckCircle />}
                onClick={() => onCompleteClick(task)}
                fullWidth
                sx={{
                  borderColor: primaryColor,
                  color: textPrimary,
                  borderWidth: '2px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: primaryColor,
                    backgroundColor: `${primaryColor}1A`,
                    boxShadow: `0 0 20px ${primaryColor}80`,
                  },
                }}
              >
                Concluir Tarefa
              </Button>
            </motion.div>
          )}
        </Box>
      )}
    </Paper>
  );
};

const Tasks = ({ onTaskComplete }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const titleTextShadow = theme.custom?.titleTextShadow || `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`;
  const textShadow = theme.custom?.textShadow || `0 0 5px ${primaryColor}`;
  
  const [tasks, setTasks] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, task: null });
  const [confirmText, setConfirmText] = useState('');
  const [activeTimers, setActiveTimers] = useState({});
  const [completedTasks, setCompletedTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [focusedTask, setFocusedTask] = useState(null);
  const [progressiveTasks, setProgressiveTasks] = useState({}); // { taskId: { startedAt, pausedAt, totalElapsed, paused } }
  const [cycleTasks, setCycleTasks] = useState({}); // { taskId: { cycles: number } }
  const [stopTimeTaskDialog, setStopTimeTaskDialog] = useState({ open: false, task: null });
  const [stopProgressiveDialog, setStopProgressiveDialog] = useState({ open: false, task: null, rewards: null });
  const { playSound } = useSound();

  // Configuração dos sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Distância mínima menor para desktop
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Delay menor para mobile
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTasks();
    loadCompletedTasks();
    loadProgressiveTasks();
    loadTimeTasks();
    loadCycleTasks();
  }, []);

  const loadCycleTasks = () => {
    const saved = localStorage.getItem('leveling_cycle_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCycleTasks(parsed);
      } catch (e) {
        console.error('Erro ao carregar tarefas por ciclos:', e);
        setCycleTasks({});
      }
    }
  };

  const saveCycleTasks = (cycles) => {
    localStorage.setItem('leveling_cycle_tasks', JSON.stringify(cycles));
  };

  const loadProgressiveTasks = () => {
    const saved = getProgressiveTasks();
    // Ajustar startedAt para o tempo atual se a tarefa estava rodando
    const now = Date.now();
    const adjusted = {};
    Object.keys(saved).forEach(taskId => {
      const taskState = saved[taskId];
      if (taskState && !taskState.paused && taskState.startedAt) {
        // Se estava rodando, calcular o tempo que passou desde o último save
        const lastSaved = taskState.lastSaved || taskState.startedAt;
        const elapsedSinceSave = Math.max(0, now - lastSaved);
        adjusted[taskId] = {
          ...taskState,
          startedAt: now, // Resetar startedAt para agora
          totalElapsed: (taskState.totalElapsed || 0) + elapsedSinceSave,
          lastSaved: now,
        };
      } else {
        adjusted[taskId] = taskState;
      }
    });
    setProgressiveTasks(adjusted);
    if (Object.keys(adjusted).length > 0) {
      saveProgressiveTasks(adjusted);
    }
  };

  const loadTimeTasks = () => {
    const saved = getTimeTasks();
    const allTasks = getTasks();
    const timers = {};
    const updatedTasks = [...allTasks];
    let needsSave = false;

    allTasks.forEach((task, index) => {
      if (task.type === 'time' && saved[task.id] && saved[task.id].startedAt) {
        const startedAt = new Date(saved[task.id].startedAt).getTime();
        const elapsed = Date.now() - startedAt;
        const remaining = task.duration * 1000 - elapsed;
        
        if (remaining > 0) {
          // Tarefa ainda está rodando
          timers[task.id] = remaining;
          if (!task.startedAt) {
            updatedTasks[index] = { ...task, startedAt: saved[task.id].startedAt };
            needsSave = true;
          }
        } else {
          // Tarefa já completou, limpar estado
          delete saved[task.id];
          needsSave = true;
        }
      }
    });

    if (needsSave) {
      saveTimeTasks(saved);
      if (updatedTasks.some((t, i) => t.startedAt !== allTasks[i]?.startedAt)) {
        saveTasks(updatedTasks);
        setTasks(updatedTasks);
      }
    }

    setActiveTimers(timers);
  };

  const loadTasks = () => {
    const allTasks = getTasks();

    // Adicionar tarefas de teste se não houver nenhuma
    if (allTasks.length === 0) {
      const testTasks = [
        {
          id: 'test-common-1',
          title: 'Tarefa Comum 1',
          description: 'Esta é uma tarefa comum de teste.',
          type: 'common',
          xp: 10,
          skills: ['strength'],
          active: true,
        },
        {
          id: 'test-common-2',
          title: 'Tarefa Comum 2',
          description: 'Esta é outra tarefa comum de teste.',
          type: 'common',
          xp: 15,
          skills: ['intelligence'],
          active: true,
        },
        {
          id: 'test-common-3',
          title: 'Tarefa Comum 3',
          description: 'Mais uma tarefa comum de teste.',
          type: 'common',
          xp: 20,
          skills: ['persistence'],
          active: true,
        },
        {
          id: 'test-time-1',
          title: 'Tarefa por Tempo 1',
          description: 'Esta é uma tarefa por tempo de teste.',
          type: 'time',
          xp: 25,
          skills: ['vitality'],
          duration: 30,
          active: true,
        },
        {
          id: 'test-time-2',
          title: 'Tarefa por Tempo 2',
          description: 'Esta é outra tarefa por tempo de teste.',
          type: 'time',
          xp: 30,
          skills: ['agility'],
          duration: 45,
          active: true,
        },
      ];
      saveTasks(testTasks);
      setTasks(testTasks);
    } else {
      setTasks(allTasks);
    }
  };

  const loadCompletedTasks = () => {
    const completed = getCompletedTasks();
    // Garantir que todos os IDs estão normalizados como string
    const normalized = completed.map(id => String(id));
    setCompletedTasks(normalized);
  };
  
  // Função auxiliar para verificar se uma tarefa está concluída (normalizando IDs)
  const isTaskCompleted = (taskId) => {
    const taskIdStr = String(taskId);
    return completedTasks.some(id => String(id) === taskIdStr);
  };

  // Funções para drag and drop
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTasks((items) => {
        const activeTask = items.find(t => t.id === active.id);
        const overTask = items.find(t => t.id === over.id);

        // Verificar se ambas as tarefas existem e são do mesmo tipo
        if (!activeTask || !overTask || activeTask.type !== overTask.type) {
          return items;
        }

        // Obter todos os índices das tarefas da categoria
        const categoryIndices = items
          .map((task, index) => ({ task, index }))
          .filter(({ task }) => task.type === activeTask.type && task.active !== false)
          .sort((a, b) => a.index - b.index); // Manter ordem atual

        const activeCategoryIndex = categoryIndices.findIndex(({ task }) => task.id === active.id);
        const overCategoryIndex = categoryIndices.findIndex(({ task }) => task.id === over.id);

        if (activeCategoryIndex === -1 || overCategoryIndex === -1) {
          return items;
        }

        // Obter apenas as tarefas da categoria na ordem atual
        const categoryTasks = categoryIndices.map(({ task }) => task);

        // Reordenar apenas dentro da categoria
        const reorderedCategoryTasks = arrayMove(categoryTasks, activeCategoryIndex, overCategoryIndex);

        // Criar novo array com a ordem atualizada
        const newTasks = [...items];
        let categoryIndex = 0;

        // Substituir as tarefas da categoria com a nova ordem
        for (let i = 0; i < newTasks.length; i++) {
          if (newTasks[i].type === activeTask.type && newTasks[i].active !== false) {
            newTasks[i] = reorderedCategoryTasks[categoryIndex++];
          }
        }

        // Salvar a nova ordem
        saveTasks(newTasks);
        return newTasks;
      });
    }

    setActiveId(null);
  };

  useEffect(() => {
    const checkTimers = () => {
      const allTasks = getTasks();
      const timers = {};
      let needsUpdate = false;
      
      allTasks.forEach((task) => {
        if (task.type === 'time' && task.startedAt) {
          const elapsed = Date.now() - new Date(task.startedAt).getTime();
          const remaining = task.duration * 1000 - elapsed;
          if (remaining > 0) {
            timers[task.id] = remaining;
            // Atualizar focusedTask se for a tarefa em foco
            if (focusedTask && focusedTask.id === task.id) {
              setFocusedTask({ ...task });
            }
          } else {
            // Completar tarefa por tempo automaticamente
            const skills = task.skills
              ? (Array.isArray(task.skills) ? task.skills : [task.skills])
              : (task.skill ? [task.skill] : null);
            addXP(task.xp, skills, playSound);

            // Tocar som de timer do microondas
            playSound('microwave-timer');

            // Marcar tarefa como concluída permanentemente
            addCompletedTask(task.id);
            const taskIdStr = String(task.id);
            setCompletedTasks(prev => {
              const exists = prev.some(id => String(id) === taskIdStr);
              return exists ? prev : [...prev, taskIdStr];
            });

            // Resetar estado da tarefa (remover startedAt)
            const updatedTasks = allTasks.map((t) =>
              t.id === task.id ? { ...t, startedAt: null } : t
            );
            saveTasks(updatedTasks);
            setTasks(updatedTasks);

            // Fechar modal de foco se a tarefa focada foi concluída
            if (focusedTask && focusedTask.id === task.id) {
              setFocusedTask(null);
            }

            // Disparar evento para verificar títulos
            window.dispatchEvent(new CustomEvent('taskCompleted'));

            if (onTaskComplete) onTaskComplete();
            needsUpdate = true;
          }
        }
      });
      
      setActiveTimers(timers);
    };

    const interval = setInterval(checkTimers, 1000);
    return () => clearInterval(interval);
  }, [onTaskComplete, focusedTask]);

  // Atualizar estado das tarefas progressivas e salvar periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressiveTasks(prev => {
        const updated = { ...prev };
        let changed = false;
        const now = Date.now();
        Object.keys(updated).forEach(taskId => {
          if (updated[taskId] && !updated[taskId].paused) {
            // Atualizar lastSaved para persistência
            updated[taskId] = { ...updated[taskId], lastSaved: now };
            changed = true;
          }
        });
        if (changed) {
          saveProgressiveTasks(updated);
        }
        return changed ? updated : prev;
      });
    }, 5000); // Salvar a cada 5 segundos
    return () => clearInterval(interval);
  }, []);


  const startTimeTask = (task) => {
    if (task.type === 'progressive') {
      // Iniciar ou retomar tarefa progressiva
      const existing = progressiveTasks[task.id];
      const now = Date.now();
      let newState;
      
      if (existing && existing.paused) {
        // Retomar tarefa pausada
        newState = {
          ...existing,
          paused: false,
          startedAt: now,
          lastSaved: now,
        };
      } else {
        // Iniciar nova tarefa progressiva
        newState = {
          startedAt: now,
          paused: false,
          totalElapsed: 0,
          lastSaved: now,
        };
      }
      
      const updated = { ...progressiveTasks, [task.id]: newState };
      setProgressiveTasks(updated);
      saveProgressiveTasks(updated);
      playSound('vhs-startup');
    } else {
      // Tarefa por tempo normal
      const allTasks = getTasks();
      const startedAt = new Date().toISOString();
      const updatedTasks = allTasks.map((t) =>
        t.id === task.id ? { ...t, startedAt } : t
      );
      saveTasks(updatedTasks);
      setTasks(updatedTasks);
      setActiveTimers({ ...activeTimers, [task.id]: task.duration * 1000 });

      // Salvar estado da tarefa por tempo
      const timeTasksState = getTimeTasks();
      timeTasksState[task.id] = { startedAt };
      saveTimeTasks(timeTasksState);

      // Se a tarefa estiver focada, atualizar o estado para mostrar o timer
      if (focusedTask && focusedTask.id === task.id) {
        setFocusedTask({ ...task, startedAt });
      }

      // Tocar som de startup VHS
      playSound('vhs-startup');
    }
  };

  const pauseProgressiveTask = (task) => {
    const existing = progressiveTasks[task.id];
    if (existing && !existing.paused) {
      const now = Date.now();
      const elapsed = now - existing.startedAt;
      const newState = {
        ...existing,
        paused: true,
        pausedAt: now,
        totalElapsed: (existing.totalElapsed || 0) + elapsed,
        lastSaved: now,
      };
      const updated = { ...progressiveTasks, [task.id]: newState };
      setProgressiveTasks(updated);
      saveProgressiveTasks(updated);
    }
  };

  const stopProgressiveTask = (task) => {
    const existing = progressiveTasks[task.id];
    if (existing) {
      let totalElapsed = existing.totalElapsed || 0;
      if (!existing.paused && existing.startedAt) {
        const now = Date.now();
        const startedAt = typeof existing.startedAt === 'number' ? existing.startedAt : new Date(existing.startedAt).getTime();
        if (startedAt && now > startedAt) {
          totalElapsed += now - startedAt;
        }
      }
      const elapsedSeconds = Math.max(0, Math.floor(totalElapsed / 1000));
      const rewards = calculateProgressiveRewards(task, elapsedSeconds);
      setStopProgressiveDialog({ open: true, task, rewards });
    }
  };

  const confirmStopProgressive = () => {
    const { task, rewards } = stopProgressiveDialog;
    if (rewards && rewards.xp > 0) {
      const skills = task.skills
        ? (Array.isArray(task.skills) ? task.skills : [task.skills])
        : (task.skill ? [task.skill] : null);
      addXP(rewards.xp, skills, playSound);
      if (rewards.gold > 0) {
        addGold(rewards.gold);
      }
      playSound('success');
    }
    
    // Limpar estado da tarefa progressiva
    const updated = { ...progressiveTasks };
    delete updated[task.id];
    setProgressiveTasks(updated);
    saveProgressiveTasks(updated);
    
    setStopProgressiveDialog({ open: false, task: null, rewards: null });
    if (onTaskComplete) onTaskComplete();
  };

  const incrementCycle = (task) => {
    const current = cycleTasks[task.id] || { cycles: 0 };
    const updated = {
      ...cycleTasks,
      [task.id]: { cycles: (current.cycles || 0) + 1 },
    };
    setCycleTasks(updated);
    saveCycleTasks(updated);
  };

  const decrementCycle = (task) => {
    const current = cycleTasks[task.id];
    if (current && current.cycles > 0) {
      const updated = {
        ...cycleTasks,
        [task.id]: { cycles: current.cycles - 1 },
      };
      setCycleTasks(updated);
      saveCycleTasks(updated);
    }
  };

  const finishCycle = (task) => {
    const current = cycleTasks[task.id];
    if (!current || current.cycles <= 0) return;

    const rewards = calculateCycleRewards(task, current.cycles);
    if (rewards && rewards.xp > 0) {
      const skills = task.skills
        ? (Array.isArray(task.skills) ? task.skills : [task.skills])
        : (task.skill ? [task.skill] : null);
      addXP(rewards.xp, skills, playSound);
      if (rewards.gold > 0) {
        addGold(rewards.gold);
      }
      playSound('success');
    }

    // Resetar contador
    const updated = { ...cycleTasks };
    updated[task.id] = { cycles: 0 };
    setCycleTasks(updated);
    saveCycleTasks(updated);

    if (onTaskComplete) onTaskComplete();
  };

  const stopTimeTask = (task) => {
    setStopTimeTaskDialog({ open: true, task });
  };

  const confirmStopTimeTask = (markAsCompleted) => {
    const { task } = stopTimeTaskDialog;
    
    if (markAsCompleted) {
      // Aplicar recompensas
      const skills = task.skills
        ? (Array.isArray(task.skills) ? task.skills : [task.skills])
        : (task.skill ? [task.skill] : null);
      addXP(task.xp, skills, playSound);
      if (task.gold && task.gold > 0) {
        addGold(task.gold);
      }
      playSound('power-down');
      
      // Marcar como concluída
      addCompletedTask(task.id);
      const taskIdStr = String(task.id);
      setCompletedTasks(prev => {
        const exists = prev.some(id => String(id) === taskIdStr);
        return exists ? prev : [...prev, taskIdStr];
      });
      
      // Disparar evento para verificar títulos
      window.dispatchEvent(new CustomEvent('taskCompleted'));
    }
    
    // Resetar estado da tarefa
    const allTasks = getTasks();
    const updatedTasks = allTasks.map((t) =>
      t.id === task.id ? { ...t, startedAt: null } : t
    );
    saveTasks(updatedTasks);
    setTasks(updatedTasks);
    
    // Limpar timer e estado salvo
    const newTimers = { ...activeTimers };
    delete newTimers[task.id];
    setActiveTimers(newTimers);
    
    const timeTasksState = getTimeTasks();
    delete timeTasksState[task.id];
    saveTimeTasks(timeTasksState);
    
    // Fechar modal de foco se a tarefa focada foi parada
    if (focusedTask && focusedTask.id === task.id) {
      setFocusedTask(null);
    }
    
    setStopTimeTaskDialog({ open: false, task: null });
    if (onTaskComplete && markAsCompleted) onTaskComplete();
  };

  const handleCompleteClick = (task) => {
    setConfirmDialog({ open: true, task });
    setConfirmText('');
  };

  const handleFocusClick = (task) => {
    // Atualizar tarefa com estado atual se for progressiva ou por tempo
    if (task.type === 'progressive' && progressiveTasks[task.id]) {
      setFocusedTask({ ...task, progressiveState: progressiveTasks[task.id] });
    } else if (task.type === 'time' && task.startedAt) {
      setFocusedTask(task);
    } else {
      setFocusedTask(task);
    }
  };

  const handleCloseFocus = () => {
    setFocusedTask(null);
  };

  const handleConfirmComplete = () => {
    if (confirmText.trim().toLowerCase() === 'concluido') {
      const task = confirmDialog.task;

      // Templates são reutilizáveis - não marcar como concluídos permanentemente
      // Apenas dar XP e mostrar feedback

      // Compatibilidade: suporta tanto task.skills (array) quanto task.skill (string antiga)
      const skills = task.skills
        ? (Array.isArray(task.skills) ? task.skills : [task.skills])
        : (task.skill ? [task.skill] : null);
      addXP(task.xp, skills, playSound);
      
      // Adicionar ouro se a tarefa tiver ouro definido
      if (task.gold && task.gold > 0) {
        addGold(task.gold);
      }
            
            // Adicionar ouro se a tarefa tiver ouro definido
            if (task.gold && task.gold > 0) {
              addGold(task.gold);
            }

      // Tocar som de power down
      playSound('power-down');

      // Marcar tarefa como concluída permanentemente
      addCompletedTask(task.id);
      const taskIdStr = String(task.id);
      setCompletedTasks(prev => {
        const exists = prev.some(id => String(id) === taskIdStr);
        return exists ? prev : [...prev, taskIdStr];
      });

      // Resetar estado da tarefa (remover startedAt se for tarefa por tempo)
      if (task.type === 'time') {
        const allTasks = getTasks();
        const updatedTasks = allTasks.map((t) =>
          t.id === task.id ? { ...t, startedAt: null } : t
        );
        saveTasks(updatedTasks);
        setTasks(updatedTasks);
        // Limpar timer ativo se existir
        if (activeTimers[task.id]) {
          const newTimers = { ...activeTimers };
          delete newTimers[task.id];
          setActiveTimers(newTimers);
        }
      }

      setConfirmDialog({ open: false, task: null });
      setConfirmText('');
      
      // Disparar evento para verificar títulos
      window.dispatchEvent(new CustomEvent('taskCompleted'));
      
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

  const commonTasks = tasks.filter((t) => t.type === 'common' && t.active !== false);
  const timeTasks = tasks.filter((t) => t.type === 'time' && t.active !== false);
  const progressiveTasksList = tasks.filter((t) => t.type === 'progressive' && t.active !== false);
  const cycleTasksList = tasks.filter((t) => t.type === 'cycle' && t.active !== false);

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
          mb: 3,
          border: `1px solid ${primaryColor}4D`,
          p: 2,
        }}
      >
        <ErrorOutline sx={{ color: textPrimary, filter: `drop-shadow(0 0 5px ${primaryColor})` }} />
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: textPrimary,
            textShadow: titleTextShadow,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontSize: '1.5rem',
          }}
        >
          QUEST INFO
        </Typography>
      </Box>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            mb: 3,
            '& .MuiTabs-scrollButtons': {
              color: textSecondary,
              '&.Mui-disabled': {
                opacity: 0.3,
              },
            },
            '& .MuiTab-root': {
              color: textSecondary,
              opacity: 0.6,
              textTransform: 'uppercase',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              minWidth: 'auto',
              padding: '12px 16px',
              '&.Mui-selected': {
                color: textPrimary,
                opacity: 1,
                textShadow: titleTextShadow,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: primaryColor,
              boxShadow: `0 0 10px ${primaryColor}`,
              transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            },
          }}
        >
          <Tab label="Tarefas Comuns" />
          <Tab label="Tarefas por Tempo" />
          <Tab label="Tarefas Progressivas" />
          <Tab label="Tarefas por Ciclos" />
        </Tabs>
      </motion.div>

      <AnimatePresence mode="wait">
        {tabValue === 0 && (
          <motion.div
            key="common"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Box>
                {commonTasks.length === 0 ? (
                  <Typography sx={{ color: '#6B7A99', textAlign: 'center', py: 4 }}>
                    Nenhuma tarefa comum disponível
                  </Typography>
                ) : (
                  <SortableContext items={commonTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {commonTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <SortableTaskItem
                          task={task}
                          onCompleteClick={handleCompleteClick}
                          onStartTimeTask={startTimeTask}
                          onFocusClick={handleFocusClick}
                          isCompleted={isTaskCompleted(task.id)}
                          isStarted={task.startedAt && !isTaskCompleted(task.id)}
                          remaining={activeTimers[task.id] || 0}
                          progress={(task.startedAt && !isTaskCompleted(task.id))
                            ? ((task.duration * 1000 - (activeTimers[task.id] || 0)) / (task.duration * 1000)) * 100
                            : 0}
                          formatTime={formatTime}
                          skillNames={skillNames}
                          onPauseProgressive={pauseProgressiveTask}
                          onStopProgressive={stopProgressiveTask}
                          onStopTimeTask={stopTimeTask}
                          progressiveElapsed={0}
                          progressivePaused={false}
                          progressiveRewards={null}
                          cycleCount={cycleTasks[task.id]?.cycles || 0}
                          onIncrementCycle={incrementCycle}
                          onDecrementCycle={decrementCycle}
                          onFinishCycle={finishCycle}
                        />
                      </motion.div>
                    ))}
                  </SortableContext>
                )}
              </Box>
              <DragOverlay>
                {activeId ? (
                  <SortableTaskItem
                    task={tasks.find(t => t.id === activeId)}
                    onCompleteClick={() => {}}
                    onStartTimeTask={() => {}}
                    onFocusClick={() => {}}
                    isCompleted={isTaskCompleted(activeId)}
                    isStarted={false}
                    remaining={0}
                    progress={0}
                    formatTime={formatTime}
                    skillNames={skillNames}
                          onPauseProgressive={() => {}}
                          onStopProgressive={() => {}}
                          onStopTimeTask={() => {}}
                          progressiveElapsed={0}
                          progressivePaused={false}
                          progressiveRewards={null}
                          cycleCount={0}
                          onIncrementCycle={() => {}}
                          onDecrementCycle={() => {}}
                          onFinishCycle={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        )}

        {tabValue === 1 && (
          <motion.div
            key="time"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Box>
                {timeTasks.length === 0 ? (
                  <Typography sx={{ color: '#6B7A99', textAlign: 'center', py: 4 }}>
                    Nenhuma tarefa por tempo disponível
                  </Typography>
                ) : (
                  <SortableContext items={timeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {timeTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <SortableTaskItem
                          task={task}
                          onCompleteClick={handleCompleteClick}
                          onStartTimeTask={startTimeTask}
                          onFocusClick={handleFocusClick}
                          isCompleted={isTaskCompleted(task.id)}
                          isStarted={task.startedAt && !isTaskCompleted(task.id)}
                          remaining={activeTimers[task.id] || 0}
                          progress={(task.startedAt && !isTaskCompleted(task.id))
                            ? ((task.duration * 1000 - (activeTimers[task.id] || 0)) / (task.duration * 1000)) * 100
                            : 0}
                          formatTime={formatTime}
                          skillNames={skillNames}
                          onPauseProgressive={pauseProgressiveTask}
                          onStopProgressive={stopProgressiveTask}
                          onStopTimeTask={stopTimeTask}
                          progressiveElapsed={0}
                          progressivePaused={false}
                          progressiveRewards={null}
                          cycleCount={cycleTasks[task.id]?.cycles || 0}
                          onIncrementCycle={incrementCycle}
                          onDecrementCycle={decrementCycle}
                          onFinishCycle={finishCycle}
                        />
                      </motion.div>
                    ))}
                  </SortableContext>
                )}
              </Box>
              <DragOverlay>
                {activeId ? (
                  <SortableTaskItem
                    task={tasks.find(t => t.id === activeId)}
                    onCompleteClick={() => {}}
                    onStartTimeTask={() => {}}
                    onFocusClick={() => {}}
                    isCompleted={isTaskCompleted(activeId)}
                    isStarted={false}
                    remaining={0}
                    progress={0}
                    formatTime={formatTime}
                    skillNames={skillNames}
                          onPauseProgressive={() => {}}
                          onStopProgressive={() => {}}
                          onStopTimeTask={() => {}}
                          progressiveElapsed={0}
                          progressivePaused={false}
                          progressiveRewards={null}
                          cycleCount={0}
                          onIncrementCycle={() => {}}
                          onDecrementCycle={() => {}}
                          onFinishCycle={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        )}

        {tabValue === 2 && (
          <motion.div
            key="progressive"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Box>
                {progressiveTasksList.length === 0 ? (
                  <Typography sx={{ color: '#6B7A99', textAlign: 'center', py: 4 }}>
                    Nenhuma tarefa progressiva disponível
                  </Typography>
                ) : (
                  <SortableContext items={progressiveTasksList.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {progressiveTasksList.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <SortableTaskItem
                          task={task}
                          onCompleteClick={handleCompleteClick}
                          onStartTimeTask={startTimeTask}
                          onFocusClick={handleFocusClick}
                          isCompleted={isTaskCompleted(task.id)}
                          isStarted={progressiveTasks[task.id] && !progressiveTasks[task.id].paused}
                          remaining={0}
                          progress={0}
                          formatTime={formatTime}
                          skillNames={skillNames}
                          onPauseProgressive={pauseProgressiveTask}
                          onStopProgressive={stopProgressiveTask}
                          onStopTimeTask={stopTimeTask}
                          progressiveElapsed={(() => {
                            const existing = progressiveTasks[task.id];
                            if (!existing) return 0;
                            let total = existing.totalElapsed || 0;
                            if (!existing.paused && existing.startedAt) {
                              const now = Date.now();
                              const startedAt = typeof existing.startedAt === 'number' ? existing.startedAt : new Date(existing.startedAt).getTime();
                              if (startedAt && now > startedAt) {
                                total += now - startedAt;
                              }
                            }
                            return Math.max(0, total);
                          })()}
                          progressivePaused={progressiveTasks[task.id]?.paused || false}
                          progressiveRewards={(() => {
                            const existing = progressiveTasks[task.id];
                            if (!existing) return null;
                            let total = existing.totalElapsed || 0;
                            if (!existing.paused && existing.startedAt) {
                              const now = Date.now();
                              const startedAt = typeof existing.startedAt === 'number' ? existing.startedAt : new Date(existing.startedAt).getTime();
                              if (startedAt && now > startedAt) {
                                total += now - startedAt;
                              }
                            }
                            const elapsedSeconds = Math.max(0, Math.floor(total / 1000));
                            return calculateProgressiveRewards(task, elapsedSeconds);
                          })()}
                          cycleCount={cycleTasks[task.id]?.cycles || 0}
                          onIncrementCycle={incrementCycle}
                          onDecrementCycle={decrementCycle}
                          onFinishCycle={finishCycle}
                        />
                      </motion.div>
                    ))}
                  </SortableContext>
                )}
              </Box>
              <DragOverlay>
                {activeId ? (
                  <SortableTaskItem
                    task={tasks.find(t => t.id === activeId)}
                    onCompleteClick={() => {}}
                    onStartTimeTask={() => {}}
                    onFocusClick={() => {}}
                    isCompleted={isTaskCompleted(activeId)}
                    isStarted={false}
                    remaining={0}
                    progress={0}
                    formatTime={formatTime}
                    skillNames={skillNames}
                          onPauseProgressive={() => {}}
                          onStopProgressive={() => {}}
                          onStopTimeTask={() => {}}
                          progressiveElapsed={0}
                          progressivePaused={false}
                          progressiveRewards={null}
                          cycleCount={0}
                          onIncrementCycle={() => {}}
                          onDecrementCycle={() => {}}
                          onFinishCycle={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        )}

        {tabValue === 3 && (
          <motion.div
            key="cycle"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Box>
                {cycleTasksList.length === 0 ? (
                  <Typography sx={{ color: '#6B7A99', textAlign: 'center', py: 4 }}>
                    Nenhuma tarefa por ciclos disponível
                  </Typography>
                ) : (
                  <SortableContext items={cycleTasksList.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {cycleTasksList.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <SortableTaskItem
                          task={task}
                          onCompleteClick={handleCompleteClick}
                          onStartTimeTask={startTimeTask}
                          onFocusClick={handleFocusClick}
                          isCompleted={isTaskCompleted(task.id)}
                          isStarted={false}
                          remaining={0}
                          progress={0}
                          formatTime={formatTime}
                          skillNames={skillNames}
                          onPauseProgressive={() => {}}
                          onStopProgressive={() => {}}
                          onStopTimeTask={() => {}}
                          progressiveElapsed={0}
                          progressivePaused={false}
                          progressiveRewards={null}
                          cycleCount={cycleTasks[task.id]?.cycles || 0}
                          onIncrementCycle={incrementCycle}
                          onDecrementCycle={decrementCycle}
                          onFinishCycle={finishCycle}
                        />
                      </motion.div>
                    ))}
                  </SortableContext>
                )}
              </Box>
              <DragOverlay>
                {activeId ? (
                  <SortableTaskItem
                    task={tasks.find(t => t.id === activeId)}
                    onCompleteClick={() => {}}
                    onStartTimeTask={() => {}}
                    onFocusClick={() => {}}
                    isCompleted={isTaskCompleted(activeId)}
                    isStarted={false}
                    remaining={0}
                    progress={0}
                    formatTime={formatTime}
                    skillNames={skillNames}
                    onPauseProgressive={() => {}}
                    onStopProgressive={() => {}}
                    onStopTimeTask={() => {}}
                    progressiveElapsed={0}
                    progressivePaused={false}
                    progressiveRewards={null}
                    cycleCount={0}
                    onIncrementCycle={() => {}}
                    onDecrementCycle={() => {}}
                    onFinishCycle={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de foco fullscreen */}
      <Dialog
        open={focusedTask !== null}
        onClose={handleCloseFocus}
        fullScreen
        PaperProps={{
          component: motion.div,
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 },
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
          sx: {
            backgroundColor: 'background.default',
            backgroundImage: theme.palette.mode === 'dark' 
              ? `linear-gradient(135deg, ${primaryColor}08 0%, transparent 100%)`
              : 'none',
            m: 0,
            p: 0,
          },
        }}
      >
        {focusedTask && (
          <Box
            sx={{
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              p: 4,
              position: 'relative',
            }}
          >
            {/* Botão de fechar */}
            <IconButton
              onClick={handleCloseFocus}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: textSecondary,
                opacity: 0.7,
                '&:hover': {
                  color: textPrimary,
                  opacity: 1,
                  backgroundColor: `${primaryColor}1A`,
                  boxShadow: `0 0 15px ${primaryColor}80`,
                },
              }}
            >
              <Close />
            </IconButton>

            {/* Conteúdo da tarefa */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                maxWidth: '800px',
                mx: 'auto',
                width: '100%',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Paper
                  sx={{
                    p: 6,
                    backgroundColor: 'background.paper',
                    border: isTaskCompleted(focusedTask.id)
                      ? `2px solid ${theme.palette.secondary.main}80`
                      : `2px solid ${primaryColor}80`,
                    boxShadow: isTaskCompleted(focusedTask.id)
                      ? `0 0 40px ${theme.palette.secondary.main}33`
                      : `0 0 40px ${primaryColor}33`,
                    borderRadius: 4,
                  }}
                >
                  <Box sx={{ mb: 4, textAlign: 'center' }}>
                    {isTaskCompleted(focusedTask.id) && (
                      <CheckCircle
                        sx={{
                          color: theme.palette.secondary.main,
                          fontSize: 64,
                          mb: 2,
                          filter: `drop-shadow(0 0 10px ${theme.palette.secondary.main})`,
                        }}
                      />
                    )}
                    <Typography
                      variant="h3"
                      sx={{
                        color: isTaskCompleted(focusedTask.id)
                          ? theme.palette.secondary.main
                          : textPrimary,
                        textShadow: isTaskCompleted(focusedTask.id)
                          ? `0 0 20px ${theme.palette.secondary.main}`
                          : textShadow,
                        fontWeight: 700,
                        mb: 3,
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                      }}
                    >
                      {focusedTask.title}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: textSecondary,
                        lineHeight: 1.8,
                        mb: 4,
                        fontSize: '1.25rem',
                      }}
                    >
                      {focusedTask.description}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mb: 4 }}>
                    {(focusedTask.type === 'progressive' || focusedTask.type === 'cycle') ? (
                      <>
                        {(() => {
                          const baseXp = focusedTask.baseXp || 1;
                          const baseGold = focusedTask.baseGold || 0;
                          
                          if (focusedTask.type === 'progressive') {
                            const intervalSeconds = focusedTask.intervalSeconds || 300;
                            const intervalMinutes = Math.floor(intervalSeconds / 60);
                            return (
                              <>
                                <Chip
                                  label={`${baseXp} XP a cada ${intervalMinutes}min`}
                                  sx={{
                                    backgroundColor: `${primaryColor}33`,
                                    color: textPrimary,
                                    border: `1px solid ${primaryColor}80`,
                                    fontSize: '1rem',
                                    height: 40,
                                    px: 2,
                                  }}
                                />
                                {baseGold > 0 && (
                                  <Chip
                                    label={`${baseGold} 🪙 a cada ${intervalMinutes}min`}
                                    sx={{
                                      backgroundColor: '#FFD70033',
                                      color: '#FFD700',
                                      border: '1px solid #FFD70080',
                                      fontSize: '1rem',
                                      height: 40,
                                      px: 2,
                                    }}
                                  />
                                )}
                              </>
                            );
                          } else {
                            return (
                              <>
                                <Chip
                                  label={`${baseXp} XP por ciclo`}
                                  sx={{
                                    backgroundColor: `${primaryColor}33`,
                                    color: textPrimary,
                                    border: `1px solid ${primaryColor}80`,
                                    fontSize: '1rem',
                                    height: 40,
                                    px: 2,
                                  }}
                                />
                                {baseGold > 0 && (
                                  <Chip
                                    label={`${baseGold} 🪙 por ciclo`}
                                    sx={{
                                      backgroundColor: '#FFD70033',
                                      color: '#FFD700',
                                      border: '1px solid #FFD70080',
                                      fontSize: '1rem',
                                      height: 40,
                                      px: 2,
                                    }}
                                  />
                                )}
                              </>
                            );
                          }
                        })()}
                      </>
                    ) : (
                      <>
                        <Chip
                          label={`${focusedTask.xp} XP`}
                          sx={{
                            backgroundColor: `${primaryColor}33`,
                            color: textPrimary,
                            border: `1px solid ${primaryColor}80`,
                            fontSize: '1rem',
                            height: 40,
                            px: 2,
                          }}
                        />
                        {focusedTask.gold > 0 && (
                          <Chip
                            label={`${focusedTask.gold} 🪙`}
                            sx={{
                              backgroundColor: '#FFD70033',
                              color: '#FFD700',
                              border: '1px solid #FFD70080',
                              fontSize: '1rem',
                              height: 40,
                              px: 2,
                            }}
                          />
                        )}
                      </>
                    )}
                    {(() => {
                      const skills = focusedTask.skills
                        ? (Array.isArray(focusedTask.skills) ? focusedTask.skills : [focusedTask.skills])
                        : (focusedTask.skill ? [focusedTask.skill] : []);

                      return skills.map((skill) => (
                        <Chip
                          key={skill}
                          label={skillNames[skill]}
                          sx={{
                            backgroundColor: `${primaryColor}1A`,
                            color: textSecondary,
                            border: `1px solid ${primaryColor}4D`,
                            fontSize: '1rem',
                            height: 40,
                            px: 2,
                          }}
                        />
                      ));
                    })()}
                    {focusedTask.type === 'time' && (
                      <Chip
                        icon={<Timer sx={{ color: primaryColor }} />}
                        label={`${focusedTask.duration}s`}
                        sx={{
                          backgroundColor: `${primaryColor}1A`,
                          color: textSecondary,
                          border: `1px solid ${primaryColor}4D`,
                          fontSize: '1rem',
                          height: 40,
                          px: 2,
                        }}
                      />
                    )}
                    {focusedTask.type === 'progressive' && (() => {
                      const intervalSeconds = focusedTask.intervalSeconds || 300;
                      const intervalMinutes = Math.floor(intervalSeconds / 60);
                      return intervalMinutes > 0 ? (
                        <Chip
                          icon={<Timer sx={{ color: primaryColor }} />}
                          label={`${intervalMinutes}min/intervalo`}
                          sx={{
                            backgroundColor: `${primaryColor}1A`,
                            color: textSecondary,
                            border: `1px solid ${primaryColor}4D`,
                            fontSize: '1rem',
                            height: 40,
                            px: 2,
                          }}
                        />
                      ) : null;
                    })()}
                    {focusedTask.type === 'cycle' && (
                      <Chip
                        icon={<CheckCircle sx={{ color: primaryColor }} />}
                        label="Ciclos Manuais"
                        sx={{
                          backgroundColor: `${primaryColor}1A`,
                          color: textSecondary,
                          border: `1px solid ${primaryColor}4D`,
                          fontSize: '1rem',
                          height: 40,
                          px: 2,
                        }}
                      />
                    )}
                  </Box>

                  {focusedTask.type === 'time' &&
                    focusedTask.startedAt &&
                    !isTaskCompleted(focusedTask.id) && (
                      <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Typography
                            variant="h1"
                            sx={{
                              mb: 3,
                              color: primaryColor,
                              fontWeight: 900,
                              textAlign: 'center',
                              fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
                              textShadow: titleTextShadow,
                              fontFamily: 'monospace',
                              letterSpacing: '0.1em',
                            }}
                          >
                            {formatTime(activeTimers[focusedTask.id] || 0)}
                          </Typography>
                        </motion.div>
                        <LinearProgress
                          variant="determinate"
                          value={
                            ((focusedTask.duration * 1000 - (activeTimers[focusedTask.id] || 0)) /
                              (focusedTask.duration * 1000)) *
                            100
                          }
                          sx={{
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: `${primaryColor}1A`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: primaryColor,
                              boxShadow: `0 0 20px ${primaryColor}`,
                            },
                          }}
                        />
                      </Box>
                    )}

                  {focusedTask.type === 'progressive' &&
                    progressiveTasks[focusedTask.id] &&
                    !isTaskCompleted(focusedTask.id) && (
                      <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Typography
                            variant="h2"
                            sx={{
                              mb: 2,
                              color: primaryColor,
                              fontWeight: 900,
                              textAlign: 'center',
                              fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
                              textShadow: titleTextShadow,
                              fontFamily: 'monospace',
                              letterSpacing: '0.1em',
                            }}
                          >
                            {formatTime((() => {
                              const existing = progressiveTasks[focusedTask.id];
                              if (!existing) return 0;
                              let total = existing.totalElapsed || 0;
                              if (!existing.paused && existing.startedAt) {
                                const now = Date.now();
                                const startedAt = typeof existing.startedAt === 'number' ? existing.startedAt : new Date(existing.startedAt).getTime();
                                if (startedAt && now > startedAt) {
                                  total += now - startedAt;
                                }
                              }
                              return Math.max(0, total);
                            })())}
                          </Typography>
                          {(() => {
                            const existing = progressiveTasks[focusedTask.id];
                            if (!existing) return null;
                            let total = existing.totalElapsed || 0;
                            if (!existing.paused && existing.startedAt) {
                              const now = Date.now();
                              const startedAt = typeof existing.startedAt === 'number' ? existing.startedAt : new Date(existing.startedAt).getTime();
                              if (startedAt && now > startedAt) {
                                total += now - startedAt;
                              }
                            }
                            const elapsedSeconds = Math.floor(total / 1000);
                            if (elapsedSeconds <= 0) return null;
                            
                            const rewards = calculateProgressiveRewards(focusedTask, elapsedSeconds);
                            if (rewards && rewards.xp > 0) {
                              return (
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: textSecondary,
                                    mb: 2,
                                  }}
                                >
                                  Recompensas acumuladas: {rewards.xp} XP + {rewards.gold} 🪙
                                  {rewards.intervals > 0 && ` (${rewards.intervals} intervalo${rewards.intervals > 1 ? 's' : ''})`}
                                </Typography>
                              );
                            }
                            return null;
                          })()}
                        </motion.div>
                      </Box>
                    )}

                  {focusedTask.type === 'cycle' &&
                    !isTaskCompleted(focusedTask.id) && (
                      <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Typography
                            variant="h1"
                            sx={{
                              mb: 2,
                              color: primaryColor,
                              fontWeight: 900,
                              textAlign: 'center',
                              fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
                              textShadow: titleTextShadow,
                              fontFamily: 'monospace',
                              letterSpacing: '0.1em',
                            }}
                          >
                            {cycleTasks[focusedTask.id]?.cycles || 0}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              color: textSecondary,
                              mb: 2,
                            }}
                          >
                            Ciclos Completados
                          </Typography>
                          {(() => {
                            const cycles = cycleTasks[focusedTask.id]?.cycles || 0;
                            if (cycles <= 0) return null;
                            const rewards = calculateCycleRewards(focusedTask, cycles);
                            if (rewards && rewards.xp > 0) {
                              return (
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: textSecondary,
                                    mb: 2,
                                  }}
                                >
                                  Recompensas: {rewards.xp} XP + {rewards.gold} 🪙
                                </Typography>
                              );
                            }
                            return null;
                          })()}
                        </motion.div>
                      </Box>
                    )}

                  {!isTaskCompleted(focusedTask.id) && (
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                      {focusedTask.type === 'cycle' ? (
                        <>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <IconButton
                                onClick={() => {
                                  decrementCycle(focusedTask);
                                }}
                                disabled={(cycleTasks[focusedTask.id]?.cycles || 0) <= 0}
                                sx={{
                                  color: secondaryColor,
                                  border: `2px solid ${secondaryColor}`,
                                  fontSize: '2rem',
                                  width: 64,
                                  height: 64,
                                  '&:hover': {
                                    backgroundColor: `${secondaryColor}1A`,
                                  },
                                  '&:disabled': {
                                    opacity: 0.3,
                                  },
                                }}
                              >
                                <Remove />
                              </IconButton>
                            </motion.div>
                            <Typography
                              variant="h3"
                              sx={{
                                flex: 1,
                                textAlign: 'center',
                                color: textPrimary,
                                fontWeight: 700,
                                minWidth: 100,
                              }}
                            >
                              {cycleTasks[focusedTask.id]?.cycles || 0}
                            </Typography>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <IconButton
                                onClick={() => {
                                  incrementCycle(focusedTask);
                                }}
                                sx={{
                                  color: primaryColor,
                                  border: `2px solid ${primaryColor}`,
                                  fontSize: '2rem',
                                  width: 64,
                                  height: 64,
                                  '&:hover': {
                                    backgroundColor: `${primaryColor}1A`,
                                  },
                                }}
                              >
                                <Add />
                              </IconButton>
                            </motion.div>
                          </Box>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="outlined"
                              startIcon={<CheckCircle />}
                              onClick={() => {
                                finishCycle(focusedTask);
                              }}
                              disabled={(cycleTasks[focusedTask.id]?.cycles || 0) <= 0}
                              fullWidth
                              size="large"
                              sx={{
                                borderColor: primaryColor,
                                color: textPrimary,
                                borderWidth: '2px',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                py: 2,
                                '&:hover': {
                                  borderColor: primaryColor,
                                  backgroundColor: `${primaryColor}1A`,
                                  boxShadow: `0 0 20px ${primaryColor}80`,
                                },
                                '&:disabled': {
                                  borderColor: textSecondary,
                                  color: textSecondary,
                                  opacity: 0.5,
                                },
                              }}
                            >
                              Finalizar e Receber Recompensas
                            </Button>
                          </motion.div>
                        </>
                      ) : focusedTask.type === 'progressive' ? (
                        <>
                          {!progressiveTasks[focusedTask.id] || progressiveTasks[focusedTask.id].paused ? (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="outlined"
                                startIcon={<PlayArrow />}
                                onClick={() => {
                                  startTimeTask(focusedTask);
                                }}
                                fullWidth
                                size="large"
                                sx={{
                                  borderColor: primaryColor,
                                  color: textPrimary,
                                  borderWidth: '2px',
                                  textTransform: 'uppercase',
                                  fontWeight: 600,
                                  fontSize: '1.1rem',
                                  py: 2,
                                  '&:hover': {
                                    borderColor: primaryColor,
                                    backgroundColor: `${primaryColor}1A`,
                                    boxShadow: `0 0 20px ${primaryColor}80`,
                                  },
                                }}
                              >
                                {progressiveTasks[focusedTask.id]?.paused ? 'Retomar' : 'Iniciar Tarefa'}
                              </Button>
                            </motion.div>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                                <Button
                                  variant="outlined"
                                  startIcon={<Pause />}
                                  onClick={() => {
                                    pauseProgressiveTask(focusedTask);
                                  }}
                                  fullWidth
                                  size="large"
                                  sx={{
                                    borderColor: primaryColor,
                                    color: textPrimary,
                                    borderWidth: '2px',
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    py: 2,
                                    '&:hover': {
                                      borderColor: primaryColor,
                                      backgroundColor: `${primaryColor}1A`,
                                      boxShadow: `0 0 20px ${primaryColor}80`,
                                    },
                                  }}
                                >
                                  Pausar
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                                <Button
                                  variant="outlined"
                                  startIcon={<Stop />}
                                  onClick={() => {
                                    stopProgressiveTask(focusedTask);
                                  }}
                                  fullWidth
                                  size="large"
                                  sx={{
                                    borderColor: secondaryColor,
                                    color: secondaryColor,
                                    borderWidth: '2px',
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    py: 2,
                                    '&:hover': {
                                      borderColor: secondaryColor,
                                      backgroundColor: `${secondaryColor}1A`,
                                      boxShadow: `0 0 20px ${secondaryColor}80`,
                                    },
                                  }}
                                >
                                  Parar
                                </Button>
                              </motion.div>
                            </Box>
                          )}
                        </>
                      ) : focusedTask.type === 'time' ? (
                        <>
                          {!focusedTask.startedAt || isTaskCompleted(focusedTask.id) ? (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="outlined"
                                startIcon={<PlayArrow />}
                                onClick={() => {
                                  startTimeTask(focusedTask);
                                }}
                                fullWidth
                                size="large"
                                sx={{
                                  borderColor: primaryColor,
                                  color: textPrimary,
                                  borderWidth: '2px',
                                  textTransform: 'uppercase',
                                  fontWeight: 600,
                                  fontSize: '1.1rem',
                                  py: 2,
                                  '&:hover': {
                                    borderColor: primaryColor,
                                    backgroundColor: `${primaryColor}1A`,
                                    boxShadow: `0 0 20px ${primaryColor}80`,
                                  },
                                }}
                              >
                                Iniciar Tarefa
                              </Button>
                            </motion.div>
                          ) : (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="outlined"
                                startIcon={<Stop />}
                                onClick={() => {
                                  stopTimeTask(focusedTask);
                                }}
                                fullWidth
                                size="large"
                                sx={{
                                  borderColor: secondaryColor,
                                  color: secondaryColor,
                                  borderWidth: '2px',
                                  textTransform: 'uppercase',
                                  fontWeight: 600,
                                  fontSize: '1.1rem',
                                  py: 2,
                                  '&:hover': {
                                    borderColor: secondaryColor,
                                    backgroundColor: `${secondaryColor}1A`,
                                    boxShadow: `0 0 20px ${secondaryColor}80`,
                                  },
                                }}
                              >
                                Parar Tarefa
                              </Button>
                            </motion.div>
                          )}
                        </>
                      ) : (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outlined"
                            startIcon={<CheckCircle />}
                            onClick={() => {
                              handleCloseFocus();
                              handleCompleteClick(focusedTask);
                            }}
                            fullWidth
                            size="large"
                            sx={{
                              borderColor: primaryColor,
                              color: textPrimary,
                              borderWidth: '2px',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              fontSize: '1.1rem',
                              py: 2,
                              '&:hover': {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}1A`,
                                boxShadow: `0 0 20px ${primaryColor}80`,
                              },
                            }}
                          >
                            Concluir Tarefa
                          </Button>
                        </motion.div>
                      )}
                    </Box>
                  )}
                </Paper>
              </motion.div>
            </Box>
          </Box>
        )}
      </Dialog>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, task: null })}
        PaperProps={{
          component: motion.div,
          initial: { opacity: 0, scale: 0.9, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.9, y: 20 },
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
          sx: {
            backgroundColor: 'background.paper',
            border: `2px solid ${primaryColor}80`,
            boxShadow: `0 0 30px ${primaryColor}4D`,
          },
        }}
      >
        <DialogTitle sx={{ color: textPrimary, textShadow: titleTextShadow, textTransform: 'uppercase' }}>
          Confirmar Conclusão
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: textSecondary }}>
            Digite "concluido" para confirmar que você completou a tarefa:
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: textPrimary, fontWeight: 600 }}>
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
                color: textPrimary,
                '& fieldset': {
                  borderColor: `${primaryColor}80`,
                },
                '&:hover fieldset': {
                  borderColor: `${primaryColor}CC`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: primaryColor,
                  boxShadow: `0 0 10px ${primaryColor}80`,
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, task: null })}
            sx={{ color: textSecondary, opacity: 0.7 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmComplete}
            variant="outlined"
            disabled={confirmText.trim().toLowerCase() !== 'concluido'}
            sx={{
              borderColor: primaryColor,
              color: textPrimary,
              '&:hover': {
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}1A`,
              },
              '&:disabled': {
                borderColor: textSecondary,
                color: textSecondary,
                opacity: 0.5,
              },
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para parar tarefa por tempo */}
      <Dialog
        open={stopTimeTaskDialog.open}
        onClose={() => setStopTimeTaskDialog({ open: false, task: null })}
        PaperProps={{
          component: motion.div,
          initial: { opacity: 0, scale: 0.9, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.9, y: 20 },
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
          sx: {
            backgroundColor: 'background.paper',
            border: `2px solid ${primaryColor}80`,
            boxShadow: `0 0 30px ${primaryColor}4D`,
          },
        }}
      >
        <DialogTitle sx={{ color: textPrimary, textShadow: titleTextShadow, textTransform: 'uppercase' }}>
          Parar Tarefa
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: textSecondary }}>
            Você está parando a tarefa: <strong>{stopTimeTaskDialog.task?.title}</strong>
          </Typography>
          <Typography sx={{ mb: 2, color: textSecondary }}>
            Deseja marcar esta tarefa como concluída e receber as recompensas?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setStopTimeTaskDialog({ open: false, task: null })}
            sx={{ color: textSecondary, opacity: 0.7 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => confirmStopTimeTask(false)}
            variant="outlined"
            sx={{
              borderColor: textSecondary,
              color: textSecondary,
              '&:hover': {
                borderColor: textSecondary,
                backgroundColor: `${textSecondary}1A`,
              },
            }}
          >
            Parar sem Concluir
          </Button>
          <Button
            onClick={() => confirmStopTimeTask(true)}
            variant="outlined"
            sx={{
              borderColor: primaryColor,
              color: textPrimary,
              '&:hover': {
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}1A`,
              },
            }}
          >
            Parar e Concluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para parar tarefa progressiva */}
      <Dialog
        open={stopProgressiveDialog.open}
        onClose={() => setStopProgressiveDialog({ open: false, task: null, rewards: null })}
        PaperProps={{
          component: motion.div,
          initial: { opacity: 0, scale: 0.9, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.9, y: 20 },
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
          sx: {
            backgroundColor: 'background.paper',
            border: `2px solid ${primaryColor}80`,
            boxShadow: `0 0 30px ${primaryColor}4D`,
          },
        }}
      >
        <DialogTitle sx={{ color: textPrimary, textShadow: titleTextShadow, textTransform: 'uppercase' }}>
          Parar Tarefa Progressiva
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: textSecondary }}>
            Você está parando a tarefa: <strong>{stopProgressiveDialog.task?.title}</strong>
          </Typography>
          {stopProgressiveDialog.rewards && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: `${primaryColor}0D`, borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: textPrimary, fontWeight: 600 }}>
                Recompensas Acumuladas:
              </Typography>
              <Typography sx={{ color: textPrimary }}>
                {stopProgressiveDialog.rewards.xp} XP
              </Typography>
              {stopProgressiveDialog.rewards.gold > 0 && (
                <Typography sx={{ color: '#FFD700' }}>
                  {stopProgressiveDialog.rewards.gold} 🪙
                </Typography>
              )}
              {stopProgressiveDialog.rewards.intervals > 0 && (
                <Typography variant="caption" sx={{ color: textSecondary }}>
                  ({stopProgressiveDialog.rewards.intervals} intervalo{stopProgressiveDialog.rewards.intervals > 1 ? 's' : ''} completado{stopProgressiveDialog.rewards.intervals > 1 ? 's' : ''})
                </Typography>
              )}
            </Box>
          )}
          <Typography sx={{ color: textSecondary }}>
            Deseja receber essas recompensas agora?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setStopProgressiveDialog({ open: false, task: null, rewards: null })}
            sx={{ color: textSecondary, opacity: 0.7 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmStopProgressive}
            variant="outlined"
            disabled={!stopProgressiveDialog.rewards || stopProgressiveDialog.rewards.xp === 0}
            sx={{
              borderColor: primaryColor,
              color: textPrimary,
              '&:hover': {
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}1A`,
              },
              '&:disabled': {
                borderColor: textSecondary,
                color: textSecondary,
                opacity: 0.5,
              },
            }}
          >
            Parar e Receber Recompensas
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;

