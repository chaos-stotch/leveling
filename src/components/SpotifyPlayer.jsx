import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeOff,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSpotify } from '../hooks/useSpotify';

const SpotifyPlayer = () => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  
  const { accessToken, isAuthenticated, login } = useSpotify();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);

  // Aguardar o SDK do Spotify carregar
  useEffect(() => {
    // Verificar se já está pronto
    if (window.Spotify && window.spotifySDKReady) {
      setSdkReady(true);
      return;
    }

    // Aguardar evento de ready
    const handleSDKReady = () => {
      setSdkReady(true);
    };

    window.addEventListener('spotifySDKReady', handleSDKReady);

    // Verificar periodicamente se o SDK carregou (fallback)
    const checkInterval = setInterval(() => {
      if (window.Spotify) {
        setSdkReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    return () => {
      window.removeEventListener('spotifySDKReady', handleSDKReady);
      clearInterval(checkInterval);
    };
  }, []);

  // Inicializar Spotify Web Playback SDK
  useEffect(() => {
    const initSpotify = async () => {
      if (!sdkReady || !window.Spotify) {
        return;
      }

      if (!accessToken || !isAuthenticated) {
        return;
      }

      const player = new window.Spotify.Player({
        name: 'Leveling App',
        getOAuthToken: (cb) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Spotify Player pronto! Device ID:', device_id);
        setDeviceId(device_id);
        setIsConnected(true);
        playerRef.current = player;
        // Definir volume inicial
        player.setVolume(0.5);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device desconectado:', device_id);
        setIsConnected(false);
      });

      player.addListener('player_state_changed', (state) => {
        if (!state) {
          return;
        }

        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
        setPosition(state.position);
        setDuration(state.duration);
      });

      player.connect();

      return () => {
        player.disconnect();
      };
    };

    initSpotify();
  }, [accessToken, isAuthenticated, sdkReady]);

  // Atualizar posição da música
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      intervalRef.current = setInterval(() => {
        playerRef.current.getCurrentState().then((state) => {
          if (state) {
            setPosition(state.position);
          }
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  // Controles
  const togglePlay = () => {
    if (playerRef.current) {
      playerRef.current.togglePlay();
    }
  };

  const nextTrack = () => {
    if (playerRef.current) {
      playerRef.current.nextTrack();
    }
  };

  const previousTrack = () => {
    if (playerRef.current) {
      playerRef.current.previousTrack();
    }
  };

  const handleVolumeChange = (event, newValue) => {
    const newVolume = newValue / 100;
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
    setVolume(newValue);
    setIsMuted(newValue === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(null, 50);
    } else {
      handleVolumeChange(null, 0);
    }
  };

  const handleSeek = (event, newValue) => {
    if (playerRef.current) {
      playerRef.current.seek(newValue);
      setPosition(newValue);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Se não estiver autenticado, mostrar botão de login
  if (!isAuthenticated || !accessToken) {
    return (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          bottom: 56,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <Paper
          sx={{
            p: 1.5,
            backgroundColor: 'background.paper',
            borderTop: `1px solid ${primaryColor}4D`,
            borderBottom: `1px solid ${primaryColor}4D`,
            boxShadow: `0 -2px 10px ${primaryColor}1A`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: textSecondary,
              fontSize: '0.75rem',
            }}
          >
            Conecte-se ao Spotify para controlar a música
          </Typography>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                login();
              }}
              sx={{
                color: primaryColor,
                backgroundColor: `${primaryColor}33`,
                '&:hover': {
                  backgroundColor: `${primaryColor}4D`,
                  boxShadow: `0 0 10px ${primaryColor}80`,
                },
              }}
            >
              <PlayArrow />
            </IconButton>
          </motion.div>
        </Paper>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        bottom: 56,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <Paper
        sx={{
          p: 1.5,
          backgroundColor: 'background.paper',
          borderTop: `1px solid ${primaryColor}4D`,
          borderBottom: `1px solid ${primaryColor}4D`,
          boxShadow: `0 -2px 10px ${primaryColor}1A`,
        }}
      >
        {/* Barra de progresso */}
        {currentTrack && (
          <Box sx={{ mb: 1 }}>
            <Slider
              size="small"
              value={position}
              max={duration}
              onChange={handleSeek}
              sx={{
                color: primaryColor,
                height: 4,
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                  '&:hover': {
                    boxShadow: `0 0 0 8px ${primaryColor}1A`,
                  },
                },
                '& .MuiSlider-track': {
                  height: 4,
                },
                '& .MuiSlider-rail': {
                  height: 4,
                  opacity: 0.3,
                },
              }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 0.5,
                px: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: textSecondary, fontSize: '0.65rem' }}
              >
                {formatTime(position)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: textSecondary, fontSize: '0.65rem' }}
              >
                {formatTime(duration)}
              </Typography>
            </Box>
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {/* Informações da música */}
          {currentTrack && (
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              {currentTrack.album.images[0] && (
                <Box
                  component="img"
                  src={currentTrack.album.images[0].url}
                  alt={currentTrack.album.name}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    objectFit: 'cover',
                  }}
                />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: textPrimary,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentTrack.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: textSecondary,
                    fontSize: '0.7rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentTrack.artists.map((a) => a.name).join(', ')}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Controles */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <IconButton
              size="small"
              onClick={previousTrack}
              disabled={!currentTrack}
              sx={{
                color: textPrimary,
                '&:hover': {
                  backgroundColor: `${primaryColor}1A`,
                },
                '&:disabled': {
                  color: textSecondary,
                  opacity: 0.3,
                },
              }}
            >
              <SkipPrevious />
            </IconButton>

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <IconButton
                size="small"
                onClick={togglePlay}
                disabled={!currentTrack}
                sx={{
                  color: textPrimary,
                  backgroundColor: `${primaryColor}33`,
                  '&:hover': {
                    backgroundColor: `${primaryColor}4D`,
                    boxShadow: `0 0 10px ${primaryColor}80`,
                  },
                  '&:disabled': {
                    backgroundColor: `${primaryColor}1A`,
                    opacity: 0.5,
                  },
                }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
            </motion.div>

            <IconButton
              size="small"
              onClick={nextTrack}
              disabled={!currentTrack}
              sx={{
                color: textPrimary,
                '&:hover': {
                  backgroundColor: `${primaryColor}1A`,
                },
                '&:disabled': {
                  color: textSecondary,
                  opacity: 0.3,
                },
              }}
            >
              <SkipNext />
            </IconButton>

            {/* Volume */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                ml: 1,
                width: 100,
              }}
            >
              <IconButton
                size="small"
                onClick={toggleMute}
                sx={{
                  color: textPrimary,
                  '&:hover': {
                    backgroundColor: `${primaryColor}1A`,
                  },
                }}
              >
                {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
              <Slider
                size="small"
                value={volume}
                onChange={handleVolumeChange}
                sx={{
                  color: primaryColor,
                  '& .MuiSlider-thumb': {
                    width: 10,
                    height: 10,
                  },
                  '& .MuiSlider-track': {
                    height: 3,
                  },
                  '& .MuiSlider-rail': {
                    height: 3,
                    opacity: 0.3,
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default SpotifyPlayer;

