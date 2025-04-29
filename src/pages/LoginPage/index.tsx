import {useContext} from "react";
import {TextField, Button, Container, Typography, Box} from "@mui/material";
import {LoginApi} from "../../api/Login";
import {toast} from "react-toastify";
import {useNavigate} from "react-router-dom";
import {AuthContext} from "../../Backend/Auth";
import {useFormik} from "formik";
import * as Yup from "yup";

export const Login: React.FC = () => {
    const {login} = useContext(AuthContext)!;
    const navigate = useNavigate();

    const formik = useFormik({
            initialValues: {
                email: '',
                password: '',
            },
            onSubmit: async values => {
                try {
                    const result = await LoginApi(values);
                    const userInfo = {
                        id: result.user.id,
                        token: result.token,
                        role: result.user.role,
                        avatar: result.user.avatar
                    };

                    localStorage.setItem("userInfo", JSON.stringify(userInfo));
                    login(userInfo);
                    toast.success("Вхід вдався успішно!");
                    navigate("/account/settings");
                } catch (error) {
                    toast.error("Вхід не вдався, спробуйте ще раз!");
                }

            },
            validationSchema: Yup.object({
                email: Yup.string().email('Invalid email address').required('Required'),
                password: Yup.string().min(6, 'Write your password ').required('Required'),
            })
        }
    )


    return (
        <Container maxWidth="sm" sx={{mt: 10}}>
            <Typography variant="h4" textAlign="center" gutterBottom>Login</Typography>
            <form onSubmit={formik.handleSubmit}>
                <TextField
                    label="Email"
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
                <TextField
                    label="Password"
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
                <Box sx={{display: "flex", justifyContent: "space-between", mt: 3}}>
                    <Button type="submit" variant="contained" color="primary">Login</Button>
                    <Button variant="outlined" href="/register">Sign Up</Button>
                </Box>
            </form>
        </Container>
    );
};