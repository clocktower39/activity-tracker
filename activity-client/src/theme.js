import { createTheme } from '@mui/material';

export const theme = createTheme({
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
})
