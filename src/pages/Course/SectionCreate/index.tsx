import React, { useState } from "react"; // Додано useState
import { Container, TextField, Typography, Box, Paper, Button, CircularProgress, IconButton } from "@mui/material"; // Додано CircularProgress, IconButton
import { TiptapEditor } from "../../../components/TiptapEditor";
import { createSectionApi } from "../../../api/Section"; // Перейменуємо CreateSection на createSectionApi для ясності
import { useParams } from "react-router";
import { useForm, Controller } from "react-hook-form"; // Додано Controller
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront'; // Для відео
import DeleteIcon from '@mui/icons-material/Delete';

// Тип для даних форми
interface SectionCreateFormData {
    title: string;
    description: string;
    contentSection: string;
    section_file: File | null; // Для файлу домашнього завдання
    section_video: File | null; // Для відео
}

export const SectionCreate = () => {
    const nav = useNavigate();
    const { id: courseId } = useParams<{ id: string }>(); // Вказуємо тип для useParams
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control, // Додано для Controller
        formState: { errors },
    } = useForm<SectionCreateFormData>({
        defaultValues: {
            title: "",
            description: "",
            contentSection: "",
            section_file: null,
            section_video: null,
        },
    });

    const currentFile = watch("section_file");
    const currentVideo = watch("section_video");

    const handleSectionContentChange = (content: string) => {
        setValue("contentSection", content, { shouldValidate: true, shouldDirty: true });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'section_file' | 'section_video') => {
        if (event.target.files && event.target.files[0]) {
            setValue(fieldName, event.target.files[0], { shouldValidate: true, shouldDirty: true });
        } else {
            setValue(fieldName, null, { shouldValidate: true, shouldDirty: true }); // Якщо файл скасовано
        }
    };

    const clearFile = (fieldName: 'section_file' | 'section_video') => {
        setValue(fieldName, null, { shouldValidate: true, shouldDirty: true });
    };


    const onSubmit = async (data: SectionCreateFormData) => {
        if (!courseId) {
            toast.error("ID курсу не знайдено!");
            return;
        }
        setIsLoading(true);

        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description || ""); // Якщо опис порожній, можна надіслати порожній рядок
        formData.append("contentSection", data.contentSection);
        formData.append("course_id", courseId);

        if (data.section_file) {
            formData.append("section_file", data.section_file);
        }
        if (data.section_video) {
            formData.append("section_video", data.section_video);
        }

        try {
            await createSectionApi(formData); // Надсилаємо FormData
            toast.success('Розділ успішно створено!');
            nav(`/course/edit/${courseId}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Помилка створення розділу!');
            console.error("Помилка при збереженні розділу:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container sx={{ mt: 10, display: "flex", flexDirection: "column", gap: 3 }} maxWidth={'md'}>
            <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Створення розділу
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                            Назва розділу <span style={{ color: 'red' }}>*</span>
                        </Typography>
                        <TextField
                            {...register("title", { required: "Назва розділу є обов’язковою" })}
                            fullWidth
                            variant="outlined"
                            error={!!errors.title}
                            helperText={errors.title?.message}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                            Опис розділу
                        </Typography>
                        <TextField
                            {...register("description")}
                            fullWidth
                            variant="outlined"
                            multiline
                            rows={3}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                            Вміст розділу (основний матеріал) <span style={{ color: 'red' }}>*</span>
                        </Typography>
                        <Controller
                            name="contentSection"
                            control={control}
                            rules={{ required: "Вміст секції є обов'язковим" }} // Додамо валідацію
                            render={({ field, fieldState: { error: contentError } }) => (
                                <>
                                    <TiptapEditor content={field.value} onChange={handleSectionContentChange} />
                                    {contentError && <Typography color="error" variant="caption">{contentError.message}</Typography>}
                                </>
                            )}
                        />
                        {errors.contentSection && <Typography color="error" variant="caption">{errors.contentSection.message}</Typography>}
                    </Box>

                    {/* Завантаження файлу домашнього завдання */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                            Файл домашнього завдання (опціонально)
                        </Typography>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            sx={{ textTransform: 'none', mr: 1 }}
                        >
                            {currentFile ? `Вибрано: ${currentFile.name}` : "Вибрати файл ДЗ"}
                            <input
                                type="file"
                                hidden
                                onChange={(e) => handleFileChange(e, 'section_file')}
                                accept=".pdf,.doc,.docx,.zip,.rar,.txt,.jpg,.jpeg,.png"
                            />
                        </Button>
                        {currentFile && (
                            <IconButton onClick={() => clearFile('section_file')} size="small" color="warning">
                                <DeleteIcon />
                            </IconButton>
                        )}
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            PDF, DOC, DOCX, ZIP, RAR, TXT, JPG, PNG. Макс. 10MB.
                        </Typography>
                    </Box>

                    {/* Завантаження відео */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                            Відео для розділу (опціонально)
                        </Typography>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<VideoCameraFrontIcon />}
                            sx={{ textTransform: 'none', mr: 1 }}
                        >
                            {currentVideo ? `Вибрано: ${currentVideo.name}` : "Вибрати відео"}
                            <input
                                type="file"
                                hidden
                                onChange={(e) => handleFileChange(e, 'section_video')}
                                accept="video/mp4,video/x-m4v,video/*" // Або конкретніші типи
                            />
                        </Button>
                        {currentVideo && (
                            <IconButton onClick={() => clearFile('section_video')} size="small" color="warning">
                                <DeleteIcon />
                            </IconButton>
                        )}
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            MP4, MOV, AVI. Макс. 200MB.
                        </Typography>
                    </Box>


                    <Button type="submit" variant="contained" color="primary" disabled={isLoading} sx={{ mt: 2 }}>
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : "Створити розділ"}
                    </Button>
                </form>
            </Paper>
        </Container>
    );
};