// src/components/Navbar.tsx
import React, { useContext } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Avatar, Container, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiBookOpen, FiPlusCircle, FiBarChart2 } from 'react-icons/fi';
import { AuthContext } from '../../Backend/Auth';

export const Navbar: React.FC = () => {
    const authContext = useContext(AuthContext);
    if (!authContext) {
        console.error('AuthContext not found. Ensure Navbar is within AuthProvider.');
        return (
            <Typography color="error" sx={{ p: 3 }}>
                Authentication service unavailable.
            </Typography>
        );
    }

    const { user } = authContext;
    const isTeacher = user?.role === '1';

    return (
        <AppBar position="fixed" color="default" elevation={1}>
            <Container maxWidth="lg">
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'inherit' }}>Skill</Typography>
                        <FiArrowUpRight size={24} color="#1976d2" />
                    </Box>

                    {/* Navigation */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button component={Link} to="/category" startIcon={<FiBookOpen />} variant="text" color="inherit" sx={{ textTransform: 'none', fontWeight: 500 }}>
                            Усі курси
                        </Button>

                        {isTeacher && (
                            <Button component={Link} to="/course/create" startIcon={<FiPlusCircle />} variant="text" color="inherit" sx={{ textTransform: 'none', fontWeight: 500 }}>
                                Створити курс
                            </Button>
                        )}
                        {/*{user && (*/}
                        {/*    <Button component={Link} to="/course/create" startIcon={<FiPlusCircle />} variant="text" color="inherit" sx={{ textTransform: 'none', fontWeight: 500 }}>*/}
                        {/*        Створити курс*/}
                        {/*    </Button>*/}
                        {/*)}*/}

                        {user && (
                            <Button component={Link} to="/account/progress" startIcon={<FiBarChart2 />} variant="text" color="inherit" sx={{ textTransform: 'none', fontWeight: 500 }}>
                                Прогрес
                            </Button>
                        )}

                        <IconButton component={Link} to={user ? '/account/settings' : '/login'}>
                            <Avatar src={user?.avatar || ''} alt={user ? `${user.firstName} ${user.lastName}` : 'User Avatar'} />
                        </IconButton>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};
