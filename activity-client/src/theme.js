import { createTheme } from '@mui/material';

export const theme = createTheme({
    typography: {
        h6: {
            fontFamily: "Roboto"
        }
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
        MuiTextField: {
            styleOverrides: {
                root: {
                    borderBottomColor: "white",
                    "& input": {
                        color: "white",
                    },
                    "& label": {
                        color: "white",
                    },
                    "& label.Mui-focused": {
                        color: "white",
                    },
                    "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": {
                            borderColor: "white",
                        },
                    },
                    "& .MuiInput-underline:before": {
                        borderBottomColor: "white",
                    },
                    "& .MuiInput-underline:after": {
                        borderBottomColor: "white",
                    },
                    "& .MuiNativeSelect-select": {
                      color: 'white',
                    },
                    "& .MuiNativeSelect-select option": {
                      color: 'black',
                    },
                    "& .MuiSvgIcon-root": {
                      color: 'white',
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: 'white',
                    },
                    "& .MuiOutlinedInput-notchedOutline:hover": {
                      borderColor: 'white',
                    }

                }
            },

        }
    },
    overrides: {
        MuiInputBase: {
        }
    }
})
