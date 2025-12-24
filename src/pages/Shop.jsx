import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import { ShoppingCart, CheckCircle, Lock, History } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getShopItems,
  getShopCategories,
  getPlayerData,
  spendGold,
  addPurchasedItem,
  isItemPurchased,
  getPurchasedItems,
  getTasks,
  addPurchaseToHistory,
  getPurchaseHistory,
} from '../utils/storage';
import { useSound } from '../hooks/useSound';

const COMPLETED_TASKS_KEY = 'leveling_completed_tasks';

const getCompletedTasks = () => {
  const data = localStorage.getItem(COMPLETED_TASKS_KEY);
  return data ? JSON.parse(data) : [];
};

const Shop = () => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const titleTextShadow = theme.custom?.titleTextShadow || `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`;
  const textShadow = theme.custom?.textShadow || `0 0 10px ${primaryColor}`;
  const { playSound } = useSound();

  const [shopItems, setShopItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [playerData, setPlayerData] = useState(null);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [purchaseDialog, setPurchaseDialog] = useState({ open: false, item: null });
  const [historyDialog, setHistoryDialog] = useState({ open: false });
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  useEffect(() => {
    const allTasks = getTasks();
    setTasks(allTasks);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const items = getShopItems();
    const cats = getShopCategories();
    const player = getPlayerData();
    const purchased = getPurchasedItems();
    const completed = getCompletedTasks();
    const allTasks = getTasks();

    // Ordenar categorias e itens
    const sortedCats = [...cats].sort((a, b) => (a.order || 0) - (b.order || 0));
    const sortedItems = items.map(item => {
      const categoryItems = items.filter(i => i.category === item.category);
      item.order = item.order || categoryItems.indexOf(item);
      return item;
    });

    setShopItems(sortedItems);
    setCategories(sortedCats);
    setPlayerData(player);
    setPurchasedItems(purchased);
    setCompletedTasks(completed);
    setPurchaseHistory(getPurchaseHistory());
    if (allTasks.length > 0) {
      setTasks(allTasks);
    }
  };

  const canPurchaseItem = (item) => {
    const player = getPlayerData();
    const completed = getCompletedTasks();
    const reasons = [];

    // Compatibilidade: converter purchaseType antigo para novas flags
    let requiresGold = item.requiresGold !== undefined ? Boolean(item.requiresGold) : false;
    let requiresLevel = item.requiresLevel !== undefined ? Boolean(item.requiresLevel) : false;
    let requiresTasks = item.requiresTasks !== undefined ? Boolean(item.requiresTasks) : false;
    
    if (item.purchaseType) {
      requiresGold = item.purchaseType === 'gold' || item.purchaseType === 'mixed';
      requiresLevel = item.purchaseType === 'level' || item.purchaseType === 'mixed';
      requiresTasks = item.purchaseType === 'tasks' || item.purchaseType === 'mixed';
    }

    // Verificar TODAS as condições requeridas - TODAS devem ser atendidas
    
    // Verificar ouro (se requerido) - DEVE ter ouro suficiente
    if (requiresGold === true) {
      const price = item.price || 0;
      if (price <= 0) {
        reasons.push('Preço não definido');
      } else if ((player.gold || 0) < price) {
        reasons.push(`Ouro insuficiente (necessário: ${price}, você tem: ${player.gold || 0})`);
      }
      // Se tem ouro suficiente, não adiciona razão (condição atendida)
    }

    // Verificar nível (se requerido) - DEVE ter o nível necessário
    if (requiresLevel === true) {
      const requiredLevel = item.requiredLevel || 0;
      if (requiredLevel <= 0) {
        reasons.push('Nível necessário não definido');
      } else if (player.level < requiredLevel) {
        reasons.push(`Nível ${requiredLevel} necessário (você tem nível ${player.level})`);
      }
      // Se tem nível suficiente, não adiciona razão (condição atendida)
    }

    // Verificar tarefas (se requerido) - TODAS as tarefas devem estar completas
    if (requiresTasks === true) {
      const requiredTasks = item.requiredTasks || [];
      if (requiredTasks.length === 0) {
        reasons.push('Tarefas necessárias não definidas');
      } else {
        const allCompleted = requiredTasks.every(taskId => {
          const taskIdNum = parseInt(taskId);
          return completed.includes(taskIdNum);
        });
        if (!allCompleted) {
          const missing = requiredTasks.filter(taskId => {
            const taskIdNum = parseInt(taskId);
            return !completed.includes(taskIdNum);
          });
          const missingTasks = missing.map(id => {
            const task = tasks.find(t => t.id.toString() === id.toString());
            return task ? task.title : `ID: ${id}`;
          });
          reasons.push(`Tarefa(s) pendente(s): ${missingTasks.join(', ')}`);
        }
        // Se todas as tarefas estão completas, não adiciona razão (condição atendida)
      }
    }
    
    // Debug: mostrar condições e razões
    // console.log('Item:', item.title, 'requiresGold:', requiresGold, 'requiresLevel:', requiresLevel, 'requiresTasks:', requiresTasks, 'reasons:', reasons);

    // Se há razões, não pode comprar
    if (reasons.length > 0) {
      return { canBuy: false, reason: reasons.join(', ') };
    }

    // Se não há condições definidas, não pode comprar
    if (!requiresGold && !requiresLevel && !requiresTasks) {
      return { canBuy: false, reason: 'Nenhuma condição definida' };
    }

    // Todas as condições foram atendidas - TODAS devem estar OK
    return { canBuy: true };
  };

  const handlePurchase = (item) => {
    // Revalidar antes de comprar (dados podem ter mudado)
    const purchaseCheck = canPurchaseItem(item);
    if (!purchaseCheck.canBuy) {
      alert(`Não é possível comprar: ${purchaseCheck.reason}`);
      loadData();
      return;
    }
    
    // Validar novamente com dados atualizados
    const player = getPlayerData();
    const completed = getCompletedTasks();
    
    // Compatibilidade: converter purchaseType antigo para novas flags
    let requiresGold = item.requiresGold !== undefined ? Boolean(item.requiresGold) : false;
    let requiresLevel = item.requiresLevel !== undefined ? Boolean(item.requiresLevel) : false;
    let requiresTasks = item.requiresTasks !== undefined ? Boolean(item.requiresTasks) : false;
    
    if (item.purchaseType) {
      requiresGold = item.purchaseType === 'gold' || item.purchaseType === 'mixed';
      requiresLevel = item.purchaseType === 'level' || item.purchaseType === 'mixed';
      requiresTasks = item.purchaseType === 'tasks' || item.purchaseType === 'mixed';
    }
    
    // Verificar TODAS as condições novamente - TODAS devem ser atendidas
    
    // Verificar ouro (se requerido) - usa === true para garantir comparação estrita
    if (requiresGold === true) {
      const price = item.price || 0;
      if (price <= 0) {
        alert('Preço não definido');
        loadData();
        return;
      }
      if ((player.gold || 0) < price) {
        alert(`Ouro insuficiente (necessário: ${price}, você tem: ${player.gold || 0})`);
        loadData();
        return;
      }
    }
    
    // Verificar nível (se requerido) - DEVE ter o nível - usa === true
    if (requiresLevel === true) {
      const requiredLevel = item.requiredLevel || 0;
      if (requiredLevel <= 0) {
        alert('Nível necessário não definido');
        loadData();
        return;
      }
      if (player.level < requiredLevel) {
        alert(`Nível ${requiredLevel} necessário (você tem nível ${player.level})`);
        loadData();
        return;
      }
    }
    
    // Verificar tarefas (se requerido) - TODAS devem estar completas - usa === true
    if (requiresTasks === true) {
      const requiredTasks = item.requiredTasks || [];
      if (requiredTasks.length === 0) {
        alert('Tarefas necessárias não definidas');
        loadData();
        return;
      }
      const allCompleted = requiredTasks.every(taskId => {
        const taskIdNum = parseInt(taskId);
        return completed.includes(taskIdNum);
      });
      if (!allCompleted) {
        const missing = requiredTasks.filter(taskId => {
          const taskIdNum = parseInt(taskId);
          return !completed.includes(taskIdNum);
        });
        const missingTasks = missing.map(id => {
          const task = tasks.find(t => t.id.toString() === id.toString());
          return task ? task.title : `ID: ${id}`;
        });
        alert(`Tarefa(s) pendente(s): ${missingTasks.join(', ')}`);
        loadData();
        return;
      }
    }
    
    // Se chegou aqui, TODAS as condições requeridas foram atendidas

    // Se precisar gastar ouro, gastar
    if (requiresGold && (item.price || 0) > 0) {
      if (!spendGold(item.price || 0)) {
        alert('Erro ao processar compra');
        loadData();
        return;
      }
    }

    // Adicionar item aos comprados (para compatibilidade)
    addPurchasedItem(item.id);
    
    // Adicionar ao histórico de compras
    addPurchaseToHistory(item, {
      price: item.price || 0,
      requiredLevel: item.requiredLevel || 0,
      requiredTasks: item.requiredTasks || [],
    });
    
    playSound('success');
    loadData();
    setPurchaseDialog({ open: false, item: null });
  };

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
            justifyContent: 'space-between',
            gap: 2,
            mb: 4,
            border: `1px solid ${primaryColor}4D`,
            p: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShoppingCart sx={{ color: primaryColor, filter: `drop-shadow(0 0 5px ${primaryColor})` }} />
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
              LOJA
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={() => {
                loadData();
                setHistoryDialog({ open: true });
              }}
              sx={{
                borderColor: primaryColor,
                color: textPrimary,
                '&:hover': {
                  borderColor: primaryColor,
                  backgroundColor: `${primaryColor}1A`,
                  boxShadow: `0 0 10px ${primaryColor}80`,
                },
              }}
            >
              Histórico
            </Button>
            {playerData && (
              <Chip
                label={`${playerData.gold || 0} 🪙`}
                sx={{
                  backgroundColor: '#FFD70033',
                  color: '#FFD700',
                  border: '1px solid #FFD70080',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: `0 0 10px #FFD70040`,
                }}
              />
            )}
          </Box>
        </Box>
      </motion.div>

      {categories.length === 0 ? (
        <Typography sx={{ color: textSecondary, opacity: 0.7, textAlign: 'center', py: 4 }}>
          Nenhuma categoria disponível
        </Typography>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {categories.map((category) => {
            const categoryItems = shopItems
              .filter(item => item.category === category.id)
              .sort((a, b) => (a.order || 0) - (b.order || 0));

            if (categoryItems.length === 0) return null;

            return (
              <motion.div key={category.id} variants={itemVariants}>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 3,
                      color: textPrimary,
                      textShadow: textShadow,
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      fontWeight: 600,
                    }}
                  >
                    {category.name}
                  </Typography>
                  <Grid container spacing={3}>
                    {categoryItems.map((item) => {
                      const purchased = isItemPurchased(item.id);
                      const purchaseCheck = canPurchaseItem(item);

                      return (
                        <Grid item xs={12} sm={6} md={4} key={item.id}>
                          <motion.div
                            whileHover={{ scale: 1.03, y: -5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Paper
                              sx={{
                                p: 3,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: 'background.paper',
                                border: purchased
                                  ? `2px solid ${secondaryColor}80`
                                  : `1px solid ${primaryColor}4D`,
                                boxShadow: purchased
                                  ? `0 0 30px ${secondaryColor}33`
                                  : `0 0 20px ${primaryColor}1A`,
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                            >

                              {item.imageUrl && (
                                <Box
                                  component="img"
                                  src={item.imageUrl}
                                  alt={item.title}
                                  sx={{
                                    width: '100%',
                                    height: 200,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    mb: 2,
                                    border: `1px solid ${primaryColor}4D`,
                                  }}
                                />
                              )}

                              <Typography
                                variant="h6"
                                sx={{
                                  color: textPrimary,
                                  fontWeight: 600,
                                  mb: 1,
                                }}
                              >
                                {item.title}
                              </Typography>

                              <Typography
                                variant="body2"
                                sx={{
                                  color: textSecondary,
                                  mb: 2,
                                  flex: 1,
                                  lineHeight: 1.6,
                                }}
                              >
                                {item.description}
                              </Typography>

                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
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
                                          label={`${item.price || 0} 🪙`}
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

                              <Button
                                variant="outlined"
                                startIcon={purchaseCheck.canBuy ? <ShoppingCart /> : <Lock />}
                                onClick={() => {
                                  if (purchaseCheck.canBuy) {
                                    setPurchaseDialog({ open: true, item });
                                  } else {
                                    alert(`Não é possível comprar: ${purchaseCheck.reason}`);
                                  }
                                }}
                                fullWidth
                                disabled={!purchaseCheck.canBuy}
                                sx={{
                                  borderColor: purchaseCheck.canBuy ? primaryColor : textSecondary,
                                  color: purchaseCheck.canBuy ? textPrimary : textSecondary,
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
                                {purchaseCheck.canBuy ? 'Comprar' : purchaseCheck.reason}
                              </Button>
                            </Paper>
                          </motion.div>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Dialog de Confirmação de Compra */}
      <Dialog
        open={purchaseDialog.open}
        onClose={() => setPurchaseDialog({ open: false, item: null })}
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
        {purchaseDialog.item && (
          <>
            <DialogTitle sx={{ color: textPrimary, textShadow: titleTextShadow, textTransform: 'uppercase' }}>
              Confirmar Compra
            </DialogTitle>
            <DialogContent>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                {purchaseDialog.item.imageUrl && (
                  <Box
                    component="img"
                    src={purchaseDialog.item.imageUrl}
                    alt={purchaseDialog.item.title}
                    sx={{
                      width: '100%',
                      maxWidth: 300,
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 1,
                      mb: 2,
                      border: `1px solid ${primaryColor}4D`,
                    }}
                  />
                )}
                <Typography variant="h6" sx={{ color: textPrimary, mb: 1, fontWeight: 600 }}>
                  {purchaseDialog.item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
                  {purchaseDialog.item.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {(() => {
                    // Compatibilidade: converter purchaseType antigo para novas flags
                    const requiresGold = purchaseDialog.item.requiresGold !== undefined 
                      ? purchaseDialog.item.requiresGold 
                      : (purchaseDialog.item.purchaseType === 'gold' || purchaseDialog.item.purchaseType === 'mixed');
                    const requiresLevel = purchaseDialog.item.requiresLevel !== undefined 
                      ? purchaseDialog.item.requiresLevel 
                      : (purchaseDialog.item.purchaseType === 'level' || purchaseDialog.item.purchaseType === 'mixed');
                    const requiresTasks = purchaseDialog.item.requiresTasks !== undefined 
                      ? purchaseDialog.item.requiresTasks 
                      : (purchaseDialog.item.purchaseType === 'tasks' || purchaseDialog.item.purchaseType === 'mixed');
                    
                    return (
                      <>
                        {requiresGold && (purchaseDialog.item.price || 0) > 0 ? (
                          <Chip
                            label={`${purchaseDialog.item.price || 0} 🪙`}
                            sx={{
                              backgroundColor: '#FFD70033',
                              color: '#FFD700',
                              border: '1px solid #FFD70080',
                            }}
                          />
                        ) : null}
                        {requiresLevel && (purchaseDialog.item.requiredLevel || 0) > 0 ? (
                          <Chip
                            label={`Nível ${purchaseDialog.item.requiredLevel || 0}`}
                            sx={{
                              backgroundColor: `${primaryColor}33`,
                              color: textPrimary,
                              border: `1px solid ${primaryColor}80`,
                            }}
                          />
                        ) : null}
                        {requiresTasks && (purchaseDialog.item.requiredTasks?.length || 0) > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                            <Chip
                              label={`${purchaseDialog.item.requiredTasks?.length || 0} Tarefa(s)`}
                              sx={{
                                backgroundColor: `${primaryColor}1A`,
                                color: textSecondary,
                                border: `1px solid ${primaryColor}4D`,
                              }}
                            />
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                              {purchaseDialog.item.requiredTasks?.map((taskId) => {
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
              <Typography sx={{ color: textSecondary, textAlign: 'center' }}>
                Deseja realmente adquirir este item?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setPurchaseDialog({ open: false, item: null })}
                sx={{ color: textSecondary, opacity: 0.7 }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handlePurchase(purchaseDialog.item)}
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
                Confirmar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de Histórico de Compras */}
      <Dialog
        open={historyDialog.open}
        onClose={() => setHistoryDialog({ open: false })}
        maxWidth="md"
        fullWidth
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
          Histórico de Compras ({purchaseHistory.length})
        </DialogTitle>
        <DialogContent>
          {purchaseHistory.length === 0 ? (
            <Typography sx={{ color: textSecondary, opacity: 0.7, textAlign: 'center', py: 4 }}>
              Nenhuma compra registrada
            </Typography>
          ) : (
            <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
              {purchaseHistory.map((purchase) => (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      mb: 2,
                      backgroundColor: `${primaryColor}0D`,
                      border: `1px solid ${primaryColor}4D`,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'start' }}>
                      {purchase.itemImageUrl && (
                        <Box
                          component="img"
                          src={purchase.itemImageUrl}
                          alt={purchase.itemTitle}
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: `1px solid ${primaryColor}4D`,
                          }}
                        />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ color: textPrimary, fontWeight: 600, mb: 0.5 }}>
                          {purchase.itemTitle}
                        </Typography>
                        <Typography variant="body2" sx={{ color: textSecondary, mb: 1, fontSize: '0.85rem' }}>
                          {purchase.itemDescription}
                        </Typography>
                        <Typography variant="caption" sx={{ color: textSecondary, opacity: 0.7 }}>
                          {new Date(purchase.timestamp).toLocaleString('pt-BR')}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setHistoryDialog({ open: false })}
            sx={{
              borderColor: primaryColor,
              color: textPrimary,
              '&:hover': {
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}1A`,
              },
            }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Shop;

