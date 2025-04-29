// src/components/Test/TestComponent.tsx
import React, {useState, useEffect, useCallback} from 'react'; // Додано useCallback
import {useForm, useFieldArray, Controller, SubmitHandler} from "react-hook-form";
import {useParams, useNavigate} from "react-router-dom";
import {
    TextField, Button, Typography, Box, Checkbox, IconButton,
    FormHelperText, FormControl, InputLabel, Select, MenuItem,
    Paper, Stack, CircularProgress, Grid, Avatar, FormLabel, Tooltip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ClearIcon from '@mui/icons-material/Clear'; // Іконка для видалення фото
import {toast} from 'react-toastify';
import {apiClient} from '../../api/api';
import {QuestionForm, TestFormValues} from "../../model.tsx"; // Оновлений імпорт
import {getSectionsById} from "../../api/Section";

const createEmptyQuestion = (order: number): QuestionForm => ({
    // ... (як визначено вище)
    type: 'single_choice',
    text: '',
    order: order,
    points: 1,
    options: [
        {text: '', is_correct: false, order: 0},
        {text: '', is_correct: false, order: 1},
    ],
    match_pairs: [],
    image: null,
    image_preview_url: null,
    existingImageUrl: null,
    remove_image: false,
});

export const TestComponent: React.FC = () => {
    // --- Хуки ---
    const {id: sectionIdParam} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [sectionTitle, setSectionTitle] = useState<string>('');
    const [sectionId, setSectionId] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        setError,
        clearErrors, // Додаємо clearErrors
        reset,
        formState: {errors, isDirty},
    } = useForm<TestFormValues>({
        defaultValues: {
            title: "",
            section_id: null,
            total_time_limit: '',
            time_per_question: '',
            questions: [createEmptyQuestion(0)],
        },
    });

    const {fields, append, remove, update} = useFieldArray({control, name: "questions"});

    // --- Ефекти ---
    useEffect(() => {
        const idNum = parseInt(sectionIdParam || '', 10);
        if (!isNaN(idNum) && idNum > 0) {
            setSectionId(idNum);
            setValue('section_id', idNum);
            getSectionsById(String(idNum))
                .then(response => setSectionTitle(response.title))
                .catch(() => {
                    toast.error("Не вдалося завантажити дані розділу.");
                });
        } else {
            toast.error("Некоректний ID розділу.");
            navigate(-1);
        }
    }, [sectionIdParam, navigate, setValue]);

    // Ефект для очищення Object URL при розмонтуванні компонента
    useEffect(() => {
        // Ця функція буде викликана при розмонтуванні
        return () => {
            // Отримуємо поточний стан питань (можливо, застарілий, але краще ніж нічого)
            const questions = watch('questions');
            questions.forEach(q => {
                if (q.image_preview_url) {
                    URL.revokeObjectURL(q.image_preview_url);
                }
            });
        };
    }, [watch]); // Залежність від watch гарантує оновлення функції при зміні стану питань

    // --- Функції-обробники для питань, опцій, пар ---
    // ... (handleAddQuestion, handleRemoveQuestion, handleAddOption, etc. залишаються без змін)
    const handleAddQuestion = () => {
        append(createEmptyQuestion(fields.length));
    };

    const handleRemoveQuestion = (qIndex: number) => {
        if (fields.length > 1) {
            // Перед видаленням питання, очистимо URL зображення, якщо він є
            const previewUrl = watch(`questions.${qIndex}.image_preview_url`);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            remove(qIndex);
        } else {
            toast.warn("Тест повинен мати хоча б одне питання.");
        }
    };

    const handleAddOption = (qIndex: number) => {
        const currentOptions = watch(`questions.${qIndex}.options`) || [];
        if (currentOptions.length < 5) {
            setValue(`questions.${qIndex}.options`, [
                ...currentOptions,
                {text: '', is_correct: false, order: currentOptions.length},
            ], {shouldValidate: true, shouldDirty: true}); // Додано shouldDirty
        } else {
            toast.warn("Можна додати максимум 5 варіантів відповіді.");
        }
    };

    const handleRemoveOption = (qIndex: number, oIndex: number) => {
        const currentOptions = watch(`questions.${qIndex}.options`);
        if (currentOptions.length > 2) {
            const newOptions = currentOptions.filter((_, index) => index !== oIndex);
            newOptions.forEach((opt, index) => opt.order = index);
            setValue(`questions.${qIndex}.options`, newOptions, {shouldValidate: true, shouldDirty: true}); // Додано shouldDirty
        } else {
            toast.warn("Питання повинно мати хоча б 2 варіанти відповіді.");
        }
    };

    const handleQuestionTypeChange = (qIndex: number, newType: QuestionForm['type']) => {
        const currentQuestion = watch(`questions.${qIndex}`);
        update(qIndex, {
            ...currentQuestion,
            type: newType,
            options: (newType === 'single_choice' || newType === 'multiple_choice')
                ? (currentQuestion.options.length >= 2 ? currentQuestion.options : [{
                    text: '',
                    is_correct: false,
                    order: 0
                }, {text: '', is_correct: false, order: 1}])
                : [],
            match_pairs: (newType === 'match')
                ? (currentQuestion.match_pairs.length >= 2 ? currentQuestion.match_pairs : [{
                    left_text: '',
                    right_text: '',
                    order: 0
                }, {left_text: '', right_text: '', order: 1}])
                : [],
        });
        // Не потрібно setValue тут, update вже оновлює
    };

    const handleCheckboxChange = (qIndex: number, checkedOptionIndex: number) => {
        const questionType = watch(`questions.${qIndex}.type`);
        const currentOptions = watch(`questions.${qIndex}.options`);
        const updatedOptions = currentOptions.map((option, oIndex) => {
            let isCorrect = option.is_correct;
            if (questionType === 'single_choice') {
                isCorrect = oIndex === checkedOptionIndex;
            } else if (oIndex === checkedOptionIndex) {
                isCorrect = !option.is_correct;
            }
            return {...option, is_correct: isCorrect};
        });
        setValue(`questions.${qIndex}.options`, updatedOptions, {shouldValidate: true, shouldDirty: true});
    };

    const handleAddMatchPair = (qIndex: number) => {
        const currentPairs = watch(`questions.${qIndex}.match_pairs`) || [];
        setValue(`questions.${qIndex}.match_pairs`, [
            ...currentPairs,
            {left_text: '', right_text: '', order: currentPairs.length},
        ], {shouldValidate: true, shouldDirty: true}); // Додано shouldDirty
    };

    const handleRemoveMatchPair = (qIndex: number, pIndex: number) => {
        const currentPairs = watch(`questions.${qIndex}.match_pairs`);
        if (currentPairs.length > 2) {
            const newPairs = currentPairs.filter((_, index) => index !== pIndex);
            newPairs.forEach((pair, index) => pair.order = index);
            setValue(`questions.${qIndex}.match_pairs`, newPairs, {shouldValidate: true, shouldDirty: true}); // Додано shouldDirty
        } else {
            toast.warn("Питання типу 'З'єднання' повинно мати хоча б 2 пари.");
        }
    };

    // --- Обробка та завантаження фото ---
    // Використовуємо useCallback для стабілізації функції, якщо вона передається як prop
    const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, qIndex: number) => {
        const files = event.target.files; // Get the FileList

        const file = files?.[0];

        if (file) {
            const currentPreviewUrl = watch(`questions.${qIndex}.image_preview_url`);
            const newPreviewUrl = URL.createObjectURL(file);
            // --- LOG BEFORE SETTING IMAGE ---
            // @ts-ignore
            setValue(`questions.${qIndex}.image`, files, {shouldValidate: true, shouldDirty: true});
            setValue(`questions.${qIndex}.image_preview_url`, newPreviewUrl, {shouldDirty: true});

            setValue(`questions.${qIndex}.remove_image`, false, {shouldDirty: true});
            clearErrors(`questions.${qIndex}.image_upload_error` as any);

            if (currentPreviewUrl) {
                URL.revokeObjectURL(currentPreviewUrl);
            }
            // --- LOG STATE IMMEDIATELY AFTER ---
        } else {
        }
    }, [setValue, watch, setError, clearErrors]);

    const handleRemoveImage = useCallback((qIndex: number) => {
        const currentPreviewUrl = watch(`questions.${qIndex}.image_preview_url`);

        // Очищуємо URL прев'ю
        if (currentPreviewUrl) {
            URL.revokeObjectURL(currentPreviewUrl);
        }

        setValue(`questions.${qIndex}.image`, null, {shouldDirty: true});
        setValue(`questions.${qIndex}.image_preview_url`, null, {shouldDirty: true});
        clearErrors(`questions.${qIndex}.image_upload_error` as any);

    }, [setValue, watch, clearErrors]); // Додали залежності

    // --- Відправка Форми ---
    const onSubmit: SubmitHandler<TestFormValues> = async (data) => {
        if (!data.section_id) {
            toast.error("Не вдалося визначити ID розділу. Будь ласка, спробуйте оновити сторінку.");
            return;
        }
        // setIsSubmittingForm(true);


        const formData = new FormData();

        // --- Додавання загальних полів ---
        formData.append('section_id', String(data.section_id));
        formData.append('title', data.title);
        if (data.total_time_limit) {
            formData.append('total_time_limit', String(data.total_time_limit));
        }
        if (data.time_per_question !== null && data.time_per_question !== '') {
            formData.append('time_per_question', String(data.time_per_question));
        } else {
            // formData.append('time_per_question', ''); // або не додавати взагалі
        }


        // --- Додавання питань ---
        data.questions.forEach((q, qIndex) => {
            const questionPrefix = `questions[${qIndex}]`;

            // formData.append(`${questionPrefix}[id]`, String(q.id)); // Тільки при оновленні
            formData.append(`${questionPrefix}[type]`, q.type);
            formData.append(`${questionPrefix}[text]`, q.text);
            formData.append(`${questionPrefix}[order]`, String(qIndex)); // Порядок важливий
            formData.append(`${questionPrefix}[points]`, String(q.points || 1));

            // --- ДОДАВАННЯ ФАЙЛУ ЗОБРАЖЕННЯ ---
            // Перевіряємо, чи є вибраний файл (FileList) і чи він не порожній
            if (q.image instanceof FileList && q.image.length > 0) {
                const file = q.image[0]; // Беремо сам файл
                formData.append(`${questionPrefix}[image]`, file, file.name); // Додаємо файл
            }

            // --- Додавання опцій/пар ---
            if (q.type === 'single_choice' || q.type === 'multiple_choice') {
                q.options.forEach((opt, oIndex) => {
                    const optionPrefix = `${questionPrefix}[options][${oIndex}]`;
                    // formData.append(`${optionPrefix}[id]`, String(opt.id)); // Тільки при оновленні
                    formData.append(`${optionPrefix}[text]`, opt.text);
                    formData.append(`${optionPrefix}[is_correct]`, opt.is_correct ? '1' : '0');
                    formData.append(`${optionPrefix}[order]`, String(oIndex)); // Порядок важливий
                });
                // Переконайтесь, що бекенд очікує `options`, а не щось інше
                if (!q.options || q.options.length < 2) {
                    // Можливо, додати помилку або обробку на бекенді
                }
            } else if (q.type === 'match') {
                q.match_pairs.forEach((pair, pIndex) => {
                    const pairPrefix = `${questionPrefix}[match_pairs][${pIndex}]`;
                    // formData.append(`${pairPrefix}[id]`, String(pair.id)); // Тільки при оновленні
                    formData.append(`${pairPrefix}[left_text]`, pair.left_text);
                    formData.append(`${pairPrefix}[right_text]`, pair.right_text);
                    formData.append(`${pairPrefix}[order]`, String(pIndex)); // Порядок важливий
                });
                // Переконайтесь, що бекенд очікує `match_pairs`
                if (!q.match_pairs || q.match_pairs.length < 2) {
                }
            }
        });

        try {
            // --- Відправка FormData ---
            await apiClient.post('/courses/section/tests', formData, {});
            toast.success("Тест успішно створено!");
            reset(); // Скидаємо форму до defaultValues
            navigate(-1); // Повертаємось до редагування розділу
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Не вдалося зберегти тест.";
            const errorDetails = error.response?.data?.errors; // Об'єкт з помилками валідації

            if (error.response?.status === 422 && errorDetails) {
                let displayedError = false;
                // Обробка помилок валідації Laravel
                for (const key in errorDetails) {
                    // Ключ може бути 'title', 'questions.0.text', 'questions.1.image', 'questions.2.options.0.text' і т.д.
                    const match = key.match(/^questions\.(\d+)\.(.+)$/);
                    if (match) {
                        const qIndex = parseInt(match[1], 10);
                        const fieldPart = match[2]; // Напр., 'text', 'image', 'options.0.text', 'points'

                        // Мапування на поля RHF
                        let rhfFieldName: keyof QuestionForm | string = `questions.${qIndex}.${fieldPart}`;

                        // Специфічні поля або групи полів
                        if (fieldPart === 'image') {
                            rhfFieldName = `questions.${qIndex}.image_upload_error`;
                        } else if (fieldPart.startsWith('options.')) {
                            // Спробуємо встановити помилку для конкретної опції
                            // rhfFieldName = `questions.${qIndex}.options.${matchOptionIndex}.text`; // Потрібен парсинг індексу опції
                            // Або загальну помилку для блоку опцій:
                            rhfFieldName = `questions.${qIndex}.options_validation`;
                        } else if (fieldPart === 'options') { // Загальна помилка масиву options
                            rhfFieldName = `questions.${qIndex}.options_validation`;
                        } else if (fieldPart.startsWith('match_pairs.')) {
                            rhfFieldName = `questions.${qIndex}.match_pairs_validation`;
                        } else if (fieldPart === 'match_pairs') { // Загальна помилка масиву match_pairs
                            rhfFieldName = `questions.${qIndex}.match_pairs_validation`;
                        }
                        // Додайте інші специфічні мапування, якщо потрібно

                        // Встановлюємо помилку RHF
                        // Переконуємо TypeScript, що ми знаємо, що робимо (використовуємо as any або більш точну типізацію)
                        setError(rhfFieldName as any, {message: errorDetails[key][0]});
                        displayedError = true;

                    } else if (key === 'title' || key === 'section_id' || key === 'total_time_limit' || key === 'time_per_question') {
                        // Помилки для полів верхнього рівня
                        setError(key as keyof TestFormValues, {message: errorDetails[key][0]});
                        displayedError = true;
                    } else {
                        // Невідомий ключ помилки
                    }
                }

                if (!displayedError) {
                    // Якщо не вдалося прив'язати жодну помилку до поля
                    toast.error(`Помилка валідації: ${errorMessage}. Перевірте дані.`);
                } else {
                    toast.error("Будь ласка, виправте помилки у формі.");
                }

            } else {
                // Інші типи помилок (500, 403, etc.)
                toast.error(`Помилка сервера (${error.response?.status || 'N/A'}): ${errorMessage}`);
            }
        } finally {
            setIsSubmittingForm(false);
        }
    };


    // --- Рендеринг ---
    if (sectionId === null) {
        return (<Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh'
        }}><CircularProgress/></Box>);
    }

    return (
        <Box sx={{p: {xs: 2, sm: 3}, maxWidth: 1100, mx: "auto", mt: 2}}>
            <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon/>} sx={{mb: 2}}>
                Повернутися назад
            </Button>
            <Typography variant="h4" gutterBottom sx={{mb: 1}}>
                Створення тесту для розділу: <Typography component="span" variant="h4"
                                                         color="primary">{sectionTitle || `ID ${sectionId}`}</Typography>
            </Typography>

            {/* Використовуємо onSubmit з handleSubmit */}
            <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>

                {/* Загальна інформація про тест */}
                <Paper elevation={2} sx={{p: 2.5, mb: 3}}>
                    {/* ... (Код для title, total_time_limit, time_per_question залишається без змін) ... */}
                    <Typography variant="h6" sx={{mb: 2}}>Загальна інформація</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Назва тесту"
                                {...register("title", {required: "Назва тесту є обов'язковою"})}
                                error={!!errors.title}
                                helperText={errors.title?.message}
                                disabled={isSubmittingForm}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Загальний час (хвилин)"
                                type="number"
                                InputLabelProps={{shrink: true}}
                                {...register("total_time_limit", {
                                    min: {value: 1, message: "Час має бути позитивним"},
                                    // valueAsNumber не завжди добре працює з порожніми значеннями, краще обробити при відправці
                                })}
                                error={!!errors.total_time_limit}
                                helperText={errors.total_time_limit?.message || "Залиште порожнім, якщо без обмежень"}
                                inputProps={{min: 1}}
                                disabled={isSubmittingForm}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Tooltip
                                title="Якщо не встановлено, час братиметься із загального ліміту тесту або буде необмеженим."
                                placement="top">
                                <TextField
                                    fullWidth
                                    label="Час на питання (секунд)"
                                    type="number"
                                    InputLabelProps={{shrink: true}}
                                    {...register("time_per_question", {
                                        min: {value: 5, message: "Мінімум 5 секунд"},
                                        // valueAsNumber: true,
                                    })}
                                    error={!!errors.time_per_question}
                                    helperText={errors.time_per_question?.message}
                                    InputProps={{
                                        endAdornment: (
                                            <InfoOutlinedIcon color="action" sx={{fontSize: 18}}/>
                                        ),
                                    }}
                                    inputProps={{min: 5}}
                                    disabled={isSubmittingForm}
                                />
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Питання */}
                <Typography variant="h5" sx={{mb: 2}}>Питання</Typography>
                <Stack spacing={3}>
                    {fields.map((questionField, qIndex) => {
                        const questionErrors = errors.questions?.[qIndex];
                        const currentQuestionType = watch(`questions.${qIndex}.type`);
                        const previewUrl = watch(`questions.${qIndex}.image_preview_url`);
                        // Використовуємо ?. для безпечного доступу до помилок
                        // @ts-ignore
                        const imageUploadError = errors.questions?.[qIndex]?.image_upload_error;
                        // @ts-ignore
                        const optionsValidationError = errors.questions?.[qIndex]?.options_validation;
                        // @ts-ignore
                        const matchPairsValidationError = errors.questions?.[qIndex]?.match_pairs_validation;

                        return (
                            <Paper key={questionField.id} elevation={2} sx={{
                                p: {xs: 1.5, sm: 2.5},
                                borderLeft: 5,
                                borderColor: 'primary.main',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2
                                }}>
                                    <Typography variant="h6">Питання {qIndex + 1}</Typography>
                                    <IconButton onClick={() => handleRemoveQuestion(qIndex)} size="small" color="error"
                                                disabled={fields.length <= 1 || isSubmittingForm}>
                                        <DeleteIcon/>
                                    </IconButton>
                                </Box>

                                <Grid container spacing={2.5}>
                                    {/* Тип та Бали */}
                                    {/* ... (Код для type та points залишається без змін) ... */}
                                    <Grid item xs={12} sm={7}>
                                        <FormControl fullWidth error={!!questionErrors?.type}
                                                     disabled={isSubmittingForm}>
                                            <InputLabel id={`q-${qIndex}-type-label`}>Тип</InputLabel>
                                            <Controller
                                                name={`questions.${qIndex}.type`}
                                                control={control}
                                                rules={{required: true}}
                                                render={({field}) => (
                                                    <Select
                                                        labelId={`q-${qIndex}-type-label`}
                                                        label="Тип питання"
                                                        value={field.value}
                                                        onChange={(e) => handleQuestionTypeChange(qIndex, e.target.value as QuestionForm['type'])}
                                                    >
                                                        <MenuItem value="single_choice">Одиночний вибір</MenuItem>
                                                        <MenuItem value="multiple_choice">Множинний вибір</MenuItem>
                                                        <MenuItem value="match">З'єднання пар</MenuItem>
                                                    </Select>
                                                )}
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={5}>
                                        <TextField
                                            fullWidth
                                            label="Бали за питання"
                                            type="number"
                                            defaultValue={1}
                                            InputLabelProps={{shrink: true}}
                                            {...register(`questions.${qIndex}.points`, {
                                                required: "Вкажіть бали",
                                                valueAsNumber: true,
                                                min: {value: 1, message: "Мін. 1 бал"},
                                                max: {value: 100, message: "Макс. 100 балів"}, // Приклад обмеження
                                            })}
                                            error={!!questionErrors?.points}
                                            helperText={questionErrors?.points?.message}
                                            inputProps={{min: 1, max: 100}}
                                            disabled={isSubmittingForm}
                                        />
                                    </Grid>

                                    {/* Текст питання */}
                                    {/* ... (Код для text залишається без змін) ... */}
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Текст питання"
                                            multiline
                                            minRows={2}
                                            {...register(`questions.${qIndex}.text`, {required: "Текст питання є обов'язковим"})}
                                            error={!!questionErrors?.text}
                                            helperText={questionErrors?.text?.message}
                                            disabled={isSubmittingForm}
                                        />
                                    </Grid>


                                    {/* --- Завантаження зображення --- */}
                                    <Grid item xs={12}>
                                        <FormControl fullWidth error={!!imageUploadError}>
                                            <FormLabel sx={{mb: 1}}>Зображення до питання (опціонально)</FormLabel>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                {/* Кнопка для вибору файлу */}
                                                <Button
                                                    variant="outlined"
                                                    component="label" // Важливо для зв'язку з input type="file"
                                                    startIcon={<UploadFileIcon/>}
                                                    disabled={isSubmittingForm}
                                                >
                                                    {previewUrl ? "Змінити" : "Вибрати"}
                                                    <input
                                                        type="file"
                                                        hidden // Ховаємо стандартний інпут
                                                        accept="image/png, image/jpeg, image/gif, image/webp" // Обмежуємо типи файлів
                                                        // НЕ використовуємо register тут, обробляємо через onChange
                                                        onChange={(e) => handleImageChange(e, qIndex)}
                                                    />
                                                </Button>

                                                {/* Попередній перегляд та кнопка видалення */}
                                                {previewUrl && (
                                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                        <Avatar
                                                            src={previewUrl}
                                                            alt="Прев'ю"
                                                            variant="rounded"
                                                            sx={{width: 56, height: 56, border: '1px solid lightgray'}}
                                                        />
                                                        <Tooltip title="Видалити зображення">
                                                            {/* Використовуємо IconButton для кращого вигляду */}
                                                            <IconButton
                                                                onClick={() => handleRemoveImage(qIndex)}
                                                                size="small"
                                                                color="error"
                                                                disabled={isSubmittingForm}
                                                            >
                                                                <ClearIcon/>
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </Stack>
                                            {/* Відображення помилки завантаження */}
                                            {imageUploadError &&
                                                <FormHelperText>{imageUploadError.message}</FormHelperText>}
                                        </FormControl>
                                    </Grid>

                                    {/* --- Варіанти або Пари --- */}
                                    <Grid item xs={12}>
                                        {/* --- Опції для Choice --- */}
                                        {(currentQuestionType === 'single_choice' || currentQuestionType === 'multiple_choice') && (
                                            <Box>
                                                {/* ... (Код для опцій залишається без змін, але додаємо disabled={isSubmittingForm} до полів та кнопок) ... */}
                                                <FormLabel error={!!optionsValidationError}
                                                           sx={{display: 'block', mb: 1}}>
                                                    Варіанти відповідей:
                                                </FormLabel>
                                                {optionsValidationError && <FormHelperText error sx={{
                                                    mt: -1,
                                                    mb: 1
                                                }}>{optionsValidationError.message}</FormHelperText>}
                                                <Stack spacing={1.5}>
                                                    {watch(`questions.${qIndex}.options`).map((_option, oIndex) => (
                                                        <Box key={`${questionField.id}-option-${oIndex}`} sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            pl: 0,
                                                            gap: 1
                                                        }}>
                                                            <Tooltip
                                                                title={currentQuestionType === 'single_choice' ? "Правильний варіант" : "Позначити як правильний"}
                                                                placement="left">
                                                                <Controller
                                                                    name={`questions.${qIndex}.options.${oIndex}.is_correct`}
                                                                    control={control}
                                                                    render={({field}) => (
                                                                        <Checkbox
                                                                            checked={field.value}
                                                                            onChange={() => handleCheckboxChange(qIndex, oIndex)}
                                                                            sx={{p: 0.5}}
                                                                            disabled={isSubmittingForm}
                                                                        />
                                                                    )}
                                                                />
                                                            </Tooltip>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                variant="outlined"
                                                                label={`Варіант ${oIndex + 1}`}
                                                                {...register(`questions.${qIndex}.options.${oIndex}.text`, {required: "Текст варіанту не може бути порожнім"})}
                                                                error={!!questionErrors?.options?.[oIndex]?.text}
                                                                helperText={questionErrors?.options?.[oIndex]?.text?.message}
                                                                disabled={isSubmittingForm}
                                                            />
                                                            <IconButton aria-label="Видалити варіант"
                                                                        onClick={() => handleRemoveOption(qIndex, oIndex)}
                                                                        size="small"
                                                                        disabled={watch(`questions.${qIndex}.options`).length <= 2 || isSubmittingForm}>
                                                                <DeleteIcon fontSize="small"/>
                                                            </IconButton>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                                <Button startIcon={<AddCircleOutlineIcon/>}
                                                        onClick={() => handleAddOption(qIndex)} size="small"
                                                        sx={{mt: 1.5}}
                                                        disabled={watch(`questions.${qIndex}.options`).length >= 5 || isSubmittingForm}>
                                                    Додати варіант
                                                </Button>
                                            </Box>
                                        )}

                                        {/* --- Пари для Match --- */}
                                        {currentQuestionType === 'match' && (
                                            <Box>
                                                {/* ... (Код для пар залишається без змін, але додаємо disabled={isSubmittingForm} до полів та кнопок) ... */}
                                                <FormLabel error={!!matchPairsValidationError}
                                                           sx={{display: 'block', mb: 1}}>
                                                    Пари для з'єднання (Ліва частина = Права частина):
                                                </FormLabel>
                                                {matchPairsValidationError && <FormHelperText error sx={{
                                                    mt: -1,
                                                    mb: 1
                                                }}>{matchPairsValidationError.message}</FormHelperText>}
                                                <Stack spacing={1.5}>
                                                    {watch(`questions.${qIndex}.match_pairs`).map((_pair, pIndex) => (
                                                        <Box key={`${questionField.id}-pair-${pIndex}`} sx={{
                                                            display: 'flex',
                                                            gap: {xs: 1, sm: 1.5},
                                                            alignItems: 'flex-start'
                                                        }}>
                                                            <TextField
                                                                fullWidth size="small" variant="outlined"
                                                                label={`Ліворуч ${pIndex + 1}`}
                                                                {...register(`questions.${qIndex}.match_pairs.${pIndex}.left_text`, {required: "Ліва частина є обов'язковою"})}
                                                                error={!!questionErrors?.match_pairs?.[pIndex]?.left_text}
                                                                helperText={questionErrors?.match_pairs?.[pIndex]?.left_text?.message}
                                                                disabled={isSubmittingForm}
                                                            />
                                                            <Typography sx={{pt: 1}}>=</Typography>
                                                            <TextField
                                                                fullWidth size="small" variant="outlined"
                                                                label={`Праворуч ${pIndex + 1}`}
                                                                {...register(`questions.${qIndex}.match_pairs.${pIndex}.right_text`, {required: "Права частина є обов'язковою"})}
                                                                error={!!questionErrors?.match_pairs?.[pIndex]?.right_text}
                                                                helperText={questionErrors?.match_pairs?.[pIndex]?.right_text?.message}
                                                                disabled={isSubmittingForm}
                                                            />
                                                            <IconButton aria-label="Видалити пару"
                                                                        onClick={() => handleRemoveMatchPair(qIndex, pIndex)}
                                                                        size="small"
                                                                        disabled={watch(`questions.${qIndex}.match_pairs`).length <= 2 || isSubmittingForm}
                                                                        sx={{mt: 0.5}}>
                                                                <DeleteIcon fontSize="small"/>
                                                            </IconButton>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                                <Button startIcon={<AddCircleOutlineIcon/>}
                                                        onClick={() => handleAddMatchPair(qIndex)} size="small"
                                                        sx={{mt: 1.5}}
                                                        disabled={isSubmittingForm}>
                                                    Додати пару
                                                </Button>
                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>
                            </Paper>
                        );
                    })}
                </Stack>


                {/* --- Кнопки --- */}
                <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 4, flexWrap: 'wrap', gap: 2}}>
                    <Button
                        variant="outlined"
                        onClick={handleAddQuestion}
                        startIcon={<AddCircleOutlineIcon/>}
                        sx={{order: {xs: 2, sm: 1}}}
                        disabled={isSubmittingForm} // Блокуємо під час відправки
                    >
                        Додати питання
                    </Button>
                    <Button
                        type="submit" // Важливо: тип submit для кнопки всередині form
                        variant="contained"
                        color="primary"
                        // Блокуємо, якщо відправляється або форма не змінена
                        disabled={isSubmittingForm || !isDirty}
                        sx={{
                            order: {xs: 1, sm: 2},
                            width: {xs: '100%', sm: 'auto'}
                        }}
                        // Видаляємо onClick, бо handleSubmit обробляє відправку
                    >
                        {isSubmittingForm ?
                            <CircularProgress size={24} color="inherit"/> : 'Зберегти тест'}
                    </Button>
                </Box>

            </Box> { /* кінець форми */}
        </Box>
    );
};