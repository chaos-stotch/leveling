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
    const redirectUri = encodeURIComponent(window.location.origin);
    const scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming';
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scopes}`;
    window.location.href = authUrl;
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

