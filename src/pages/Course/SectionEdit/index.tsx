import {useEffect} from "react";
import { Container, TextField, Typography, Box, Paper, Button } from "@mui/material";
import { TiptapEditor } from "../../../components/TiptapEditor";
import { getSectionsById, UpdateSection } from "../../../api/Section";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const EditSection = () => {
    const nav = useNavigate();
    const { id: sectionId } = useParams();
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
        course_id: string;
    }>({
        defaultValues: {
            title: "",
            description: "",
            contentSection: "",
            course_id: ""
        },
    });

    useEffect(() => {
        const fetchSection = async () => {
            try {
                // @ts-ignore
                const section = await getSectionsById(sectionId);
                setValue("title", section.title);
                setValue("description", section.description || "");
                setValue("contentSection", section.contentSection);
                setValue("course_id", section.course_id);
            } catch (error) {
                toast.error("Не вдалося завантажити секцію");
                console.error("Помилка завантаження секції:", error);
            }
        };
        fetchSection();
    }, [sectionId, setValue]);

    const sectionContent = watch("contentSection");

    const handleSectionContentChange = (content: string) => {
        setValue("contentSection", content);
    };

    const onSubmit = async (data: { title: string; description: string; contentSection: string, course_id: string }) => {
        try {
            // @ts-ignore
            await UpdateSection(sectionId, data);
            nav(`/course/edit/${data.course_id}`);
            toast.success("Секцію успішно оновлено!");
        } catch (error) {
            toast.error("Помилка оновлення секції");
            console.error("Помилка при оновленні секції:", error);
        }
    };

    return (
        <Container sx={{ mt: 10, display: "flex", flexDirection: "column", gap: 3 }} maxWidth={'md'}>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Редагування секції
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Назва секції
                    </Typography>
                    <TextField
                        label="Назва секції"
                        {...register("title", { required: "Це поле обов’язкове" })}
                        fullWidth
                        variant="outlined"
                        error={!!errors.title}
                        helperText={errors.title?.message}
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Опис секції
                    </Typography>
                    <TextField
                        label="Опис"
                        {...register("description")}
                        fullWidth
                        variant="outlined"
                    />
                </Box>

                <Typography variant="h6" color="textSecondary" gutterBottom>
                    Вміст секції
                </Typography>
                <TiptapEditor content={sectionContent} onChange={handleSectionContentChange} />

                <Button variant="contained" color="primary" onClick={handleSubmit(onSubmit)}>
                    Оновити секцію
                </Button>
            </Paper>
        </Container>
    );
};