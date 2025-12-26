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
  Tabs,
  Tab,
} from '@mui/material';
import { Add, Delete, Edit, Palette, ShoppingCart, Category, DragIndicator, ArrowUpward, ArrowDownward, CloudUpload, CloudDownload, Storage, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { 
  getTasks, 
  saveTasks, 
  getPlayerData, 
  savePlayerData, 
  getSelectedTheme, 
  saveSelectedTheme,
  getShopItems,
  saveShopItems,
  getShopCategories,
  saveShopCategories,
  setGold,
  getPurchasedItems,
} from '../utils/storage';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  getSupabaseClient,
  saveProgressToCloud,
  loadProgressFromCloud,
  checkSyncStatus,
  getLastSave,
  getLastRestore,
} from '../utils/supabase';
import ConfirmDialog from '../components/ConfirmDialog';
import SyncConflictDialog from '../components/SyncConflictDialog';
import { themes } from '../themes';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
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
  const titleTextShadow = theme.custom?.titleTextShadow || `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`;
  const textShadow = theme.custom?.textShadow || `0 0 10px ${primaryColor}`;
  
  const [tasks, setTasks] = useState([]);
  const [playerData, setPlayerData] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(getSelectedTheme());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'common',
    xp: 10,
    gold: 0,
    skills: [],
    duration: 60,
    active: true,
  });
  const [editDialog, setEditDialog] = useState({ open: false, task: null });
  const [shopItems, setShopItems] = useState([]);
  const [shopCategories, setShopCategories] = useState([]);
  const [shopItemForm, setShopItemForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    category: 'default',
    price: 0,
    requiredLevel: 0,
    requiredTasks: [],
    requiresGold: true,
    requiresLevel: false,
    requiresTasks: false,
  });
  const [shopItemEditDialog, setShopItemEditDialog] = useState({ open: false, item: null });
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [activeShopCategoryId, setActiveShopCategoryId] = useState(null);
  const [adminTab, setAdminTab] = useState(0);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [supabaseForm, setSupabaseForm] = useState({
    url: '',
    anonKey: '',
    userId: '',
  });
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [syncConflictOpen, setSyncConflictOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState({ type: '', text: '' });

  // Sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sensores específicos para loja (otimizados para mobile)
  const shopSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Delay similar ao Tasks.jsx
        tolerance: 8, // Tolerância maior para mobile (melhor que 5px)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTasks();
    loadPlayerData();
    loadShopItems();
    loadShopCategories();
    if (supabaseConfig) {
      setSupabaseForm({
        url: supabaseConfig.url || '',
        anonKey: supabaseConfig.anonKey || '',
        userId: supabaseConfig.userId || '',
      });
    }
    checkForSyncConflict();
  }, []);

  const checkForSyncConflict = async () => {
    if (!supabaseConfig || !supabaseConfig.userId) return;
    
    try {
      const status = await checkSyncStatus(supabaseConfig.userId);
      if (status) {
        setSyncStatus(status);
        setSyncConflictOpen(true);
      }
    } catch (error) {
      console.error('Erro ao verificar sincronização:', error);
    }
  };

  const handleSaveProgress = async () => {
    if (!supabaseConfig || !supabaseConfig.userId) {
      setSyncMessage({ type: 'error', text: 'Configure o banco de dados primeiro' });
      return;
    }

    setSyncLoading(true);
    try {
      await saveProgressToCloud(supabaseConfig.userId);
      setSyncMessage({ type: 'success', text: 'Progresso salvo na nuvem com sucesso!' });
      setTimeout(() => {
        setSyncMessage({ type: '', text: '' });
        loadPlayerData();
        loadTasks();
        loadShopItems();
        loadShopCategories();
      }, 2000);
    } catch (error) {
      setSyncMessage({ type: 'error', text: `Erro ao salvar: ${error.message}` });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleRestoreProgress = async () => {
    if (!supabaseConfig || !supabaseConfig.userId) {
      setSyncMessage({ type: 'error', text: 'Configure o banco de dados primeiro' });
      return;
    }

    setSyncLoading(true);
    try {
      const data = await loadProgressFromCloud(supabaseConfig.userId);
      if (data) {
        setSyncMessage({ type: 'success', text: 'Progresso restaurado da nuvem com sucesso!' });
        setTimeout(() => {
          setSyncMessage({ type: '', text: '' });
          loadPlayerData();
          loadTasks();
          loadShopItems();
          loadShopCategories();
          window.location.reload(); // Recarregar para atualizar todos os componentes
        }, 2000);
      } else {
        setSyncMessage({ type: 'error', text: 'Nenhum save encontrado na nuvem' });
      }
    } catch (error) {
      setSyncMessage({ type: 'error', text: `Erro ao restaurar: ${error.message}` });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleOverwriteCloud = async () => {
    setSyncLoading(true);
    try {
      await saveProgressToCloud(supabaseConfig.userId);
      setSyncMessage({ type: 'success', text: 'Nuvem sobrescrita com sucesso!' });
      setSyncConflictOpen(false);
      setTimeout(() => {
        setSyncMessage({ type: '', text: '' });
        loadPlayerData();
        loadTasks();
        loadShopItems();
        loadShopCategories();
      }, 2000);
    } catch (error) {
      setSyncMessage({ type: 'error', text: `Erro ao sobrescrever: ${error.message}` });
    } finally {
      setSyncLoading(false);
    }
  };

  const loadTasks = () => {
    const allTasks = getTasks();
    setTasks(allTasks);
  };

  const loadPlayerData = () => {
    const data = getPlayerData();
    setPlayerData(data);
  };

  const loadShopItems = () => {
    const items = getShopItems();
    setShopItems(items);
  };

  const loadShopCategories = () => {
    const categories = getShopCategories();
    setShopCategories(categories);
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
      gold: task.gold || 0,
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
      gold: 0,
      skills: [],
      duration: 60,
      active: true,
    });
  };

  const handlePlayerLevelChange = (field, value) => {
    const updatedData = { ...playerData };
    if (field === 'level' || field === 'xp' || field === 'gold') {
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

  const handleGoldChange = (value) => {
    const gold = parseInt(value) || 0;
    setGold(gold);
    loadPlayerData();
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
    <>
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
              textShadow: titleTextShadow,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontSize: '1.5rem',
            }}
          >
            ADMIN
          </Typography>
        </Box>
      </motion.div>

      <Tabs
        value={adminTab}
        onChange={(e, newValue) => setAdminTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          mb: 4,
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
        <Tab label="Controle de Níveis" />
        <Tab label="Controle de Tarefas" />
        <Tab label="Controle da Loja" />
        <Tab label="Sincronização" />
      </Tabs>

      {/* Aba: Controle de Níveis */}
      {adminTab === 0 && (
        <Box>
      {playerData && (
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
              textShadow: titleTextShadow,
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ouro"
                type="number"
                value={playerData.gold || 0}
                onChange={(e) => handleGoldChange(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& input': {
                      color: '#FFD700',
                    },
                  },
                }}
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
      {playerData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
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
                textShadow: titleTextShadow,
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
                          textShadow: themeItem.effects?.textShadow || 'none',
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
      )}
        </Box>
      )}

      {/* Aba: Controle de Tarefas */}
      {adminTab === 1 && (
        <Box>
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
                  textShadow: titleTextShadow,
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Ouro"
                    value={formData.gold}
                    onChange={(e) => handleInputChange('gold', parseInt(e.target.value) || 0)}
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
                textShadow: textShadow,
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
                          {(() => {
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
        </Box>
      )}

      {/* Aba: Controle da Loja */}
      {adminTab === 2 && (
        <Box>
      {/* Seção de Gerenciamento de Loja */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
            <ShoppingCart sx={{ color: primaryColor, fontSize: 32 }} />
            <Typography
              variant="h6"
              sx={{
                color: textPrimary,
                textShadow: titleTextShadow,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 600,
              }}
            >
              GERENCIAR LOJA
            </Typography>
          </Box>

          {/* Gerenciar Categorias */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: textPrimary, textShadow: textShadow }}>
              Categorias
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Nome da Categoria"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ name: e.target.value })}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => {
                  if (categoryForm.name.trim()) {
                    const newCategory = {
                      id: `cat_${Date.now()}`,
                      name: categoryForm.name.trim(),
                      order: shopCategories.length,
                    };
                    const updated = [...shopCategories, newCategory];
                    saveShopCategories(updated);
                    setShopCategories(updated);
                    setCategoryForm({ name: '' });
                  }
                }}
              >
                Adicionar
              </Button>
            </Box>
            <DndContext
              sensors={shopSensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (active.id !== over?.id) {
                  const oldIndex = shopCategories.findIndex(c => c.id === active.id);
                  const newIndex = shopCategories.findIndex(c => c.id === over.id);
                  const reordered = arrayMove(shopCategories, oldIndex, newIndex);
                  reordered.forEach((cat, idx) => {
                    cat.order = idx;
                  });
                  saveShopCategories(reordered);
                  setShopCategories(reordered);
                }
              }}
            >
              <SortableContext items={shopCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {shopCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onDelete={(id) => {
                      const updated = shopCategories.filter(c => c.id !== id);
                      saveShopCategories(updated);
                      setShopCategories(updated);
                      // Mover itens da categoria deletada para 'default'
                      const updatedItems = shopItems.map(item =>
                        item.category === id ? { ...item, category: 'default' } : item
                      );
                      saveShopItems(updatedItems);
                      setShopItems(updatedItems);
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </Box>

          {/* Formulário de Item */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: textPrimary, textShadow: textShadow }}>
              {shopItemEditDialog.open ? 'Editar Item' : 'Adicionar Item'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título"
                  value={shopItemForm.title}
                  onChange={(e) => setShopItemForm({ ...shopItemForm, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descrição"
                  value={shopItemForm.description}
                  onChange={(e) => setShopItemForm({ ...shopItemForm, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL da Imagem"
                  value={shopItemForm.imageUrl}
                  onChange={(e) => setShopItemForm({ ...shopItemForm, imageUrl: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={shopItemForm.category}
                    label="Categoria"
                    onChange={(e) => setShopItemForm({ ...shopItemForm, category: e.target.value })}
                  >
                    {shopCategories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 2, color: textSecondary, fontWeight: 600 }}>
                  Condições de Compra (pode selecionar múltiplas):
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shopItemForm.requiresGold}
                        onChange={(e) => setShopItemForm({ ...shopItemForm, requiresGold: e.target.checked })}
                      />
                    }
                    label="Requer Ouro"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shopItemForm.requiresLevel}
                        onChange={(e) => setShopItemForm({ ...shopItemForm, requiresLevel: e.target.checked })}
                      />
                    }
                    label="Requer Nível"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shopItemForm.requiresTasks}
                        onChange={(e) => setShopItemForm({ ...shopItemForm, requiresTasks: e.target.checked })}
                      />
                    }
                    label="Requer Tarefas"
                  />
                </Box>
              </Grid>
              {shopItemForm.requiresGold ? (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Preço (Ouro)"
                    value={shopItemForm.price}
                    onChange={(e) => setShopItemForm({ ...shopItemForm, price: parseInt(e.target.value) || 0 })}
                  />
                </Grid>
              ) : null}
              {shopItemForm.requiresLevel ? (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Nível Necessário"
                    value={shopItemForm.requiredLevel}
                    onChange={(e) => setShopItemForm({ ...shopItemForm, requiredLevel: parseInt(e.target.value) || 0 })}
                  />
                </Grid>
              ) : null}
              {shopItemForm.requiresTasks ? (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 2, color: textSecondary, fontWeight: 600 }}>
                    Tarefas Necessárias (selecione uma ou mais):
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      maxHeight: 300,
                      overflow: 'auto',
                      backgroundColor: `${primaryColor}0D`,
                      border: `1px solid ${primaryColor}4D`,
                    }}
                  >
                    {tasks.length === 0 ? (
                      <Typography sx={{ color: textSecondary, opacity: 0.7, textAlign: 'center', py: 2 }}>
                        Nenhuma tarefa disponível
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {tasks
                          .filter(task => task.active !== false)
                          .map((task) => {
                            const taskId = task.id.toString();
                            const isSelected = shopItemForm.requiredTasks.includes(taskId);
                            
                            return (
                              <motion.div
                                key={task.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Paper
                                  sx={{
                                    p: 1.5,
                                    cursor: 'pointer',
                                    border: isSelected ? `2px solid ${primaryColor}` : `1px solid ${primaryColor}4D`,
                                    backgroundColor: isSelected ? `${primaryColor}1A` : 'background.paper',
                                    '&:hover': {
                                      backgroundColor: `${primaryColor}0D`,
                                      borderColor: primaryColor,
                                    },
                                  }}
                                  onClick={() => {
                                    const currentTasks = shopItemForm.requiredTasks || [];
                                    if (isSelected) {
                                      setShopItemForm({
                                        ...shopItemForm,
                                        requiredTasks: currentTasks.filter(id => id !== taskId),
                                      });
                                    } else {
                                      setShopItemForm({
                                        ...shopItemForm,
                                        requiredTasks: [...currentTasks, taskId],
                                      });
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={() => {}}
                                      sx={{
                                        color: primaryColor,
                                        '&.Mui-checked': {
                                          color: primaryColor,
                                        },
                                      }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 600 }}>
                                        {task.title}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.75rem' }}>
                                        {task.description}
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                        <Chip
                                          label={`${task.xp} XP`}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.65rem',
                                            backgroundColor: `${primaryColor}33`,
                                            color: textPrimary,
                                          }}
                                        />
                                        {task.gold > 0 && (
                                          <Chip
                                            label={`${task.gold} 🪙`}
                                            size="small"
                                            sx={{
                                              height: 20,
                                              fontSize: '0.65rem',
                                              backgroundColor: '#FFD70033',
                                              color: '#FFD700',
                                            }}
                                          />
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>
                                </Paper>
                              </motion.div>
                            );
                          })}
                      </Box>
                    )}
                  </Paper>
                  {shopItemForm.requiredTasks.length > 0 && (
                    <Typography variant="caption" sx={{ color: textSecondary, mt: 1, display: 'block' }}>
                      {shopItemForm.requiredTasks.length} tarefa(s) selecionada(s)
                    </Typography>
                  )}
                </Grid>
              ) : null}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={shopItemEditDialog.open ? <Edit /> : <Add />}
                  onClick={() => {
                    if (!shopItemForm.title || !shopItemForm.description) {
                      alert('Preencha título e descrição');
                      return;
                    }
                    if (shopItemEditDialog.open) {
                      const updated = shopItems.map(item =>
                        item.id === shopItemEditDialog.item.id ? { ...shopItemEditDialog.item, ...shopItemForm } : item
                      );
                      saveShopItems(updated);
                      setShopItems(updated);
                      setShopItemEditDialog({ open: false, item: null });
                    } else {
                      const newItem = {
                        id: Date.now(),
                        ...shopItemForm,
                        order: shopItems.filter(i => i.category === shopItemForm.category).length,
                      };
                      const updated = [...shopItems, newItem];
                      saveShopItems(updated);
                      setShopItems(updated);
                    }
                    setShopItemForm({
                      title: '',
                      description: '',
                      imageUrl: '',
                      category: shopCategories[0]?.id || 'default',
                      price: 0,
                      requiredLevel: 0,
                      requiredTasks: [],
                      requiresGold: true,
                      requiresLevel: false,
                      requiresTasks: false,
                    });
                  }}
                  fullWidth
                >
                  {shopItemEditDialog.open ? 'Atualizar Item' : 'Adicionar Item'}
                </Button>
                {shopItemEditDialog.open && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShopItemEditDialog({ open: false, item: null });
                      setShopItemForm({
                        title: '',
                        description: '',
                        imageUrl: '',
                        category: shopCategories[0]?.id || 'default',
                        price: 0,
                        requiredLevel: 0,
                        requiredTasks: [],
                        purchaseType: 'gold',
                      });
                    }}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Cancelar
                  </Button>
                )}
              </Grid>
            </Grid>
          </Box>

          {/* Lista de Itens */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: textPrimary, textShadow: textShadow }}>
              Itens da Loja ({shopItems.length})
            </Typography>
            {shopItems.length === 0 ? (
              <Typography sx={{ color: textSecondary, opacity: 0.7, textAlign: 'center', py: 4 }}>
                Nenhum item cadastrado
              </Typography>
            ) : (
              <Box>
                {shopCategories.map((category) => {
                  const categoryItems = shopItems
                    .filter(item => item.category === category.id)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));
                  
                  if (categoryItems.length === 0) return null;

                  return (
                    <Box key={category.id} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2, color: textPrimary, fontWeight: 600 }}>
                        {category.name}
                      </Typography>
                      <DndContext
                        sensors={shopSensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => {
                          const { active, over } = event;
                          if (active.id !== over?.id) {
                            const activeItem = shopItems.find(i => i.id === active.id);
                            const overItem = shopItems.find(i => i.id === over.id);
                            if (activeItem && overItem && activeItem.category === overItem.category) {
                              const categoryItems = shopItems
                                .filter(i => i.category === activeItem.category)
                                .sort((a, b) => (a.order || 0) - (b.order || 0));
                              const oldIndex = categoryItems.findIndex(i => i.id === active.id);
                              const newIndex = categoryItems.findIndex(i => i.id === over.id);
                              const reordered = arrayMove(categoryItems, oldIndex, newIndex);
                              reordered.forEach((item, idx) => {
                                item.order = idx;
                              });
                              const updated = shopItems.map(item => {
                                const reorderedItem = reordered.find(r => r.id === item.id);
                                return reorderedItem || item;
                              });
                              saveShopItems(updated);
                              setShopItems(updated);
                            }
                          }
                        }}
                      >
                        <SortableContext items={categoryItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                          {categoryItems.map((item) => (
                            <ShopItemCard
                              key={item.id}
                              item={item}
                              tasks={tasks}
                              onEdit={(item) => {
                                // Compatibilidade: converter purchaseType antigo para novas flags
                                let requiresGold = item.requiresGold !== undefined ? item.requiresGold : true;
                                let requiresLevel = item.requiresLevel !== undefined ? item.requiresLevel : false;
                                let requiresTasks = item.requiresTasks !== undefined ? item.requiresTasks : false;
                                
                                // Se tiver purchaseType antigo, converter
                                if (item.purchaseType) {
                                  requiresGold = item.purchaseType === 'gold' || item.purchaseType === 'mixed';
                                  requiresLevel = item.purchaseType === 'level' || item.purchaseType === 'mixed';
                                  requiresTasks = item.purchaseType === 'tasks' || item.purchaseType === 'mixed';
                                }
                                
                                setShopItemForm({
                                  title: item.title,
                                  description: item.description,
                                  imageUrl: item.imageUrl || '',
                                  category: item.category,
                                  price: item.price || 0,
                                  requiredLevel: item.requiredLevel || 0,
                                  requiredTasks: item.requiredTasks || [],
                                  requiresGold,
                                  requiresLevel,
                                  requiresTasks,
                                });
                                setShopItemEditDialog({ open: true, item });
                              }}
                              onDelete={(id) => {
                                if (window.confirm('Tem certeza que deseja deletar este item?')) {
                                  const updated = shopItems.filter(i => i.id !== id);
                                  saveShopItems(updated);
                                  setShopItems(updated);
                                }
                              }}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Paper>
      </motion.div>

        </Box>
      )}

      {/* Aba: Sincronização */}
      {adminTab === 3 && (
        <Box>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Storage sx={{ color: primaryColor, fontSize: 32 }} />
                <Typography
                  variant="h6"
                  sx={{
                    color: textPrimary,
                    textShadow: titleTextShadow,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontWeight: 600,
                  }}
                >
                  Configuração do Banco de Dados
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="URL do Supabase"
                    value={supabaseForm.url}
                    onChange={(e) => {
                      let url = e.target.value.trim();
                      // Remover /dashboard/project/... se o usuário colar a URL do dashboard
                      if (url.includes('/dashboard/project/')) {
                        const match = url.match(/project\/([^/]+)/);
                        if (match) {
                          url = `https://${match[1]}.supabase.co`;
                        }
                      }
                      setSupabaseForm({ ...supabaseForm, url });
                    }}
                    placeholder="https://seu-projeto.supabase.co"
                    helperText="URL da API do Supabase (ex: https://seu-projeto.supabase.co). Encontre em Settings > API > Project URL"
                    error={supabaseForm.url && !supabaseForm.url.includes('.supabase.co')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Chave Anônima (anon key)"
                    value={supabaseForm.anonKey}
                    onChange={(e) => setSupabaseForm({ ...supabaseForm, anonKey: e.target.value })}
                    type="password"
                    helperText="Chave pública do Supabase (anon key)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="ID do Usuário"
                    value={supabaseForm.userId}
                    onChange={(e) => setSupabaseForm({ ...supabaseForm, userId: e.target.value })}
                    placeholder="user_123"
                    helperText="ID único para identificar seu progresso na nuvem"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="contained"
                        onClick={() => {
                          if (!supabaseForm.url || !supabaseForm.anonKey || !supabaseForm.userId) {
                            setSyncMessage({ type: 'error', text: 'Preencha todos os campos' });
                            return;
                          }
                          // Validar URL
                          if (!supabaseForm.url.includes('.supabase.co')) {
                            setSyncMessage({ type: 'error', text: 'URL inválida. Use a URL da API (ex: https://seu-projeto.supabase.co)' });
                            return;
                          }
                          // Garantir que a URL termina sem barra
                          const cleanUrl = supabaseForm.url.replace(/\/$/, '');
                          const config = { ...supabaseForm, url: cleanUrl };
                          saveSupabaseConfig(config);
                          setSupabaseConfig(config);
                          setSyncMessage({ type: 'success', text: 'Configuração salva com sucesso!' });
                          setTimeout(() => setSyncMessage({ type: '', text: '' }), 3000);
                        }}
                        startIcon={<CheckCircle />}
                      >
                        Salvar Configuração
                      </Button>
                    </motion.div>
                    {supabaseConfig && (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            localStorage.removeItem('leveling_supabase_config');
                            setSupabaseConfig(null);
                            setSupabaseForm({ url: '', anonKey: '', userId: '' });
                            setSyncMessage({ type: 'success', text: 'Configuração removida' });
                            setTimeout(() => setSyncMessage({ type: '', text: '' }), 3000);
                          }}
                        >
                          Remover Configuração
                        </Button>
                      </motion.div>
                    )}
                  </Box>
                  {syncMessage.text && (
                    <Box sx={{ mt: 2 }}>
                      <Paper
                        sx={{
                          p: 2,
                          backgroundColor: syncMessage.type === 'error' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                          border: `1px solid ${syncMessage.type === 'error' ? '#FF0000' : '#00FF00'}80`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        {syncMessage.type === 'error' ? (
                          <ErrorIcon sx={{ color: '#FF0000' }} />
                        ) : (
                          <CheckCircle sx={{ color: '#00FF00' }} />
                        )}
                        <Typography
                          sx={{
                            color: syncMessage.type === 'error' ? '#FF0000' : '#00FF00',
                          }}
                        >
                          {syncMessage.text}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </motion.div>

          {supabaseConfig && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
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
                    sx={{
                      mb: 3,
                      color: textPrimary,
                      textShadow: titleTextShadow,
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                    }}
                  >
                    Sincronização de Progresso
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Paper
                      sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: `${primaryColor}0D`,
                        border: `1px solid ${primaryColor}4D`,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: textPrimary, fontWeight: 600, mb: 1 }}>
                        Último Save:
                      </Typography>
                      <Typography variant="body2" sx={{ color: textSecondary }}>
                        {getLastSave() ? new Date(getLastSave()).toLocaleString('pt-BR') : 'Nunca'}
                      </Typography>
                    </Paper>
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: `${primaryColor}0D`,
                        border: `1px solid ${primaryColor}4D`,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: textPrimary, fontWeight: 600, mb: 1 }}>
                        Última Restauração:
                      </Typography>
                      <Typography variant="body2" sx={{ color: textSecondary }}>
                        {getLastRestore() ? new Date(getLastRestore()).toLocaleString('pt-BR') : 'Nunca'}
                      </Typography>
                    </Paper>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<CloudUpload />}
                          onClick={() => setSaveConfirmOpen(true)}
                          disabled={syncLoading}
                          sx={{
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 600,
                          }}
                        >
                          Salvar Progresso na Nuvem
                        </Button>
                      </motion.div>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<CloudDownload />}
                          onClick={() => setRestoreConfirmOpen(true)}
                          disabled={syncLoading}
                          sx={{
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 600,
                          }}
                        >
                          Carregar Progresso da Nuvem
                        </Button>
                      </motion.div>
                    </Grid>
                  </Grid>
                </Paper>
              </motion.div>
            </>
          )}
        </Box>
      )}

    </Box>

    {/* Diálogos de Confirmação */}
    <ConfirmDialog
      open={saveConfirmOpen}
      onClose={() => setSaveConfirmOpen(false)}
      onConfirm={handleSaveProgress}
      action="salvar"
      title="Confirmar Salvamento"
      message="Tem certeza que deseja salvar seu progresso na nuvem? Esta ação irá sobrescrever qualquer save anterior."
    />

    <ConfirmDialog
      open={restoreConfirmOpen}
      onClose={() => setRestoreConfirmOpen(false)}
      onConfirm={handleRestoreProgress}
      action="restaurar"
      title="Confirmar Restauração"
      message="Tem certeza que deseja restaurar o progresso da nuvem? Esta ação irá sobrescrever todos os dados locais atuais."
    />

    <SyncConflictDialog
      open={syncConflictOpen}
      onClose={() => setSyncConflictOpen(false)}
      onRestore={async () => {
        setSyncConflictOpen(false);
        setRestoreConfirmOpen(true);
      }}
      onOverwrite={handleOverwriteCloud}
      onIgnore={() => {
        setSyncConflictOpen(false);
      }}
      syncStatus={syncStatus}
    />
    </>
  );
};

// Componente para item de categoria arrastável
const CategoryItem = ({ category, onDelete }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 2,
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'background.paper',
        border: `1px solid ${primaryColor}4D`,
        position: 'relative',
        // Prevenir interferência de gestos no mobile
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <Box 
        {...attributes} 
        {...listeners} 
        sx={{ 
          cursor: 'grab', 
          color: textSecondary,
          touchAction: 'none', // Importante para mobile
          userSelect: 'none',
          padding: 1,
          display: 'flex',
          alignItems: 'center',
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        <DragIndicator />
      </Box>
      <Category sx={{ color: primaryColor }} />
      <Typography sx={{ flex: 1, color: textPrimary }}>{category.name}</Typography>
      <IconButton
        onClick={() => onDelete(category.id)}
        sx={{
          color: '#FF0000',
          '&:hover': {
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
          },
        }}
      >
        <Delete />
      </IconButton>
    </Paper>
  );
};

// Componente para card de item da loja arrastável
const ShopItemCard = ({ item, onEdit, onDelete, tasks = [] }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      component={motion.div}
      whileHover={{ scale: 1.02, y: -2 }}
      sx={{
        p: 2.5,
        mb: 2,
        backgroundColor: 'background.paper',
        border: `1px solid ${primaryColor}4D`,
        boxShadow: `0 0 20px ${primaryColor}1A`,
        position: 'relative',
        // Prevenir interferência de gestos no mobile
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        {item.imageUrl && (
          <Box
            component="img"
            src={item.imageUrl}
            alt={item.title}
            sx={{
              width: 80,
              height: 80,
              objectFit: 'cover',
              borderRadius: 1,
              border: `1px solid ${primaryColor}4D`,
            }}
          />
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ color: textPrimary, fontWeight: 600, mb: 1 }}>
            {item.title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5, color: textSecondary, lineHeight: 1.6 }}>
            {item.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(() => {
              // Compatibilidade: converter purchaseType antigo para novas flags
              const requiresGold = item.requiresGold !== undefined 
                ? item.requiresGold 
                : (item.purchaseType === 'gold' || item.purchaseType === 'mixed');
              const requiresLevel = item.requiresLevel !== undefined 
                ? item.requiresLevel 
                : (item.purchaseType === 'level' || item.purchaseType === 'mixed');
              const requiresTasks = item.requiresTasks !== undefined 
                ? item.requiresTasks 
                : (item.purchaseType === 'tasks' || item.purchaseType === 'mixed');
              
              return (
                <>
                  {requiresGold && (item.price || 0) > 0 ? (
                    <Chip
                      label={`${item.price} 🪙`}
                      size="small"
                      sx={{
                        backgroundColor: '#FFD70033',
                        color: '#FFD700',
                        border: '1px solid #FFD70080',
                      }}
                    />
                  ) : null}
                  {requiresLevel && (item.requiredLevel || 0) > 0 ? (
                    <Chip
                      label={`Nível ${item.requiredLevel || 0}`}
                      size="small"
                      sx={{
                        backgroundColor: `${primaryColor}33`,
                        color: textPrimary,
                        border: `1px solid ${primaryColor}80`,
                      }}
                    />
                  ) : null}
                  {requiresTasks && (item.requiredTasks?.length || 0) > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip
                        label={`${item.requiredTasks?.length || 0} Tarefa(s)`}
                        size="small"
                        sx={{
                          backgroundColor: `${primaryColor}1A`,
                          color: textSecondary,
                          border: `1px solid ${primaryColor}4D`,
                        }}
                      />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {item.requiredTasks?.map((taskId) => {
                          const task = tasks.find(t => t.id.toString() === taskId.toString());
                          if (!task) return null;
                          return (
                            <Chip
                              key={taskId}
                              label={task.title}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                backgroundColor: `${primaryColor}0D`,
                                color: textSecondary,
                                border: `1px solid ${primaryColor}2D`,
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  ) : null}
                </>
              );
            })()}
          </Box>
        </Box>
        <Box>
          <Box 
            {...attributes} 
            {...listeners} 
            sx={{ 
              cursor: 'grab', 
              color: textSecondary, 
              mb: 1,
              touchAction: 'none', // Importante para mobile
              userSelect: 'none',
              padding: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 44, // Área mínima de toque para mobile (44x44px)
              minHeight: 44,
              '&:active': {
                cursor: 'grabbing',
              },
            }}
          >
            <DragIndicator />
          </Box>
          <IconButton
            onClick={() => onEdit(item)}
            sx={{
              color: primaryColor,
              '&:hover': {
                backgroundColor: `${primaryColor}1A`,
              },
            }}
          >
            <Edit />
          </IconButton>
          <IconButton
            onClick={() => onDelete(item.id)}
            sx={{
              color: '#FF0000',
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
              },
            }}
          >
            <Delete />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default Admin;

