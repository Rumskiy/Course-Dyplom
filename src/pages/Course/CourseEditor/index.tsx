import {useEffect, useState} from "react";
import {
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Typography,
    Container,
    TextField,
    Box, MenuItem, CircularProgress, styled,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {useFormik} from "formik";
import {useParams} from "react-router";
import {toast} from "react-toastify";
import {GetCoursesById, UpdateCourse} from "../../../api/Course";
import {getSections, DeleteSection} from "../../../api/Section";
import {CategoryGet} from "../../../api/Category";
import * as Yup from "yup";
import {useNavigate} from "react-router-dom";
import {Categories, Course, Section} from "../../../model.tsx";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {getTestBySectionId} from "../../../api/Test";

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export function EditorCourse() {
    const {id} = useParams<{ id: string }>();
    const [sections, setSections] = useState<Section[]>([]);
    const [course, setCourse] = useState<Course | null>(null);
    const [categories, setCategories] = useState<Categories[] | null>([]);
    const [tests, setTests] = useState<{ [key: string]: any }>({});
    const [editMode, setEditMode] = useState(false);
    const nav = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {

                const courseRes = await GetCoursesById(id);
                setCourse(courseRes.data);

                const sectionsRes = await getSections(id);
                setSections(sectionsRes || []);

                const categoriesRes = await CategoryGet();
                setCategories(categoriesRes);

                setIsLoading(true);

                const testsData: { [key: string]: any } = {};
                await Promise.all(
                    sectionsRes.map(async (section: any) => {
                        try {
                            const res = await getTestBySectionId(section.id);
                            if (res) {
                                testsData[section.id] = res;
                            }
                        } catch (error: any) {
                            if (error.response?.status === 404) {
                                console.warn(`No test found for section ${section.id}`);
                            } else {
                                console.error(`Error fetching test for section ${section.id}:`, error);
                            }
                        }
                    })
                );
                setTests(testsData);
                setIsLoading(false);


            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to fetch data.");
            }
        };

        fetchData();
    }, [id]);


    const validationSchema = Yup.object({
        title: Yup.string().required('Title is required'),
        description: Yup.string().required('Description is required'),
        category_id: Yup.number().required('Category is required'),
        title_img: Yup.mixed().nullable(),
    });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            title: course?.title || "",
            title_img: course?.title_img || null,
            description: course?.description || "",
            category_id: course?.category_id?.toString() || "",
        },
        validationSchema,
        onSubmit: async (values) => {
            if (!id) return
            try {

                const formData = new FormData();
                formData.append("title", values.title);

                if (values.title_img instanceof File) {
                    formData.append("title_img", values.title_img);
                }

                formData.append("description", values.description);
                formData.append("category_id", values.category_id);


                await UpdateCourse(id, formData);
                toast.success("Course updated successfully!");
                setEditMode(false);
                nav('/account/courses');

                const courseRes = await GetCoursesById(id);
                setCourse(courseRes.data);
            } catch (error: any) {
                if (error.response?.status === 403) {
                    toast.error("You don't have permission to update this course");
                } else {
                    toast.error("Error updating course.");
                }
                console.error("Update error:", error);
            }
        },
    });

    const handleDeleteSection = async (sectionId: string) => {
        if (id == undefined) return;

        try {
            setLoading(true)
            await DeleteSection(sectionId);
            toast.success("Section deleted successfully!");

            // Refresh sections list
            const sectionsRes = await getSections(id);
            setSections(sectionsRes || []);
            setLoading(false)
        } catch (error) {
            toast.error("Error deleting section.");
            console.error("Error deleting section:", error);
        }
    };

    return (
        <Container maxWidth="lg" sx={{mt: 12, px: 4}}>
            <Button onClick={() => nav(`/account/courses`)}>
                <Typography>
                    Вернутися назад
                </Typography>
            </Button>
            <Box sx={{mb: 4, p: 3, boxShadow: 3, borderRadius: 2}}>
                <Typography variant="h4" gutterBottom>
                    Рудагувати курс
                </Typography>

                <Box sx={{mb: 2}}>
                    {course?.title_img && (
                        <Box sx={{mt: 2}}>
                            <img
                                src={String(course.title_img[0].link)}
                                alt="Course Image"
                                style={{maxWidth: "100%", height: "auto"}}
                            />
                        </Box>
                    )}

                    <TextField
                        fullWidth
                        label="Заголовок курсу"
                        name="title"
                        disabled={!editMode}
                        value={formik.values.title}
                        onChange={formik.handleChange}
                        sx={{mb: 2}}
                    />
                    <TextField
                        fullWidth
                        label={'Опис курсу'}
                        name="description"
                        disabled={!editMode}
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        sx={{mb: 2}}
                    />
                    {categories !== null ? <TextField
                            select
                            fullWidth
                            label='Оберіть категорію'
                            name="category_id"
                            disabled={!editMode}
                            value={formik.values.category_id}
                            onChange={formik.handleChange}
                            sx={{mb: 2}}
                        >
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <MenuItem key={category.id} value={category.id}>
                                        {category.name}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>Loading...</MenuItem>
                            )}
                        </TextField> :
                        <p>Немає категорій, зверніться до адміністратора</p>
                    }
                    <Button
                        component="label"
                        role={undefined}
                        variant="contained"
                        tabIndex={-1}
                        sx={{}}
                        startIcon={<CloudUploadIcon/>}
                        disabled={!editMode}
                    >
                        Upload files
                        <VisuallyHiddenInput
                            type="file"
                            name="title_img"
                            onChange={(event) => {
                                if (event.currentTarget.files) {
                                    formik.setFieldValue(
                                        "title_img",
                                        event.currentTarget.files[0]
                                    );
                                }
                            }}
                            multiple
                        />
                    </Button>
                </Box>
                {editMode ? (
                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{mr: 2}}
                            onClick={() => formik.handleSubmit()}
                        >
                            Зберегти зміни
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setEditMode(false)}
                        >
                            Відмінити
                        </Button>
                    </Box>
                ) : (
                    <Button
                        variant="contained"
                        onClick={() => setEditMode(true)}
                    >
                        Редагувати
                    </Button>
                )}

            </Box>

            {/* Sections List */}
            <Box sx={{display: "flex", flexDirection: "row", gap: '24px'}}>
                <Typography variant="h4" gutterBottom>
                    Розділи
                </Typography>
                <Button variant={'contained'} onClick={() => nav(`/course/section/${id}/create`)}>
                    Додати новий розділ
                </Button>
            </Box>
            {sections.length > 0 ? (
                <List sx={{mt: 2, bgcolor: "background.paper", borderRadius: 2}}>
                    {sections.map((section) => (
                        <ListItem
                            sx={{display: "flex", gap: '24px'}}
                            key={section.id}
                            secondaryAction={
                                <>
                                    <IconButton
                                        edge="end"
                                        color="primary"
                                        onClick={() => {
                                            const hasTest = tests?.[section.id] !== undefined; // Уникаємо помилки
                                            nav(hasTest ? `/course/section/${section.id}/edit_test` : `/course/section/${section.id}/create_test`);
                                        }}
                                    >
                                        <Typography>
                                            {isLoading ? "Завантаження..." : tests?.[section.id] !== undefined ? "Редагувати тест" : "Створити тест"}
                                        </Typography>
                                    </IconButton>

                                    <IconButton edge="end" color="primary">
                                        <EditIcon
                                            onClick={() => nav(`/course/section/edit/${section.id}`)}
                                        />
                                    </IconButton>

                                    {loading ? (
                                        <CircularProgress size={'24px'}/>
                                    ) : (
                                        <IconButton
                                            edge="end"
                                            color="error"
                                            onClick={() => handleDeleteSection(section.id)}
                                        >
                                            <DeleteIcon/>
                                        </IconButton>
                                    )}
                                </>
                            }
                        >
                            <ListItemText primary={section.title}/>
                        </ListItem>

                    ))}
                </List>
            ) : (
                <Typography variant="body1">Розділів не знайдено. Створіть новий розділ для вашого курсу</Typography>
            )}
        </Container>
    );
}