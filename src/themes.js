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
      titleTextShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF',
      textShadow: '0 0 10px #00D4FF',
      textShadowLarge: '0 0 20px #00D4FF, 0 0 40px #00D4FF',
    },
  },
  minimalistaPreto: {
    id: 'minimalistaPreto',
    name: 'Minimalista Preto',
    backgroundImage: null,
    palette: {
      mode: 'dark',
      primary: {
        main: '#FFFFFF',
      },
      secondary: {
        main: '#9E9E9E',
      },
      background: {
        default: '#000000',
        paper: '#1A1A1A',
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#B0B0B0',
      },
    },
    typography: {
      fontFamily: "'Inter', 'Roboto', sans-serif",
      h4: {
        fontWeight: 600,
        textShadow: 'none',
      },
      h5: {
        fontWeight: 500,
        textShadow: 'none',
      },
      h6: {
        fontWeight: 500,
        textShadow: 'none',
      },
    },
    effects: {
      paperBorder: '1px solid rgba(255, 255, 255, 0.1)',
      paperShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      buttonShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      buttonShadowHover: '0 4px 8px rgba(0, 0, 0, 0.3)',
      textFieldBorder: 'rgba(255, 255, 255, 0.2)',
      textFieldBorderHover: 'rgba(255, 255, 255, 0.4)',
      textFieldShadow: 'none',
      checkboxColor: '#FFFFFF',
      bottomNavBorder: '1px solid rgba(255, 255, 255, 0.1)',
      bottomNavShadow: '0 -2px 8px rgba(0, 0, 0, 0.3)',
      bottomNavSelected: '#FFFFFF',
      backgroundOverlay: 'none',
      titleTextShadow: 'none',
      textShadow: 'none',
      textShadowLarge: 'none',
    },
  },
  minimalistaBranco: {
    id: 'minimalistaBranco',
    name: 'Minimalista Branco',
    backgroundImage: null,
    palette: {
      mode: 'light',
      primary: {
        main: '#000000',
      },
      secondary: {
        main: '#616161',
      },
      background: {
        default: '#FFFFFF',
        paper: '#FAFAFA',
      },
      text: {
        primary: '#000000',
        secondary: '#424242',
      },
    },
    typography: {
      fontFamily: "'Inter', 'Roboto', sans-serif",
      h4: {
        fontWeight: 600,
        textShadow: 'none',
      },
      h5: {
        fontWeight: 500,
        textShadow: 'none',
      },
      h6: {
        fontWeight: 500,
        textShadow: 'none',
      },
    },
    effects: {
      paperBorder: '1px solid rgba(0, 0, 0, 0.1)',
      paperShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      buttonShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      buttonShadowHover: '0 4px 8px rgba(0, 0, 0, 0.15)',
      textFieldBorder: 'rgba(0, 0, 0, 0.2)',
      textFieldBorderHover: 'rgba(0, 0, 0, 0.4)',
      textFieldShadow: 'none',
      checkboxColor: '#000000',
      bottomNavBorder: '1px solid rgba(0, 0, 0, 0.1)',
      bottomNavShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
      bottomNavSelected: '#000000',
      backgroundOverlay: 'none',
      titleTextShadow: 'none',
      textShadow: 'none',
      textShadowLarge: 'none',
    },
  },
};

export const getTheme = (themeId) => {
  return themes[themeId] || themes.soloLeveling;
};

