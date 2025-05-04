import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Avatar,
    Box,
    Button,
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
} from '@mui/material';
import profileImg from '../../../assets/5494.jpg';
import { AuthContext } from '../../../Backend/Auth';

export function AccountPage() {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    if (!authContext) {
        console.error('AuthContext not found. Ensure AccountPage is within AuthProvider.');
        return (
            <Typography color="error" sx={{ p: 3 }}>
                Authentication service unavailable.
            </Typography>
        );
    }

    const { user, logout } = authContext;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return (
            <Typography sx={{ p: 3 }}>
                Будь ласка, увійдіть, щоб переглянути свій обліковий запис.
            </Typography>
        );
    }

    const userAvatarUrl = user.avatar || profileImg;

    return (
        <Box sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar
                    src={userAvatarUrl}
                    alt={
                        user.firstName || user.lastName
                            ? `${user.firstName} ${user.lastName}'s Avatar`
                            : 'User Avatar'
                    }
                    sx={{ width: 150, height: 150, mx: 'auto', mb: 1 }}
                />
                {(user.firstName || user.lastName) && (
                    <Typography variant="h6">
                        {user.firstName} {user.lastName}
                    </Typography>
                )}
                {user.email && (
                    <Typography variant="body2" color="text.secondary">
                        {user.email}
                    </Typography>
                )}
            </Box>

            <List component="nav">
                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/account/settings">
                        <ListItemText primary="⚙️ Налаштування" />
                    </ListItemButton>
                </ListItem>
                <Divider component="li" />
                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/account/courses">
                        <ListItemText primary="📚 Ваші курси" />
                    </ListItemButton>
                </ListItem>
                <Divider component="li" />
                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/account/progress">
                        <ListItemText primary="📝 Ваші результати" />
                    </ListItemButton>
                </ListItem>
                <Divider component="li" />
                <ListItem sx={{ mt: 2 }}>
                    <Button variant="outlined" color="error" fullWidth onClick={handleLogout}>
                        Вийти
                    </Button>
                </ListItem>
            </List>
        </Box>
    );
}