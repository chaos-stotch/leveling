// Definições de temas
export const themes = {
  soloLeveling: {
    id: 'soloLeveling',
    name: 'Solo Leveling',
    backgroundImage: '/sololeveling.jpg',
    palette: {
      mode: 'dark',
      primary: {
        main: '#00D4FF',
      },
      secondary: {
        main: '#00FF88',
      },
      background: {
        default: '#0a0e27',
        paper: '#0f1629',
      },
      text: {
        primary: '#00D4FF',
        secondary: '#B0E0FF',
      },
    },
    typography: {
      fontFamily: "'Roboto', 'Segoe UI', sans-serif",
      h4: {
        fontWeight: 700,
        textShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF',
      },
      h5: {
        fontWeight: 600,
        textShadow: '0 0 8px #00D4FF, 0 0 15px #00D4FF',
      },
      h6: {
        fontWeight: 600,
        textShadow: '0 0 5px #00D4FF',
      },
    },
    effects: {
      paperBorder: '1px solid rgba(0, 212, 255, 0.3)',
      paperShadow: '0 0 20px rgba(0, 212, 255, 0.1), inset 0 0 20px rgba(0, 212, 255, 0.05)',
      buttonShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
      buttonShadowHover: '0 0 20px rgba(0, 212, 255, 0.5)',
      textFieldBorder: 'rgba(0, 212, 255, 0.5)',
      textFieldBorderHover: 'rgba(0, 212, 255, 0.8)',
      textFieldShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
      checkboxColor: '#00D4FF',
      bottomNavBorder: '1px solid rgba(0, 212, 255, 0.3)',
      bottomNavShadow: '0 -5px 20px rgba(0, 212, 255, 0.1)',
      bottomNavSelected: '#00D4FF',
      backgroundOverlay: 'radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 70%)',
    },
  },
  redbullF1: {
    id: 'redbullF1',
    name: 'Red Bull F1',
    backgroundImage: '/redbull.jpg',
    palette: {
      mode: 'dark',
      primary: {
        main: '#FF004C',
      },
      secondary: {
        main: '#FFCC00',
      },
      background: {
        default: '#000000',
        paper: '#0a0a0a',
      },
      text: {
        primary: '#FF004C',
        secondary: '#CCCCCC',
      },
    },
    typography: {
      fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
      h4: {
        fontWeight: 900,
        textShadow: '0 0 10px #FF004C, 0 0 20px #FF004C',
        letterSpacing: '2px',
      },
      h5: {
        fontWeight: 700,
        textShadow: '0 0 8px #FF004C, 0 0 15px #FF004C',
        letterSpacing: '1px',
      },
      h6: {
        fontWeight: 700,
        textShadow: '0 0 5px #FF004C',
        letterSpacing: '1px',
      },
    },
    effects: {
      paperBorder: '1px solid rgba(255, 0, 76, 0.4)',
      paperShadow: '0 0 20px rgba(255, 0, 76, 0.2), inset 0 0 20px rgba(255, 0, 76, 0.05)',
      buttonShadow: '0 0 15px rgba(255, 0, 76, 0.4)',
      buttonShadowHover: '0 0 25px rgba(255, 0, 76, 0.6)',
      textFieldBorder: 'rgba(255, 0, 76, 0.6)',
      textFieldBorderHover: 'rgba(255, 0, 76, 0.9)',
      textFieldShadow: '0 0 15px rgba(255, 0, 76, 0.6)',
      checkboxColor: '#FF004C',
      bottomNavBorder: '1px solid rgba(255, 0, 76, 0.4)',
      bottomNavShadow: '0 -5px 20px rgba(255, 0, 76, 0.2)',
      bottomNavSelected: '#FF004C',
      backgroundOverlay: 'radial-gradient(circle at 50% 50%, rgba(255, 0, 76, 0.15) 0%, transparent 70%)',
    },
  },
};

export const getTheme = (themeId) => {
  return themes[themeId] || themes.soloLeveling;
};

