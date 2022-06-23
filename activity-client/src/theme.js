import { createTheme } from '@mui/material';
import { store } from './Redux/store';

const lightTheme = {
    palette: {
        mode: 'light',
        background: {
            categoryBackground: 'grey',
            goalContainer: '#DDD',
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    fontSize: '1rem',
                },
            },
        },
    },
};

const darkTheme = {
    palette: {
        mode: 'dark',
        background: {
            categoryBackground: '#1B1B1B',
            goalContainer: '#303030',
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    fontSize: '1rem',
                },
            },
        },
    },
}

export const theme = () => createTheme(store.getState().user.themeMode === 'light' ? lightTheme : darkTheme);
