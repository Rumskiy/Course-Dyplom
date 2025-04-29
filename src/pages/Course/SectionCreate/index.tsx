import {Container, TextField, Typography, Box, Paper, Button} from "@mui/material";
import {TiptapEditor} from "../../../components/TiptapEditor";
import {CreateSection} from "../../../api/Section";
import {useParams} from "react-router";
import {useForm} from "react-hook-form";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";

export const SectionCreate = () => {
    const nav = useNavigate();
    const {id: courseId} = useParams();
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<{
        title: string;
        description: string;
        contentSection: string;
    }>({
        defaultValues: {
            title: "",
            description: "",
            contentSection: "",
        },
    });


    const sectionContent = watch("contentSection");

    const handleSectionContentChange = (content: string) => {
        setValue("contentSection", content);
    };

    const onSubmit = async (data: { title: string; description: string; contentSection: string }) => {
        const payload = {
            title: data.title,
            description: data.description || "Опис розділу",
            contentSection: data.contentSection,
            course_id: courseId,
        };

        try {
            await CreateSection(payload);
            nav(`/course/edit/${courseId}`);
            toast.success('Section created successfully!');
        } catch (error) {
            toast.error('Section created failed!');
            console.error("Помилка при збереженні розділу:", error);
        }
    };

    // @ts-ignore
    return (
        <Container sx={{mt: 10, display: "flex", flexDirection: "column", gap: 3}} maxWidth={'md'}>
            <Paper elevation={2} sx={{p: 4, borderRadius: 3}}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Створення розділу
                </Typography>

                <Box sx={{mb: 3}}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Введіть назву розділу
                    </Typography>
                    <TextField
                        label="Назва розділу"
                        {...register("title", {required: "Це поле обов’язкове"})}
                        fullWidth
                        variant="outlined"
                        error={!!errors.title}
                        helperText={errors.title?.message}
                    />
                </Box>

                <Box sx={{mb: 3}}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Опис розділу
                    </Typography>
                    <TextField
                        label="Опис"
                        {...register("description")}
                        fullWidth
                        variant="outlined"
                    />
                </Box>

                <Typography variant="h6" color="textSecondary" gutterBottom>
                    Напишіть текст для розділу
                </Typography>
                <TiptapEditor content={sectionContent} onChange={handleSectionContentChange}/>

                <Button variant="contained" color="primary" onClick={handleSubmit(onSubmit)}>
                    Зберегти розділ
                </Button>
            </Paper>
        </Container>
    );
};
