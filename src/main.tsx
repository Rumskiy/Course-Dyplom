// import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {App} from "./App.tsx";
import {AuthProvider} from "./Backend/Auth";
import {ThemeProvider} from "@mui/material/styles";
import {theme} from "./theme.tsx";


createRoot(document.getElementById('root') as HTMLElement).render(
            <ThemeProvider theme={theme}>
                <AuthProvider>
                    <App/>
                </AuthProvider>
            </ThemeProvider>
)
