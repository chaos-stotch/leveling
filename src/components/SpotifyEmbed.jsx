import React from 'react';
import { Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { getSpotifyPlaylists } from '../utils/storage';

// Função para extrair o ID da playlist da URL do Spotify
const extractPlaylistId = (url) => {
  try {
    // Suporta diferentes formatos de URL do Spotify
    // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
    // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

const SpotifyEmbed = () => {
  const theme = useTheme();
  const playlists = getSpotifyPlaylists();
  const primaryColor = theme.palette.primary.main;

  if (playlists.length === 0) {
    return null;
  }

  // Mostrar apenas a primeira playlist por enquanto
  const playlistUrl = playlists[0];
  const playlistId = extractPlaylistId(playlistUrl);

  if (!playlistId) {
    return null;
  }

  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'relative', zIndex: 1 }}
    >
      <Box
        sx={{
          position: 'fixed',
          bottom: 56, // Acima do BottomNavigation (que tem ~56px de altura)
          left: 0,
          right: 0,
          px: 0,
          pb: 0,
          zIndex: 1000,
          width: '100%',
        }}
      >
        <Box
          sx={{
            width: '100%',
            borderRadius: 0,
            overflow: 'hidden',
            borderTop: `1px solid ${primaryColor}4D`,
            boxShadow: `0 -5px 20px ${primaryColor}33`,
            backgroundColor: theme.palette.background.paper,
            '& iframe': {
              border: 'none',
              borderRadius: 0,
            },
          }}
        >
          <iframe
            src={embedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{
              display: 'block',
            }}
          />
        </Box>
      </Box>
    </motion.div>
  );
};

export default SpotifyEmbed;

