import { useEffect, useState } from 'react';
import { useSound } from '../hooks/useSound';

const ClickSoundProvider = ({ children }) => {
  const { playSound } = useSound();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('leveling_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    const handleSoundEnabledChange = (event) => {
      setSoundEnabled(event.detail.enabled);
    };

    window.addEventListener('soundEnabledChanged', handleSoundEnabledChange);

    return () => {
      window.removeEventListener('soundEnabledChanged', handleSoundEnabledChange);
    };
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      // Verificar se o som está habilitado
      if (!soundEnabled) return;

      // Só tocar som ao trocar de janela (BottomNavigationAction)
      const target = event.target;

      // Verificar se o clique foi em uma aba de navegação (BottomNavigationAction)
      const isNavigationTab = target.closest('[class*="MuiBottomNavigationAction-root"]') ||
                             target.closest('.MuiBottomNavigationAction-root') ||
                             target.classList.contains('MuiBottomNavigationAction-root');

      if (isNavigationTab) {
        playSound('mouse-click');
      }
    };

    // Adicionar listener no document para capturar todos os cliques
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [playSound, soundEnabled]);

  return children;
};

export default ClickSoundProvider;
