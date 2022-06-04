import { createTheme } from '@mui/material';

const lightTheme = {
    palette:{
        mode: 'light',
        background: {
            categoryBackground: '#1B1B1B',
            goalContainer: '#303030',
        }
    },
    typography: {
    },
    components: {
        // Name of the component
        MuiButton: {
            styleOverrides: {
                // Name of the slot
                root: {
                    // Some CSS
                    fontSize: '1rem',
                },
            },
        },
    },
    overrides: {
        MuiInputBase: {
        }
    }
};

const darkTheme = {
    palette:{
        mode: 'dark',
        background: {
            categoryBackground: '#1B1B1B',
            goalContainer: '#303030',
        }
    },
    typography: {
    },
    components: {
        // Name of the component
        MuiButton: {
            styleOverrides: {
                // Name of the slot
                root: {
                    // Some CSS
                    fontSize: '1rem',
                },
            },
        },
    },
    overrides: {
        MuiInputBase: {
        }
    }
}

export const theme = (userThemeMode) => userThemeMode === 'light' ? createTheme(lightTheme) : createTheme(darkTheme);
