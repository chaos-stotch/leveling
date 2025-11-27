import { useCallback } from 'react';

// Cache para instâncias de áudio
const audioCache = new Map();

// Função para criar ou obter uma instância de áudio
const getAudio = (soundName) => {
  if (!audioCache.has(soundName)) {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = 0.3; // Volume moderado
    audioCache.set(soundName, audio);
  }
  return audioCache.get(soundName);
};

// Hook personalizado para gerenciar sons
export const useSound = () => {
  const playSound = useCallback((soundName) => {
    try {
      const audio = getAudio(soundName);
      // Resetar o áudio para permitir reprodução rápida consecutiva
      audio.currentTime = 0;
      audio.play().catch((error) => {
        console.warn(`Erro ao reproduzir som ${soundName}:`, error);
      });
    } catch (error) {
      console.warn(`Erro ao carregar som ${soundName}:`, error);
    }
  }, []);

  return { playSound };
};

// Sons disponíveis
export const SOUNDS = {
  MOUSE_CLICK: 'mouse-click',
  VHS_STARTUP: 'vhs-startup',
  MICROWAVE_TIMER: 'microwave-timer',
  POWER_DOWN: 'power-down',
  SUCCESS: 'success',
  COMPUTER_PROCESSING: 'computer-processing',
};
