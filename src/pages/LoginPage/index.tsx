import React, { useContext } from "react"; // Import React
import { TextField, Button, Container, Typography, Box } from "@mui/material";
import { LoginApi } from "../../api/Login"; // Verify path
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import { AuthContext } from "../../Backend/Auth"; // Verify path
import { useFormik } from "formik";
import * as Yup from "yup";

// Define an interface for the user info structure for clarity
interface UserInfo {
    id: string;
    token: string;
    role: string; // Or number, depending on your API/data model
    avatar: string | null; // Avatar URL can be a string or null
    // Add other essential user fields needed immediately after login if any
    // e.g., firstName: string; lastName: string; email: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    email?: string;
}

export const Login: React.FC = () => {
    // Safer context handling: Check if context exists
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    if (!authContext) {
        // Handle missing context provider - should ideally not happen
        console.error("AuthContext not found. Ensure Login is within AuthProvider.");
        return <Typography color="error">Authentication service unavailable.</Typography>;
    }
    const { login } = authContext; // Destructure after checking context

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        onSubmit: async (values, { setSubmitting }) => { // Add setSubmitting from formik
            try {
                // @ts-ignore
                const result = await LoginApi(values);

                // --- Safely Extract Avatar URL ---
                let avatarUrl: string | null = null;
                // Check if avatar data exists, is an array, has elements, and the first element has a 'link' or 'url'
                if (result.user.avatar && Array.isArray(result.user.avatar) && result.user.avatar.length > 0) {
                    // PRIORITIZE based on your MediaResource: Is it 'link', 'url', 'original_url'?
                    const firstAvatar = result.user.avatar[0];
                    avatarUrl = firstAvatar.url || firstAvatar.link || firstAvatar.original_url || null; // Adjust property name as needed
                }
                // --- ---

                // --- Construct UserInfo Object ---
                const userInfo: UserInfo = {
                    id: result.user.id,
                    token: result.token,
                    role: result.user.role,
                    avatar: avatarUrl, // Use the safely extracted URL or null
                    // Include other necessary info from result.user if needed by AuthContext/other parts of app
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    email: result.user.email,
                };

                // --- Store and Update Context ---
                // Store the comprehensive user info
                localStorage.setItem("userInfo", JSON.stringify(userInfo));

                // @ts-ignore
                login(userInfo);
                toast.success("Вхід вдався успішно!");
                navigate("/account/settings"); // Or to user dashboard

            } catch (error: any) { // Add type annotation for error
                console.error("Login failed:", error);
                // Provide more specific feedback if possible (e.g., from error.response.data)
                const message = error?.response?.data?.message || "Вхід не вдався, перевірте дані та спробуйте ще раз!";
                toast.error(message);
            } finally {
                setSubmitting(false); // Indicate submission is complete
            }
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Неправильна адреса електронної пошти').required("Обов'язково"),
            password: Yup.string().min(6, 'Пароль має містити принаймні 6 символів').required("Обов'язково"),
        })
    });

    return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
            <Typography variant="h4" textAlign="center" gutterBottom>
                Вхід
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit} noValidate> {/* Use Box component for form */}
                <TextField
                    label="Електронна пошта"
                    name="email"
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur} // Add onBlur for touch validation
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    fullWidth
                    margin="normal"
                    required // Add required attribute
                />
                <TextField
                    label="Пароль"
                    name="password"
                    type="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur} // Add onBlur for touch validation
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    fullWidth
                    margin="normal"
                    required // Add required attribute
                />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center', mt: 3 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={formik.isSubmitting} // Disable button while submitting
                    >
                        Увійти
                    </Button>
                    <Button
                        variant="text" // Use text button for secondary actions usually
                        component={Link} // Use Link for internal navigation
                        to="/register"
                        sx={{ textTransform: 'none' }} // Optional: prevent uppercase text
                    >
                        Немає акаунта? Зареєструватись
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};