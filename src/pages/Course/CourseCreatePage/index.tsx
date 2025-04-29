import {useEffect, useState} from "react";
import {useFormik} from "formik";
// import * as Yup from "yup";
import {
    TextField,
    Button,
    FormControl,
    Typography,
    Box, Container, MenuItem, Select, InputLabel,
} from "@mui/material";
import {Categories} from "../../../model.tsx";
import {useNavigate} from "react-router-dom";
import {CreateCourse} from "../../../api/Course";
import {CategoryGet} from "../../../api/Category";
import {toast} from "react-toastify";


const CourseCreate = () => {
    const [categories, setCategories] = useState<Categories[] | null>([]);
    const nav = useNavigate();
    const storedUser = localStorage.getItem('userInfo');
    const user = storedUser ? JSON.parse(storedUser).id : null;

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await CategoryGet();
                setCategories(res)
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const formik = useFormik({
        initialValues: {
            title: '',
            title_img: null as File | null, // Better type for file input
            description: '',
            category_id: '',
            id: "",
            author_id: ""
        },
        onSubmit: async (values) => {
            try {
                const formData = new FormData();
                formData.append("title", values.title);

                if (values.title_img) {
                    formData.append("title_img", values.title_img);
                }

                formData.append("description", values.description);
                formData.append("category_id", values.category_id);
                formData.append("author_id", user);

                if (values.id) {
                    formData.append("id", values.id);
                }

                await CreateCourse(formData);
                toast.success("Course created successfully!");
                nav('/account/courses')
            } catch (error) {
                console.error("Error creating course:", error);
                toast.error("Failed to create course");
            }
        }
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            formik.setFieldValue("title_img", event.target.files[0]);
        }
    };


    return (
        <Container>
            <Box sx={{maxWidth: 1200, mx: "auto", mt: 12}}>
                <Button onClick={() => nav('/account/courses')}>Вернутися назад</Button>
                <form style={{maxWidth: '1000px', margin: '0 auto', paddingTop: '40px'}}
                      onSubmit={formik.handleSubmit}
                >
                    <Typography variant="h4" gutterBottom>
                        Створити курс
                    </Typography>
                    <FormControl fullWidth sx={{mb: 3}}>
                        <TextField
                            label="Заголовок курсу"
                            name="title"
                            value={formik.values.title}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                    </FormControl>
                    <input
                        type="file"
                        name="title_img"
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ marginBottom: "16px" }}
                    />
                    <FormControl fullWidth sx={{mb: 3}}>
                        <TextField
                            label="Опис"
                            name="description"
                            multiline
                            maxRows={'4'}
                            variant={'outlined'}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                    </FormControl>


                    {
                        categories == null ? <></> :
                            <FormControl fullWidth sx={{mb: 3}}>
                                <InputLabel id="category-label">Category</InputLabel>
                                <Select
                                    labelId="category-label"
                                    name="category_id"
                                    value={formik.values.category_id}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    variant='standard'>
                                    <MenuItem value="">Select Category</MenuItem>
                                    {
                                        categories.map((cat) => (
                                            <MenuItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </MenuItem>
                                        ))
                                    }
                                </Select>
                            </FormControl>
                    }

                    <Button type="submit" variant="contained" color="primary" fullWidth>
                        Create Course
                    </Button>
                </form>
            </Box>
        </Container>
    );
};

export default CourseCreate;
