import {useContext, useState, useEffect} from 'react';
import {AuthContext} from '../../Backend/Auth';
import {useNavigate} from 'react-router-dom';
import {
    Avatar,
    Box,
    Button,
    Container,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemText,
    TextField,
    Typography
} from '@mui/material';
import profileImg from "../../assets/5494.jpg";
import {toast} from 'react-toastify';
import {AccountSettings, AccountSettingsSave} from "../../api/AccountSettings";
import {UpdateData} from "../../model.tsx";
import {AccountPage} from "../AccountPage";

export function AccountSetting() {
    const {user, logout} = useContext(AuthContext)!;
    const navigate = useNavigate();

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        const fetchAccountData = async () => {
            try {
                const res: UpdateData = await AccountSettings();
                setFormData({
                    firstName: res.firstName || '',
                    lastName: res.lastName || '',
                    email: res.email || '',
                    password: ''
                });
            } catch (error) {
                console.error('There was an error fetching the user data!', error);
            }
        };

        fetchAccountData();
    }, []);


    const handleSave = async (e: any) => {
        e.preventDefault();
        try {
            const res = await AccountSettingsSave(formData)
            toast.success(res.data.message);
            setEditMode(false);
        } catch (error) {
            toast.error('There was an error updating your account.');
            console.error('There was an error!', error);
        }
    };

    const handleChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const logOut = () => {
        if (user !== undefined) {
            logout();
            navigate('/login');
        }
    };

    return (
        <Container maxWidth="lg" sx={{mt: 12}}>
            <Grid container spacing={4}>
                {/* Sidebar - Profile & Links */}
                <Grid item xs={12} md={4}>
                    <AccountPage/>
                </Grid>

                {/* Main Content */}
                <Grid item xs={12} md={8}>
                    <Box sx={{p: 4, boxShadow: 3, borderRadius: 2}}>
                        <Typography variant="h4" component="h2" gutterBottom>
                            Account Settings
                        </Typography>

                        <Container maxWidth="sm">
                            <Box component="form" onSubmit={handleSave}
                                 sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                <TextField
                                    label="First Name"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    disabled={!editMode}
                                    required
                                />
                                <TextField
                                    label="Last Name"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    disabled={!editMode}
                                    required
                                />
                                <TextField
                                    label="Email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                />
                                <TextField
                                    label="New Password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={!editMode}
                                    helperText="Enter a new password (min. 6 characters)"
                                />
                                {editMode ? (
                                    <Box>
                                        <Button type="submit" variant="contained" color="primary"
                                                sx={{mr: 2}}>Save</Button>
                                        <Button variant="outlined" onClick={() => setEditMode(false)}>Cancel</Button>
                                    </Box>
                                ) : (
                                    <Button variant="contained" onClick={() => setEditMode(true)}>Edit</Button>
                                )}
                            </Box>
                        </Container>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
}