import React, { useState, useEffect, ChangeEvent } from 'react';
import { Box, Button, Container, Grid, styled, TextField, Typography, Avatar } from '@mui/material';
import { toast } from 'react-toastify';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { AccountSettings, AccountSettingsSave } from '../../../api/AccountSettings';
import { UpdateData } from '../../../model';
import { AccountPage } from '../AccountPage';

const VisuallyHiddenInput = styled('input')({
    border: 0,
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: 1,
});

interface FormDataState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    avatarFile: File | null;
    avatarPreview: string | null;
}

export const AccountSetting = () => {
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<FormDataState>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        avatarFile: null,
        avatarPreview: null,
    });

    useEffect(() => {
        const fetchAccountData = async () => {
            try {

                const res: UpdateData = await AccountSettings();
                setFormData({
                    firstName: res.firstName || '',
                    lastName: res.lastName || '',
                    email: res.email || '',
                    password: '',
                    avatarFile: null,
                    avatarPreview: res.avatar_img || null,
                });
            } catch (error) {
                console.error('Error fetching account data:', error);
                toast.error('Failed to load account data');
            }
        };
        fetchAccountData();
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            const preview = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, avatarFile: file, avatarPreview: preview }));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('firstName', formData.firstName);
            data.append('lastName', formData.lastName);
            if (formData.password) {
                data.append('password', formData.password);
            }
            if (formData.avatarFile) {
                data.append('avatar_img', formData.avatarFile);
            }
            // @ts-ignore
            const res = await AccountSettingsSave(data);
            toast.success(res.data.message);
            setEditMode(false);
        } catch (error) {
            console.error('Error updating account:', error);
            toast.error('There was an error updating your account.');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 12 }}>
            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <AccountPage  />
                </Grid>
                <Grid item xs={12} md={8}>
                    <Box sx={{ p: 4, boxShadow: 3, borderRadius: 2 }}>
                        <Typography variant="h4" gutterBottom>
                            Account Settings
                        </Typography>
                        <Container maxWidth="sm">
                            <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {formData.avatarPreview && (
                                    <Avatar src={formData.avatarPreview} sx={{ width: 80, height: 80, mb: 2 }} />
                                )}
                                <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} disabled={!editMode}>
                                    {formData.avatarFile ? 'Змінити фото' : 'Завантажити фото'}
                                    <VisuallyHiddenInput name="avatar_img" type="file" accept="image/*" onChange={handleFileChange} />
                                </Button>
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
                                        <Button type="submit" variant="contained" sx={{ mr: 2 }}>
                                            Save
                                        </Button>
                                        <Button variant="outlined" onClick={() => setEditMode(false)}>
                                            Cancel
                                        </Button>
                                    </Box>
                                ) : (
                                    <Button variant="contained" onClick={() => setEditMode(true)}>
                                        Edit
                                    </Button>
                                )}
                            </Box>
                        </Container>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};
