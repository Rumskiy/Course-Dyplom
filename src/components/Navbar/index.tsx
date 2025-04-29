import { useContext } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Avatar, Container, Box, Button } from "@mui/material";
import { AuthContext } from "../../Backend/Auth";
import { useNavigate } from "react-router";
import { FiArrowUpRight, FiBookOpen, FiPlusCircle, FiBarChart2 } from "react-icons/fi";
import { CiUser } from "react-icons/ci";

export const Navbar = () => {
    // @ts-ignore
    const { user } = useContext(AuthContext);
    const nav = useNavigate();

    const handleAccountClick = () => {
        if (!user) {
            nav('/login');
        } else {
            nav('/account/settings');
        }
    };

    return (
        <AppBar position="fixed" color="default" elevation={1}>
            <Container maxWidth="lg">
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>

                    {/* Лого SkillUp */}
                    <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'pointer' }} onClick={() => nav('/')}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Skill
                        </Typography>
                        <FiArrowUpRight size={24} color="#1976d2" />
                    </Box>

                    {/* Навігація */}
                    <Box display="flex" alignItems="center" gap={2}>
                        <Button
                            startIcon={<FiBookOpen />}
                            variant="text"
                            color="inherit"
                            onClick={() => nav('/category')}
                            sx={{ textTransform: 'none', fontWeight: 500 }}
                        >
                            Усі курси
                        </Button>

                        <Button
                            startIcon={<FiPlusCircle />}
                            variant="text"
                            color="inherit"
                            onClick={() => nav('/course/create')}
                            sx={{ textTransform: 'none', fontWeight: 500 }}
                        >
                            Створити курс
                        </Button>

                        <Button
                            startIcon={<FiBarChart2 />}
                            variant="text"
                            color="inherit"
                            onClick={() => nav('/account/progress')}
                            sx={{ textTransform: 'none', fontWeight: 500 }}
                        >
                            Прогрес
                        </Button>

                        {/* Кнопка профілю */}
                        <IconButton color="inherit" onClick={handleAccountClick}>
                            {user ? (
                                <Avatar src={'/src/assets/5494.jpg'} />
                            ) : (
                                <CiUser size={24} />
                            )}
                        </IconButton>
                    </Box>

                </Toolbar>
            </Container>
        </AppBar>
    );
};
