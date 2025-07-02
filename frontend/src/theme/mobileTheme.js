import { createTheme } from '@mui/material/styles';

// 移动端优化的主题配置
const mobileTheme = createTheme({
  // 断点配置
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 768,
      lg: 1024,
      xl: 1200,
    },
  },
  
  // 调色板
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  
  // 字体配置
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    
    // 移动端优化的字体大小
    h1: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.2,
      '@media (max-width:768px)': {
        fontSize: '1.75rem',
      },
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.3,
      '@media (max-width:768px)': {
        fontSize: '1.5rem',
      },
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (max-width:768px)': {
        fontSize: '1.25rem',
      },
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (max-width:768px)': {
        fontSize: '1.125rem',
      },
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
      '@media (max-width:768px)': {
        fontSize: '1rem',
      },
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      '@media (max-width:768px)': {
        fontSize: '0.875rem',
      },
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      '@media (max-width:768px)': {
        fontSize: '0.875rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
      '@media (max-width:768px)': {
        fontSize: '0.75rem',
      },
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
      '@media (max-width:768px)': {
        fontSize: '0.75rem',
      },
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.66,
      '@media (max-width:768px)': {
        fontSize: '0.625rem',
      },
    },
  },
  
  // 间距配置
  spacing: 8,
  
  // 形状配置
  shape: {
    borderRadius: 8,
  },
  
  // 组件样式覆盖
  components: {
    // AppBar 优化
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          '@media (max-width:768px)': {
            minHeight: 56,
          },
        },
      },
    },
    
    // Toolbar 优化
    MuiToolbar: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            minHeight: 56,
            paddingLeft: 8,
            paddingRight: 8,
          },
        },
      },
    },
    
    // Button 优化
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          '@media (max-width:768px)': {
            minHeight: 44,
            fontSize: '0.875rem',
            padding: '8px 16px',
          },
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    
    // IconButton 优化
    MuiIconButton: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            padding: 8,
          },
        },
      },
    },
    
    // Card 优化
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
          '@media (max-width:768px)': {
            borderRadius: 8,
            margin: 4,
          },
        },
      },
    },
    
    // CardContent 优化
    MuiCardContent: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            padding: 12,
            '&:last-child': {
              paddingBottom: 12,
            },
          },
        },
      },
    },
    
    // TextField 优化
    MuiTextField: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            marginBottom: 12,
          },
        },
      },
    },
    
    // InputBase 优化
    MuiInputBase: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            fontSize: '0.875rem',
          },
        },
      },
    },
    
    // Table 优化
    MuiTable: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            fontSize: '0.75rem',
          },
        },
      },
    },
    
    // TableCell 优化
    MuiTableCell: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            padding: '8px 4px',
            fontSize: '0.75rem',
          },
        },
      },
    },
    
    // Dialog 优化
    MuiDialog: {
      styleOverrides: {
        paper: {
          '@media (max-width:768px)': {
            margin: 16,
            width: 'calc(100% - 32px)',
            maxWidth: 'none',
            borderRadius: 12,
          },
        },
      },
    },
    
    // Drawer 优化
    MuiDrawer: {
      styleOverrides: {
        paper: {
          '@media (max-width:768px)': {
            width: 280,
          },
        },
      },
    },
    
    // ListItem 优化
    MuiListItem: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            paddingTop: 8,
            paddingBottom: 8,
          },
        },
      },
    },
    
    // ListItemText 优化
    MuiListItemText: {
      styleOverrides: {
        primary: {
          '@media (max-width:768px)': {
            fontSize: '0.875rem',
          },
        },
        secondary: {
          '@media (max-width:768px)': {
            fontSize: '0.75rem',
          },
        },
      },
    },
    
    // Chip 优化
    MuiChip: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            fontSize: '0.6875rem',
            height: 24,
          },
        },
      },
    },
    
    // Tab 优化
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '@media (max-width:768px)': {
            minWidth: 80,
            fontSize: '0.75rem',
            padding: '6px 8px',
          },
        },
      },
    },
    
    // Tooltip 优化
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          '@media (max-width:768px)': {
            fontSize: '0.75rem',
          },
        },
      },
    },
    
    // Snackbar 优化
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            left: 8,
            right: 8,
            bottom: 8,
          },
        },
      },
    },
    
    // Grid 优化
    MuiGrid: {
      styleOverrides: {
        item: {
          '@media (max-width:768px)': {
            paddingLeft: 4,
            paddingTop: 4,
          },
        },
      },
    },
    
    // Container 优化
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            paddingLeft: 8,
            paddingRight: 8,
          },
        },
      },
    },
    
    // Paper 优化
    MuiPaper: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            borderRadius: 8,
          },
        },
      },
    },
    
    // Switch 优化
    MuiSwitch: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            padding: 8,
          },
        },
      },
    },
    
    // FormControlLabel 优化
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          '@media (max-width:768px)': {
            fontSize: '0.875rem',
          },
        },
      },
    },
    
    // Badge 优化
    MuiBadge: {
      styleOverrides: {
        badge: {
          '@media (max-width:768px)': {
            fontSize: '0.625rem',
            minWidth: 16,
            height: 16,
          },
        },
      },
    },
    
    // Avatar 优化
    MuiAvatar: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            width: 32,
            height: 32,
            fontSize: '0.875rem',
          },
        },
      },
    },
  },
});

// 暗色主题
const darkMobileTheme = createTheme({
  ...mobileTheme,
  palette: {
    ...mobileTheme.palette,
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
      contrastText: '#000000',
    },
    secondary: {
      main: '#f48fb1',
      light: '#fce4ec',
      dark: '#ad1457',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
});

// 高对比度主题
const highContrastTheme = createTheme({
  ...mobileTheme,
  palette: {
    ...mobileTheme.palette,
    primary: {
      main: '#000000',
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffffff',
      light: '#ffffff',
      dark: '#cccccc',
      contrastText: '#000000',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#000000',
    },
  },
  components: {
    ...mobileTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          border: '2px solid #000000',
          borderRadius: 4,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          border: '2px solid currentColor',
          borderRadius: 4,
        },
      },
    },
  },
});

// 主题选择器
export const getTheme = (mode = 'light') => {
  switch (mode) {
    case 'dark':
      return darkMobileTheme;
    case 'high-contrast':
      return highContrastTheme;
    default:
      return mobileTheme;
  }
};

export { mobileTheme, darkMobileTheme, highContrastTheme };
export default mobileTheme;