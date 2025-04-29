import {useContext} from 'react';
import {AuthContext} from '../../Backend/Auth';
import {useNavigate} from 'react-router-dom';
import {
    Avatar,
    Box,
    Button,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import profileImg from "../../assets/5494.jpg";

export function AccountPage() {
    const {user, logout} = useContext(AuthContext)!;
    const navigate = useNavigate();

    const logOut = () => {
        if (user !== undefined) {
            logout();
            navigate('/login');
        }
    };

    return (
                    <Box sx={{p: 3, boxShadow: 3, borderRadius: 2}}>
                        {/* Profile Picture */}
                        <Box sx={{textAlign: 'center'}}>
                            <Avatar
                                src={profileImg} alt="Profile"
                                sx={{width: 150, height: 150, mx: 'auto', mb: 2}}
                            />
                        </Box>
                        {/* Account Links */}
                        <List>
                            <ListItem component="a" href="/account/settings">
                                <ListItemText primary="⚙️ Налаштування"/>
                            </ListItem>
                            <Divider/>
                            <ListItem component="a" href="/account/courses">
                                <ListItemText primary="📚 Ваші курси"/>
                            </ListItem>
                            <Divider/>
                            <ListItem component="a" href="/account/progress">
                                <ListItemText primary="📝 Ваші результати"/>
                            </ListItem>
                            <Divider/>
                            <ListItem>
                                <Button variant="outlined" color="error" fullWidth onClick={logOut}>
                                    Logout
                                </Button>
                            </ListItem>
                        </List>
                    </Box>
    );
}