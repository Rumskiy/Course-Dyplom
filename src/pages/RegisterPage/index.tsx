import {Container, TextField, Button, Typography, Box, FormControl, MenuItem, InputLabel, Select} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {toast} from "react-toastify";
import {RegisterPost} from "../../api/Register";
import {useFormik} from "formik";
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';


export const Register = () => {
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            id: uuidv4(),
            firstName: '',
            lastName: '',
            email: '',
            role: '',
            password: '',
            password_confirmation: '',
        },
        onSubmit: values => {
            RegisterPost(values).then(() => {
                toast.success('Your acccount is ready, please login to it')
                navigate('/login');
            })
                .catch(error => {
                    toast.error('There was an error email is taken!', error)
                });
        },
        validationSchema: Yup.object({
            firstName: Yup.string().min(3, 'Must be 3 characters or more').required('Required'),
            lastName: Yup.string().min(3, 'Must be 3 characters or more').required('Required'),
            email: Yup.string().email('Invalid email address').required('Required'),
            role: Yup.string().min(1, 'Choice your role!').required('Required'),
            password: Yup.string().min(6, 'Write your password!').required('Required'),
            password_confirmation: Yup.string().min(6, 'Write your password!').required('Required'),
        })
    })

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <Container maxWidth="sm" sx={{mt: 12}}>
            <Typography variant="h4" component="h1" gutterBottom>
                Register
            </Typography>
            <form onSubmit={formik.handleSubmit}>
                <TextField
                    label="Ім'я"
                    name="firstName"
                    type='text'
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.firstName}
                    margin="normal"
                    fullWidth
                />
                {formik.touched.firstName && formik.errors.firstName ? (
                    <div style={{color: 'red'}}>{formik.errors.firstName}</div>
                ) : null}
                <TextField
                    label="Прізвище"
                    name="lastName"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    fullWidth
                    margin="normal"
                />
                {formik.touched.lastName && formik.errors.lastName ? (
                    <div style={{color: 'red'}}>{formik.errors.lastName}</div>
                ) : null}
                <TextField
                    label="Пошта"
                    name="email"
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    fullWidth
                    margin="normal"
                />
                {formik.touched.email && formik.errors.email ? (
                    <div style={{color: 'red'}}>{formik.errors.email}</div>
                ) : null}
                <FormControl fullWidth>
                    <InputLabel>Хто ви?</InputLabel>
                    <Select
                        name="role"
                        value={formik.values.role}
                        label="Role"
                        onChange={formik.handleChange}
                    >
                        <MenuItem value={1}>Student</MenuItem>
                        <MenuItem value={2}>Teacher</MenuItem>
                    </Select>
                    {formik.touched.role && formik.errors.role ? (
                        <div style={{color: 'red'}}>{formik.errors.role}</div>
                    ) : null}
                </FormControl>

                <TextField
                    label="Пароль"
                    name="password"
                    type="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    fullWidth
                    margin="normal"
                />
                {formik.touched.password && formik.errors.password ? (
                    <div style={{color: 'red'}}>{formik.errors.password}</div>
                ) : null}
                <TextField
                    label="Повторіть пароль"
                    name="password_confirmation"
                    type="password"
                    value={formik.values.password_confirmation}
                    onChange={formik.handleChange}
                    fullWidth
                    margin="normal"
                />
                {formik.touched.role && formik.errors.role ? (
                    <div style={{color: 'red'}}>{formik.errors.role}</div>
                ) : null}
                <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Button type="submit" variant="contained" color="primary">
                        Підтвердити
                    </Button>
                    <Button variant="text" color="primary" onClick={handleLogin}>
                        Ви вже маєте акаунт?
                    </Button>
                </Box>
            </form>
        </Container>
    );
};