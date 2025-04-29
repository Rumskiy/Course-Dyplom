import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Define base colors for easier reference and potential theming later
const PRIMARY_COLOR = '#1976D2'; // A standard, reliable blue (slightly different from Google's, common MUI default)
const SECONDARY_COLOR = '#FF8F00'; // A slightly deeper, more grounded orange/amber than pure yellow
const ERROR_COLOR = '#D32F2F';
const WARNING_COLOR = '#FFA000';
const INFO_COLOR = '#1976D2'; // Can reuse primary or choose a distinct info blue
const SUCCESS_COLOR = '#2E7D32';
const BACKGROUND_DEFAULT = '#F8F9FA'; // Very light grey, almost white
const BACKGROUND_PAPER = '#FFFFFF'; // Pure white for cards/paper
const TEXT_PRIMARY = '#212121'; // Very dark grey (not pure black)
const TEXT_SECONDARY = '#666666'; // Medium grey for secondary text
const TEXT_DISABLED = '#BDBDBD'; // Lighter grey for disabled states
const BORDER_COLOR = 'rgba(0, 0, 0, 0.12)'; // Subtle border/divider

// Create the theme instance
let theme = createTheme({
    // --- PALETTE ---
    palette: {
        primary: {
            main: PRIMARY_COLOR,
            light: '#63A4FF', // Lighter shade for hover/accents
            dark: '#004BA0', // Darker shade for active/focused states
            contrastText: '#FFFFFF', // Text color on primary background
        },
        secondary: {
            main: SECONDARY_COLOR,
            light: '#FFC046',
            dark: '#C56000',
            contrastText: '#000000', // Black text usually works better on amber/orange
        },
        error: {
            main: ERROR_COLOR,
            contrastText: '#FFFFFF',
        },
        warning: {
            main: WARNING_COLOR,
            contrastText: '#000000',
        },
        info: {
            main: INFO_COLOR,
            contrastText: '#FFFFFF',
        },
        success: {
            main: SUCCESS_COLOR,
            contrastText: '#FFFFFF',
        },
        grey: { // MUI uses grey shades extensively
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#eeeeee',
            300: '#e0e0e0',
            400: '#bdbdbd',
            500: '#9e9e9e',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
            A100: '#d5d5d5',
            A200: '#aaaaaa',
            A400: '#303030',
            A700: '#616161',
        },
        text: {
            primary: TEXT_PRIMARY,
            secondary: TEXT_SECONDARY,
            disabled: TEXT_DISABLED,
        },
        divider: BORDER_COLOR,
        background: {
            default: BACKGROUND_DEFAULT,
            paper: BACKGROUND_PAPER,
        },
        action: {
            active: 'rgba(0, 0, 0, 0.54)',
            hover: 'rgba(0, 0, 0, 0.04)', // Light hover for lists etc.
            selected: 'rgba(0, 0, 0, 0.08)',
            disabled: 'rgba(0, 0, 0, 0.26)',
            disabledBackground: 'rgba(0, 0, 0, 0.12)',
        },
    },

    // --- TYPOGRAPHY ---
    typography: {
        fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif", // Prioritize Inter
        htmlFontSize: 16, // Standard base size
        h1: {
            fontSize: "3rem", // 48px
            fontWeight: 700,
            lineHeight: 1.2,
        },
        h2: {
            fontSize: "2.25rem", // 36px - Slightly smaller than your original for better spacing
            fontWeight: 700,
            lineHeight: 1.25,
        },
        h3: {
            fontSize: "1.875rem", // 30px
            fontWeight: 600,
            lineHeight: 1.3,
        },
        h4: {
            fontSize: "1.5rem", // 24px - Slightly smaller
            fontWeight: 600,
            lineHeight: 1.35,
        },
        h5: {
            fontSize: "1.25rem", // 20px
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h6: {
            fontSize: "1.125rem", // 18px - Slightly larger for subtitle emphasis
            fontWeight: 500, // Less bold than other headings
            lineHeight: 1.4,
        },
        subtitle1: {
            fontSize: "1rem", // 16px
            fontWeight: 500,
        },
        subtitle2: {
            fontSize: "0.875rem", // 14px
            fontWeight: 400,
            color: TEXT_SECONDARY,
        },
        body1: { // Default paragraph text
            fontSize: "1rem", // 16px
            fontWeight: 400,
            lineHeight: 1.6, // Good readability
        },
        body2: { // Secondary paragraph text
            fontSize: "0.875rem", // 14px
            fontWeight: 400,
            lineHeight: 1.5,
            color: TEXT_SECONDARY,
        },
        button: { // Default button text style
            fontSize: "0.9375rem", // 15px
            fontWeight: 500,
            textTransform: "none", // Keep your preference
            letterSpacing: '0.01em',
        },
        caption: {
            fontSize: "0.75rem", // 12px
            color: TEXT_SECONDARY,
        },
        overline: {
            fontSize: "0.75rem", // 12px
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
        }
    },

    // --- SHAPE ---
    shape: {
        borderRadius: 8, // Consistent base border radius (can be overridden per component)
    },

    // --- SHADOWS --- (Optional: Customize for softer shadows)
    shadows: [
        'none',
        '0px 1px 3px rgba(0, 0, 0, 0.1)', // elevation 1
        '0px 1px 5px rgba(0, 0, 0, 0.1)', // elevation 2 (subtle card shadow)
        '0px 1px 8px rgba(0, 0, 0, 0.1)', // elevation 3
        '0px 2px 4px -1px rgba(0,0,0,0.1), 0px 4px 5px 0px rgba(0,0,0,0.07), 0px 1px 10px 0px rgba(0,0,0,0.06)', // MUI default 4 - AppBars etc.
        // ... add more or keep MUI defaults
    ] as any, // Use 'as any' if TS complains about array length mismatch with MUI's expected 25 shadows

    // --- SPACING --- (Usually keep MUI default of 8px)
    // spacing: 8,

    // --- COMPONENTS ---
    components: {
        // Global styles
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: BACKGROUND_DEFAULT, // Apply default bg to body
                },
                '*': { // Smooth scroll behavior
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${TEXT_DISABLED} ${BACKGROUND_DEFAULT}`,
                },
                '*::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                },
                '*::-webkit-scrollbar-track': {
                    background: BACKGROUND_PAPER, // Or BACKGROUND_DEFAULT
                    borderRadius: '4px',
                },
                '*::-webkit-scrollbar-thumb': {
                    backgroundColor: TEXT_DISABLED,
                    borderRadius: '4px',
                    border: `2px solid ${BACKGROUND_PAPER}`, // Or BACKGROUND_DEFAULT
                },
            },
        },
        // --- Button ---
        MuiButton: {
            defaultProps: {
                disableElevation: true, // Cleaner look for buttons
            },
            styleOverrides: {
                root: {
                    borderRadius: 8, // Consistent with shape
                    textTransform: "none", // Keep your preference
                    fontWeight: 500,
                    padding: '8px 16px', // Slightly more padding
                    transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                },
                containedPrimary: {
                    '&:hover': {
                        backgroundColor: '#1565C0', // Darker primary on hover
                        boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)', // Subtle shadow on hover
                    }
                },
                containedSecondary: {
                    color: '#000000', // Ensure contrast
                    '&:hover': {
                        backgroundColor: '#EF6C00', // Darker secondary on hover
                        boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
                    }
                },
                outlinedPrimary: {
                    borderWidth: '1px',
                    '&:hover': {
                        borderWidth: '1px', // Prevent border jump on hover
                        backgroundColor: 'rgba(25, 118, 210, 0.04)' // Primary hover background
                    }
                },
                textPrimary: {
                    '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)' // Primary hover background
                    }
                }
            },
        },
        // --- TextField ---
        MuiTextField: {
            defaultProps: {
                variant: "outlined", // Keep your preference
                size: "small", // Slightly smaller default for forms
            },
            styleOverrides: {
                root: {
                    // Adjust label styles if needed
                }
            }
        },
        // --- Card ---
        MuiCard: {
            defaultProps: {
                elevation: 0, // Use border instead of shadow by default for cleaner look
            },
            styleOverrides: {
                root: {
                    borderRadius: 12, // Slightly less rounded than your original 16
                    border: `1px solid ${BORDER_COLOR}`, // Subtle border
                    backgroundColor: BACKGROUND_PAPER,
                },
            },
        },
        // --- Paper --- (Base for Cards, Dialogs etc.)
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Remove gradient background if default theme adds one
                },
                elevation1: { // Example: Style for elevation 1
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                },
                // Add overrides for other elevation levels if needed
            }
        },
        // --- AppBar --- (Common for navigation)
        MuiAppBar: {
            defaultProps: {
                elevation: 1, // Subtle elevation or 0 for flat design
                color: 'inherit', // Use background color by default, less intrusive
            },
            styleOverrides: {
                root: {
                    backgroundColor: BACKGROUND_PAPER, // Or primary.main if you want a colored bar
                    borderBottom: `1px solid ${BORDER_COLOR}`
                },
                colorInherit: {
                    backgroundColor: BACKGROUND_PAPER,
                    color: TEXT_PRIMARY,
                }
            }
        },
        // --- Link ---
        MuiLink: {
            defaultProps: {
                underline: 'hover', // Underline only on hover
            },
            styleOverrides: {
                root: {
                    color: PRIMARY_COLOR,
                    fontWeight: 500,
                    '&:hover': {
                        color: '#004BA0', // primary.dark
                    }
                }
            }
        },
        // --- Chip ---
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                }
            }
        },
        // --- Tooltip ---
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker tooltip
                    fontSize: '0.8rem',
                },
                arrow: {
                    color: 'rgba(0, 0, 0, 0.8)',
                }
            }
        },
        // --- List Items --- (Good for navigation/menus)
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    '&.Mui-selected': { // Styles for selected item
                        backgroundColor: 'rgba(25, 118, 210, 0.08)', // primary adjusted transparency
                        '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.12)',
                        },
                        // You can add borderLeft here too if desired for sidebars
                        // borderLeft: `3px solid ${PRIMARY_COLOR}`,
                        // paddingLeft: '13px', // Adjust padding if using border
                    },
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)', // action.hover
                    }
                }
            }
        }
    },
});

// Apply responsive font sizes
theme = responsiveFontSizes(theme);

export { theme }; // Export the final theme object