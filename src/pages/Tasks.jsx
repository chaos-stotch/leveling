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
import { CheckCircle, PlayArrow, Timer, Delete, ErrorOutline, DragIndicator } from '@mui/icons-material';
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

    // Tocar som de startup VHS
    playSound('vhs-startup');
  };

  const handleCompleteClick = (task) => {
    setConfirmDialog({ open: true, task });
    setConfirmText('');
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

