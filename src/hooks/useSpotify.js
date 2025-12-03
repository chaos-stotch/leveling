import { useState, useEffect } from 'react';

export const useSpotify = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar se há token na URL (após OAuth redirect)
    const hash = window.location.hash;
    if (hash) {
      const token = hash
        .substring(1)
        .split('&')
        .find((elem) => elem.startsWith('access_token'))
        ?.split('=')[1];

      if (token) {
        setAccessToken(token);
        setIsAuthenticated(true);
        localStorage.setItem('spotify_access_token', token);
        // Limpar hash da URL
        window.location.hash = '';
      }
    } else {
      // Verificar se há token salvo
      const storedToken = localStorage.getItem('spotify_access_token');
      if (storedToken) {
        setAccessToken(storedToken);
        setIsAuthenticated(true);
      }
    }
  }, []);

  const login = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'YOUR_SPOTIFY_CLIENT_ID';
    
    if (!clientId || clientId === 'YOUR_SPOTIFY_CLIENT_ID') {
      console.error('Spotify Client ID não configurado. Configure VITE_SPOTIFY_CLIENT_ID no arquivo .env');
      alert('Spotify Client ID não configurado. Por favor, configure a variável VITE_SPOTIFY_CLIENT_ID no arquivo .env');
      return;
    }
    
    const redirectUri = window.location.origin;
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming';
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodedRedirectUri}&scope=${scopes}`;
    
    console.log('=== Spotify Login Debug ===');
    console.log('Client ID:', clientId);
    console.log('Redirect URI (original):', redirectUri);
    console.log('Redirect URI (encoded):', encodedRedirectUri);
    console.log('Auth URL:', authUrl);
    console.log('==========================');
    
    // Usar window.location.replace para evitar que o usuário volte com o botão voltar
    window.location.replace(authUrl);
  };

  const logout = () => {
    localStorage.removeItem('spotify_access_token');
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  return {
    accessToken,
    isAuthenticated,
    login,
    logout,
  };
};

