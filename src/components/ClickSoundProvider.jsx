import { useEffect } from 'react';
import { useSound } from '../hooks/useSound';

const ClickSoundProvider = ({ children }) => {
  const { playSound } = useSound();

  useEffect(() => {
    const handleClick = (event) => {
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
  }, [playSound]);

  return children;
};

export default ClickSoundProvider;
