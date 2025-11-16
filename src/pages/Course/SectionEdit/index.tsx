import React, { useEffect, useState } from "react"; // Додано useState
import { Container, TextField, Typography, Box, Paper, Button, CircularProgress, IconButton } from "@mui/material"; // Додано CircularProgress, IconButton
import { TiptapEditor } from "../../../components/TiptapEditor";
import { getSectionsById, updateSectionApi } from "../../../api/Section"; // Перейменовано UpdateSection на updateSectionApi для ясності
import { useParams } from "react-router";
import { useForm, Controller } from "react-hook-form"; // Додано Controller
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from '@mui/icons-material/Delete'; // Для видалення файлу
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; // Для відображення існуючого файлу

// Тип для даних форми
interface SectionFormData {
    title: string;
    description: string;
    contentSection: string;
    course_id: string; // Залишаємо, якщо потрібно для навігації
    section_file: File | null; // Для нового файлу
    remove_section_file: boolean; // Прапорець для видалення
}

// Тип для даних секції, отриманих з API
interface SectionDataFromServer {
    id: string;
    title: string;
    description: string | null;
    contentSection: string;
    course_id: string;
    media?: { // Припускаємо, що API повертає інформацію про медіа
        id: number;
        file_name: string;
        original_url: string;
        collection_name: string; // 'section_files' або 'default'
    }[];
    // section_file_url?: string; // Або пряме посилання на файл
    // section_file_name?: string;
}


export const EditSection = () => {
    const nav = useNavigate();
    const { id: sectionId } = useParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [existingFile, setExistingFile] = useState<{ name: string; url: string } | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control, // Додано для Controller
        formState: { errors },
    } = useForm<SectionFormData>({
        defaultValues: {
            title: "",
            description: "",
            contentSection: "",
            course_id: "",
            section_file: null,
            remove_section_file: false,
        },
    });

    useEffect(() => {
        const fetchSection = async () => {
            if (!sectionId) return;
            try {
                const section: SectionDataFromServer = await getSectionsById(sectionId);
                setValue("title", section.title);
                setValue("description", section.description || "");
                setValue("contentSection", section.contentSection);
                setValue("course_id", section.course_id);

                // Знаходимо файл, якщо він є (припускаючи колекцію 'section_files')
                const fileMedia = section.media?.find(m => m.collection_name === 'section_files'); // Або 'default'
                if (fileMedia) {
                    setExistingFile({ name: fileMedia.file_name, url: fileMedia.original_url });
                }
                // Якщо API повертає прямі посилання:
                // if (section.section_file_url && section.section_file_name) {
                //    setExistingFile({ name: section.section_file_name, url: section.section_file_url });
                // }

            } catch (error) {
                toast.error("Не вдалося завантажити дані секції");
                console.error("Помилка завантаження секції:", error);
            }
        };
        fetchSection();
    }, [sectionId, setValue]);

    const currentFile = watch("section_file"); // Стежимо за обраним файлом

    const handleSectionContentChange = (content: string) => {
        setValue("contentSection", content, { shouldValidate: true, shouldDirty: true });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setValue("section_file", event.target.files[0], { shouldValidate: true, shouldDirty: true });
            setValue("remove_section_file", false); // Якщо вибрали новий файл, не видаляємо старий автоматично
            setExistingFile(null); // Прибираємо відображення старого файлу, бо завантажуємо новий
        }
    };

    const handleRemoveExistingFile = () => {
        setExistingFile(null);
        setValue("section_file", null); // Очищуємо, якщо був вибраний новий файл
        setValue("remove_section_file", true); // Встановлюємо прапорець на видалення на бекенді
    };

    const onSubmit = async (data: SectionFormData) => {
        if (!sectionId) return;
        setIsLoading(true);

        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description || "");
        formData.append("contentSection", data.contentSection);
        // formData.append("course_id", data.course_id); // Якщо потрібно оновлювати course_id

        if (data.section_file) {
            formData.append("section_file", data.section_file);
        }
        if (data.remove_section_file && !data.section_file) { // надсилаємо прапорець, тільки якщо не завантажуємо новий файл
            formData.append("remove_section_file", "1"); // '1' для true
        }

        try {
            await updateSectionApi(sectionId, formData); // Надсилаємо FormData
            toast.success("Секцію успішно оновлено!");
            nav(`/course/edit/${data.course_id}`); // Переконуємось, що course_id є актуальним
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Помилка оновлення секції");
            console.error("Помилка при оновленні секції:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container sx={{ mt: 10, display: "flex", flexDirection: "column", gap: 3 }} maxWidth={'md'}>
            <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Редагування секції
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                            Назва секції <span style={{ color: 'red' }}>*</span>
                        </Typography>
                        <TextField
                            {...register("title", { required: "Назва секції є обов’язковою" })}
                            fullWidth
                            variant="outlined"
                            error={!!errors.title}
                            helperText={errors.title?.message}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                            Опис секції
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
                            Вміст секції (основний матеріал)
                        </Typography>
                        <Controller
                            name="contentSection"
                            control={control}
                            render={({ field }) => ( // field.value тут це contentSection
                                <TiptapEditor content={field.value} onChange={handleSectionContentChange} />
                            )}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                            Файл домашнього завдання
                        </Typography>
                        {existingFile && !currentFile && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, border: '1px dashed grey', borderRadius: 1 }}>
                                <InsertDriveFileIcon sx={{ mr: 1 }} />
                                <Typography component="a" href={existingFile.url} target="_blank" rel="noopener noreferrer" sx={{ mr: 2, textDecoration: 'none' }}>
                                    {existingFile.name}
                                </Typography>
                                <IconButton onClick={handleRemoveExistingFile} size="small" color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        )}
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            sx={{ textTransform: 'none' }}
                        >
                            {currentFile ? `Вибрано: ${currentFile.name}` : "Вибрати файл"}
                            <input
                                type="file"
                                hidden
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.zip,.rar,.txt,.jpg,.jpeg,.png" // Відповідно до валідації на бекенді
                            />
                        </Button>
                        {currentFile && ( // Кнопка для очищення вибраного файлу (якщо він ще не завантажений)
                            <IconButton onClick={() => { setValue("section_file", null); setValue("remove_section_file", false); }} size="small" color="warning" sx={{ml:1}}>
                                <DeleteIcon />
                            </IconButton>
                        )}
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Дозволені типи: PDF, DOC, DOCX, ZIP, RAR, TXT, JPG, PNG. Макс. розмір: 10MB.
                        </Typography>
                    </Box>

                    <Button type="submit" variant="contained" color="primary" disabled={isLoading} sx={{ mt: 2 }}>
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : "Оновити секцію"}
                    </Button>
                </form>
            </Paper>
        </Container>
    );
};