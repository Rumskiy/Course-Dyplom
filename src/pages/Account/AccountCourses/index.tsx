import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../../../Backend/Auth";
import {useNavigate} from "react-router";
import {
    Box,
    Button,
    Container,
    Grid,
    Typography,
    Card,
    CardContent,
    CardActions,
    CardMedia
} from "@mui/material";
import {GetUserCourses} from "../../../api/Course";
import {AccountPage} from "../AccountPage";
import { apiClient } from "../../../api/api";

export function AccountCourses() {
    // @ts-ignore
    const {user} = useContext(AuthContext);
    const nav = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await GetUserCourses();
                setCourses(response.data);
            } catch (error) {
                console.error("Error fetching user courses:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchCourses();
    }, [user, loading]);

    const createCourse = () => {
        nav('/course/create');
    };

    const handleDeleteCourse = async (id: string) => {
        setLoading(true);
        try {
            const res = await apiClient.delete(`courses/${id}`);
            // window.location.reload();
            setLoading(false)
            return res;
        }catch(error) {
            console.log(error);
        }
    }

    return (
        <Container maxWidth="lg" sx={{mt: 12}}>
            <Grid container spacing={4}>
                {/* Sidebar - Профіль & Навігація */}
                <Grid item xs={12} md={4}>
                   <AccountPage/>
                </Grid>

                {/* Основний контент */}
                <Grid item xs={12} md={8}>
                    <Box sx={{p: 4, boxShadow: 3, borderRadius: 2, mb: 3}}>
                        <Typography variant="h4" component="h2" gutterBottom>
                            Your Courses
                        </Typography>
                        <Button variant="contained" color="primary" onClick={createCourse}>
                            ➕ Create Course
                        </Button>
                    </Box>
                    {loading ? (
                        <Typography>Loading courses...</Typography>
                    ) : courses?.length > 0 ? (
                        <Grid container spacing={3}>
                            {courses.map((course: any) => (
                                <Grid item xs={12} sm={6} md={4} key={course.id}>
                                    <Card sx={{boxShadow: 3, borderRadius: 2}}>
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={String(course?.title_img?.[0]?.link || "/placeholder.jpg")}
                                            alt={course.title}
                                        />
                                        <CardContent>
                                            <Typography variant="h6">{course.title}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {course.description.slice(0, 60)}
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            <Button size="small" color="primary" onClick={() => nav(`/course/${course.id}`)}>
                                                View
                                            </Button>
                                            <Button size="small" color="secondary" onClick={() => nav(`/course/edit/${course.id}`)}>
                                                Edit
                                            </Button>
                                            <Button size="small" color="error" onClick={() => handleDeleteCourse(course.id)}>
                                                Видалити
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Typography sx={{display: 'flex', justifyContent: 'center'}}>No courses found.</Typography>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
}
