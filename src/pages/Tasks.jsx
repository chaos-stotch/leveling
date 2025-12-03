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
import { CheckCircle, PlayArrow, Timer, Delete, ErrorOutline, DragIndicator, Visibility, Close } from '@mui/icons-material';
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
import { getTasks, saveTasks } from '../utils/storage';
import { useSound } from '../hooks/useSound';

// Chaves para localStorage
const COMPLETED_TASKS_KEY = 'leveling_completed_tasks';

// Funções auxiliares para gerenciar tarefas concluídas
const getCompletedTasks = () => {
  const data = localStorage.getItem(COMPLETED_TASKS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveCompletedTasks = (completedTasks) => {
  localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(completedTasks));
};

const addCompletedTask = (taskId) => {
  const completedTasks = getCompletedTasks();
  if (!completedTasks.includes(taskId)) {
    completedTasks.push(taskId);
    saveCompletedTasks(completedTasks);
  }
};

const removeCompletedTask = (taskId) => {
  const completedTasks = getCompletedTasks();
  const filtered = completedTasks.filter(id => id !== taskId);
  saveCompletedTasks(filtered);
};
import { addXP } from '../utils/levelSystem';
import { saveNotification } from '../utils/storage';

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
  skillNames
}) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  
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
              textShadow: isCompleted ? `0 0 10px ${secondaryColor}` : `0 0 5px ${primaryColor}`,
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
      {!isCompleted && (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="outlined"
            startIcon={isTimeTask ? (isStarted ? <Timer /> : <PlayArrow />) : <CheckCircle />}
            onClick={() => (isTimeTask ? (isStarted ? null : onStartTimeTask(task)) : onCompleteClick(task))}
            disabled={isTimeTask && isStarted}
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
            {isTimeTask ? (isStarted ? 'Em andamento...' : 'Iniciar Tarefa') : 'Concluir Tarefa'}
          </Button>
        </motion.div>
      )}
    </Paper>
  );
};

const Tasks = ({ onTaskComplete }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  
  const [tasks, setTasks] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, task: null });
  const [confirmText, setConfirmText] = useState('');
  const [activeTimers, setActiveTimers] = useState({});
  const [completedTasks, setCompletedTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [focusedTask, setFocusedTask] = useState(null);
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
  }, []);

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
    setCompletedTasks(completed);
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
            setCompletedTasks(prev => [...prev, task.id]);

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


  const startTimeTask = (task) => {
    const allTasks = getTasks();
    const updatedTasks = allTasks.map((t) =>
      t.id === task.id ? { ...t, startedAt: new Date().toISOString() } : t
    );
    saveTasks(updatedTasks);
    setTasks(updatedTasks);
    setActiveTimers({ ...activeTimers, [task.id]: task.duration * 1000 });

    // Se a tarefa estiver focada, atualizar o estado para mostrar o timer
    if (focusedTask && focusedTask.id === task.id) {
      setFocusedTask({ ...task, startedAt: new Date().toISOString() });
    }

    // Tocar som de startup VHS
    playSound('vhs-startup');
  };

  const handleCompleteClick = (task) => {
    setConfirmDialog({ open: true, task });
    setConfirmText('');
  };

  const handleFocusClick = (task) => {
    setFocusedTask(task);
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

      // Tocar som de power down
      playSound('power-down');

      // Marcar tarefa como concluída permanentemente
      addCompletedTask(task.id);
      setCompletedTasks(prev => [...prev, task.id]);

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
            textShadow: `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`,
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
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              color: textSecondary,
              opacity: 0.6,
              textTransform: 'uppercase',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              '&.Mui-selected': {
                color: textPrimary,
                opacity: 1,
                textShadow: `0 0 10px ${primaryColor}`,
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
                          isCompleted={completedTasks.includes(task.id)}
                          isStarted={task.startedAt && !completedTasks.includes(task.id)}
                          remaining={activeTimers[task.id] || 0}
                          progress={(task.startedAt && !completedTasks.includes(task.id))
                            ? ((task.duration * 1000 - (activeTimers[task.id] || 0)) / (task.duration * 1000)) * 100
                            : 0}
                          formatTime={formatTime}
                          skillNames={skillNames}
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
                    isCompleted={completedTasks.includes(activeId)}
                    isStarted={false}
                    remaining={0}
                    progress={0}
                    formatTime={formatTime}
                    skillNames={skillNames}
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
                          isCompleted={completedTasks.includes(task.id)}
                          isStarted={task.startedAt && !completedTasks.includes(task.id)}
                          remaining={activeTimers[task.id] || 0}
                          progress={(task.startedAt && !completedTasks.includes(task.id))
                            ? ((task.duration * 1000 - (activeTimers[task.id] || 0)) / (task.duration * 1000)) * 100
                            : 0}
                          formatTime={formatTime}
                          skillNames={skillNames}
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
                    isCompleted={completedTasks.includes(activeId)}
                    isStarted={false}
                    remaining={0}
                    progress={0}
                    formatTime={formatTime}
                    skillNames={skillNames}
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
                    border: completedTasks.includes(focusedTask.id)
                      ? `2px solid ${theme.palette.secondary.main}80`
                      : `2px solid ${primaryColor}80`,
                    boxShadow: completedTasks.includes(focusedTask.id)
                      ? `0 0 40px ${theme.palette.secondary.main}33`
                      : `0 0 40px ${primaryColor}33`,
                    borderRadius: 4,
                  }}
                >
                  <Box sx={{ mb: 4, textAlign: 'center' }}>
                    {completedTasks.includes(focusedTask.id) && (
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
                        color: completedTasks.includes(focusedTask.id)
                          ? theme.palette.secondary.main
                          : textPrimary,
                        textShadow: completedTasks.includes(focusedTask.id)
                          ? `0 0 20px ${theme.palette.secondary.main}`
                          : `0 0 20px ${primaryColor}`,
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
                  </Box>

                  {focusedTask.type === 'time' &&
                    focusedTask.startedAt &&
                    !completedTasks.includes(focusedTask.id) && (
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
                              textShadow: `0 0 30px ${primaryColor}, 0 0 60px ${primaryColor}`,
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

                  {!completedTasks.includes(focusedTask.id) && (
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                      {focusedTask.type === 'time' &&
                        !(focusedTask.startedAt && !completedTasks.includes(focusedTask.id)) && (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
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
                        )}
                      {focusedTask.type === 'common' && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
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
        <DialogTitle sx={{ color: textPrimary, textShadow: `0 0 10px ${primaryColor}`, textTransform: 'uppercase' }}>
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
    </Box>
  );
};

export default Tasks;

