import {useEffect, useState, useCallback} from "react"; // Import React
import {
    Box,
    Grid,
    Typography,
    List,
    ListItemButton,
    ListItemText,
    CircularProgress,
    Container,
    Alert,
} from "@mui/material";
import {CategoryGet} from "../../api/Category";
import {GetCourses, GetCoursesById} from "../../api/Course";
import {Categories, Course} from "../../model.tsx";
import {CategoryCard} from "../../components/Course/CategoryCard";

export const CategoryPage = () => {
    const [categories, setCategories] = useState<Categories[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
    const [coursesLoading, setCoursesLoading] = useState<boolean>(true);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [coursesError, setCoursesError] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | number | null>(null);

    // Fetch Initial Data
    useEffect(() => {
        let isMounted = true;

        const fetchInitialData = async () => {
            setCategoriesLoading(true);
            setCoursesLoading(true);
            setCategoriesError(null);
            setCoursesError(null);
            setSelectedCategoryId(null);

            try {
                const [catResponse, courseResponse] = await Promise.all([
                    CategoryGet(),
                    GetCourses()
                ]);

                if (isMounted) {
                    setCategories(catResponse || []);
                    // Assuming GetCourses returns { data: Course[] }
                    setCourses(courseResponse.data || []);
                    console.log("Initial courses loaded:", courseResponse.data); // Log initial data
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error("Error fetching initial data:", err);
                    setCategoriesError("Failed to load categories.");
                    setCoursesError("Failed to load courses.");
                }
            } finally {
                if (isMounted) {
                    setCategoriesLoading(false);
                    setCoursesLoading(false);
                }
            }
        };

        fetchInitialData();

        return () => {
            isMounted = false;
        };
    }, []);

    // Handler for Category Selection
    const handleSelectCategory = useCallback(async (id: string | number | null) => {
        setSelectedCategoryId(id);
        setCoursesLoading(true);
        setCoursesError(null);
        setCourses([]); // Clear courses for better loading feedback

        try {
            let response;
            if (id === null) {
                // --- Fetching ALL courses ---
                response = await GetCourses();
                console.log("API Response (All Courses):", response);
                // GetCourses returns { data: Course[] } - Access the array directly
                const coursesArray = response.data || [];
                setCourses(Array.isArray(coursesArray) ? coursesArray : []); // Ensure it's an array

            } else {
                // --- Fetching courses by Category ID ---
                response = await GetCoursesById(id);
                console.log(`API Response (Category ${id}):`, response);
                // GetCoursesById returns { data: Course } - The single course object is nested
                const singleCourse = response.data; // Access the inner course object

                // Check if a course was found and wrap it in an array
                setCourses(singleCourse ? [singleCourse] : []); // Wrap the object in an array, or set empty array

            }
        } catch (err: any) {
            console.error(`Error fetching courses for category ${id}:`, err);
            setCoursesError(err.message || `Error fetching courses for category ${id}`);
            setCourses([]); // Ensure courses are empty on error
        } finally {
            setCoursesLoading(false);
        }
    }, []); // Dependencies are stable

    // This log will now show the actual array state after setCourses completes
    // console.log("Current courses state:", courses);

    return (
        <Container maxWidth='xl' sx={{mt: {xs: 8, sm: 10}}}>
            <Box sx={{flexGrow: 1, p: {xs: 1, sm: 2}}}>
                <Grid container spacing={3}>
                    {/* Sidebar with categories */}
                    <Grid item xs={12} md={3}>
                        <Typography variant="h6" gutterBottom component="div">
                            Категорії
                        </Typography>
                        {categoriesLoading ? (
                            <Box sx={{display: 'flex', justifyContent: 'center', p: 2}}>
                                <CircularProgress size={24}/>
                            </Box>
                        ) : categoriesError ? (
                            <Alert severity="error" sx={{m: 1}}>{categoriesError}</Alert>
                        ) : categories?.length > 0 ? (
                            <List component="nav" dense>
                                <ListItemButton
                                    selected={selectedCategoryId === null}
                                    onClick={() => handleSelectCategory(null)}
                                >
                                    <ListItemText primary="Всі курси"/>
                                </ListItemButton>
                                {categories.map((cat) => (
                                    <ListItemButton
                                        key={cat.id}
                                        selected={selectedCategoryId === cat.id}
                                        onClick={() => handleSelectCategory(cat.id)}
                                    >
                                        <ListItemText primary={cat.name}/>
                                    </ListItemButton>
                                ))}
                            </List>
                        ) : (
                            <Typography sx={{p: 1, color: 'text.secondary'}}>Категорій не знайдено.</Typography>
                        )}
                    </Grid>

                    {/* Main area for courses */}
                    <Grid item xs={12} md={9}>
                        <Typography variant="h6" gutterBottom component="div">
                            Курси
                        </Typography>
                        {coursesLoading ? (
                            <Box sx={{display: 'flex', justifyContent: 'center', p: 5}}>
                                <CircularProgress/>
                            </Box>
                        ) : coursesError ? (
                            <Alert severity="error" sx={{m: 1}}>{coursesError}</Alert>
                        ) : Array.isArray(courses) && courses.length > 0 ? ( // Added Array.isArray check
                            <Grid container spacing={2}>
                                {courses.map((course) => (
                                    // Ensure CategoryCard expects a Course object
                                    <Grid item xs={12} sm={6} lg={4} key={course.id}>
                                        <CategoryCard course={course}/>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Typography sx={{p: 2, textAlign: 'center', color: 'text.secondary'}}>
                                {/* Improved message */}
                                {coursesError ? 'Не вдалося завантажити курси.' : 'Курсів у цій категорії немає.'}
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};