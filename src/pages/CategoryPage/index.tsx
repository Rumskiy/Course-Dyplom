import {useEffect, useState} from "react";
import {
    Box,
    Grid,
    Typography,
    List,
    ListItem,
    ListItemText,
    CircularProgress, Container,
} from "@mui/material";
import {CategoryGet} from "../../api/Category";
import {GetCourses, GetCoursesById} from "../../api/Course";
import {Categories, Course} from "../../model.tsx";
import {CategoryCard} from "../../components/Course/CategoryCard";

export const CategoryPage = () => {
    const [categories, setCategories] = useState<Categories[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const resCategory = await CategoryGet();
                setCategories(resCategory);
            } catch (err: any) {
                setError(err.message || "Error fetching categories");
            }
        };

        const fetchCourses = async () => {
            try {
                const resCourse = await GetCourses();
                setCourses(resCourse.data);
            } catch (err: any) {
                setError(err.message || "Error fetching courses");
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
        fetchCourses();
    }, []);

    const handleChoiceCategory = async (id: string | null) => {
        setLoading(true);
        try {
            // @ts-ignore
            const response = await GetCoursesById(id);
            setCourses(response.data.data);
        } catch (err: any) {
            setError(err.message || "Error fetching courses");
        } finally {
            setLoading(false);
        }
    };


    return (
        <Container maxWidth='xl'>
            <Box sx={{flexGrow: 1, p: 2, mt: 12}}>
                <Grid container spacing={2}>
                    {/* Sidebar with categories */}
                    <Grid item xs={12} md={3}>
                        <Typography variant="h6" gutterBottom>
                            Категорії
                        </Typography>
                        {loading ? (
                            <CircularProgress/>
                        ) : error ? (
                            <Typography color="error">{error}</Typography>
                        ) : categories?.length > 0 ? (
                            <List>
                                <ListItem onClick={() => handleChoiceCategory(null)}>
                                    <ListItemText primary="Всі курси"/>
                                </ListItem>
                                {categories.map((cat) => (
                                    <ListItem
                                        key={cat.id}
                                        onClick={() => handleChoiceCategory(cat.id)}
                                    >
                                        <ListItemText primary={cat.name}/>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography>No categories found.</Typography>
                        )}
                    </Grid>

                    {/* Main area for courses */}
                    <Grid item xs={12} md={9}>
                        <Typography variant="h6" gutterBottom>
                            Курси
                        </Typography>
                        {loading ? (
                            <CircularProgress/>
                        ) : error ? (
                            <Typography color="error">{error}</Typography>
                        ) : courses?.length > 0 ? (
                            <Grid container spacing={2}>
                                {courses.map((course) => (
                                    <Grid item xs={12} sm={6} md={4} key={course.id}>
                                        <CategoryCard course={course}/>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Typography>No courses available.</Typography>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};
