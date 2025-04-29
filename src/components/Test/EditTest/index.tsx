import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {useForm, useFieldArray, Controller, SubmitHandler, FieldError} from "react-hook-form";
import {useParams, useNavigate} from "react-router-dom";
import {
    TextField, Button, Typography, Box, Checkbox, IconButton,
    FormHelperText, FormControl, InputLabel, Select, MenuItem,
    Paper, Stack, CircularProgress, Grid, Avatar, FormLabel, Tooltip, Alert
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {toast} from 'react-toastify';
import {apiClient} from '../../../api/api';

// --- Типи ---

// Приклад структури відповіді API для GET /api/tests/{id}
// *** АДАПТУЙ ЦІ ТИПИ ПІД СВОЮ РЕАЛЬНУ ВІДПОВІДЬ API ***
interface ApiOption {
    id: number;
    text: string;
    is_correct: boolean;
    order?: number;
}

interface ApiMatchPair {
    id: number;
    left_text: string;
    right_text: string;
    order?: number;
}

interface ApiQuestion {
    id: number;
    type: 'single_choice' | 'multiple_choice' | 'match';
    text: string;
    order?: number;
    points?: number;
    image_url?: string | null; // URL існуючого зображення
    options?: ApiOption[];
    match_pairs?: ApiMatchPair[];
}

interface TestData {
    id: number;
    title: string;
    section_id: number; // Потрібно для повернення назад або іншої логіки
    total_time_limit?: number | null;
    time_per_question?: number | null;
    questions?: ApiQuestion[];
}

// --- Кінець прикладів типів API ---

// Типи для форми
interface OptionFormData {
    id?: number;
    text: string;
    is_correct: boolean;
    order: number;
}

interface MatchPairFormData {
    id?: number;
    left_text: string;
    right_text: string;
    order: number;
}

interface QuestionFormData {
    id?: number;
    type: 'single_choice' | 'multiple_choice' | 'match';
    text: string;
    order: number;
    points: number;
    options: OptionFormData[];
    match_pairs: MatchPairFormData[];
    image_file: File | null;
    image_preview_url: string | null;
    image_media_id: number | null;
    is_uploading_image: boolean;
    remove_image: boolean;
    existing_image_url?: string | null;
}

interface TestFormData {
    id: number | null;
    title: string;
    section_id: number | null;
    total_time_limit: number | string;
    time_per_question: number | string;
    questions: QuestionFormData[];
}

// Типи для API Payload Оновлення
interface ApiOptionPayload {
    id?: number;
    text: string;
    is_correct: boolean;
    order: number;
}

interface ApiMatchPairPayload {
    id?: number;
    left_text: string;
    right_text: string;
    order: number;
}

interface ApiQuestionPayload {
    id?: number;
    type: string;
    text: string;
    order: number;
    points: number;
    image_media_id: number | null;
    options?: ApiOptionPayload[];
    match_pairs?: ApiMatchPairPayload[];
    remove_image?: boolean;
}

interface ApiUpdateTestPayload {
    title: string;
    total_time_limit: number | null;
    time_per_question: number | null;
    questions: ApiQuestionPayload[];
}

const createEmptyQuestion = (order: number): QuestionFormData => ({
    id: undefined, type: 'single_choice', text: '', order: order, points: 1,
    options: [{text: '', is_correct: false, order: 0}, {text: '', is_correct: false, order: 1}],
    match_pairs: [], image_file: null, image_preview_url: null, image_media_id: null,
    is_uploading_image: false, remove_image: false,
});

// --- API Функції ---
const getTestById = async (id: string | number): Promise<TestData> => {
    console.log(`API: Fetching test ${id}`);
    // *** Переконайся, що URL правильний (/api/tests/{id}) ***
    const response = await apiClient.get(`courses/section/tests/${id}`);
    console.log('API: Fetched test response', response);
    if (!response.data?.data && !response.data) throw new Error("Invalid API response structure");
    return response.data.data || response.data;
};

const updateTestApi = async (id: string | number, payload: ApiUpdateTestPayload): Promise<any> => {
    // *** Переконайся, що URL та МЕТОД правильні згідно твоїх роутів (/api/courses/section/tests/{id} або /api/tests/{id}) ***
    // const response = await apiClient.put(`/api/tests/${id}`, payload); // Якщо PUT
    const response = await apiClient.post(`courses/section/tests/${id}`, payload); // Якщо POST
    console.log('API: Update test response', response);
    return response.data;
};

// --- Компонент ---
export const EditTest: React.FC = () => {
    const {id: testIdParam} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);
    const [testTitle, setTestTitle] = useState<string>('');

    const {
        control, register, handleSubmit, reset, watch,
        setValue, setError, clearErrors,
        formState: {errors, isDirty, isSubmitting},
        trigger, getValues,
    } = useForm<TestFormData>({
        criteriaMode: "all",
        defaultValues: {
            id: null,
            title: '',
            section_id: null,
            total_time_limit: '',
            time_per_question: '',
            questions: []
        }
    });

    const {fields, append, remove, update} = useFieldArray({control, name: "questions"});

    // --- Ефекти ---
    // Завантаження даних тесту
    useEffect(() => {
        let isMounted = true;
        if (!testIdParam) {
            setFormError("ID тесту відсутній у URL.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setFormError(null);

        getTestById(testIdParam)
            .then(testData => {
                if (isMounted) {
                    if (!testData?.id) {
                        setFormError("Отримано некоректні дані тесту.");
                        return;
                    }
                    setTestTitle(testData.title);
                    const mappedData: TestFormData = {
                        id: testData.id,
                        title: testData.title,
                        section_id: testData.section_id,
                        total_time_limit: testData.total_time_limit ?? '',
                        time_per_question: testData.time_per_question ?? '',
                        questions: (testData.questions || []).map((q, index): QuestionFormData => ({
                            id: q.id,
                            type: q.type || 'single_choice',
                            text: q.text ?? '',
                            order: q.order ?? index,
                            points: q.points ?? 1,
                            options: (q.options || []).map((opt, oIndex): OptionFormData => ({
                                id: opt.id,
                                text: opt.text ?? '',
                                is_correct: !!opt.is_correct,
                                order: opt.order ?? oIndex
                            })),
                            match_pairs: (q.match_pairs || []).map((pair, pIndex): MatchPairFormData => ({
                                id: pair.id,
                                left_text: pair.left_text ?? '',
                                right_text: pair.right_text ?? '',
                                order: pair.order ?? pIndex
                            })),
                            image_file: null,
                            image_preview_url: q.image_url || null,
                            existing_image_url: q.image_url || null,
                            image_media_id: null,
                            is_uploading_image: false,
                            remove_image: false,
                        })),
                    };
                    if (mappedData.questions.length === 0) mappedData.questions.push(createEmptyQuestion(0));
                    reset(mappedData); // Заповнюємо форму
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error(err);
                    setFormError("Не вдалося завантажити дані тесту.");
                    toast.error("Помилка завантаження тесту.");
                }
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [testIdParam, reset]);

    useEffect(() => {
        const currentQuestions = getValues('questions');
        return () => {
            if (Array.isArray(currentQuestions)) {
                currentQuestions.forEach(q => {
                    if (q.image_preview_url?.startsWith('blob:')) {
                        URL.revokeObjectURL(q.image_preview_url);
                    }
                });
            }
        };
    }, [getValues]);

    // --- Обробники ---
    const handleAddQuestion = useCallback(() => append(createEmptyQuestion(fields.length)), [append, fields.length]);

    const handleRemoveQuestion = useCallback((index: number) => {
        if (fields.length <= 1) {
            toast.warn("Мін. 1 питання.");
            return;
        }
        const q = getValues(`questions.${index}`);
        if (q?.image_preview_url?.startsWith('blob:')) {
            URL.revokeObjectURL(q.image_preview_url);
        }
        remove(index);
    }, [fields.length, remove, getValues]);

    const handleQuestionTypeChange = useCallback((qIndex: number, newType: QuestionFormData['type']) => {
        const currentQuestion = getValues(`questions.${qIndex}`);
        update(qIndex, {
            ...currentQuestion, type: newType,
            options: (newType !== 'match') ? (currentQuestion.options?.length >= 2 ? currentQuestion.options : [{
                text: '',
                is_correct: false,
                order: 0
            }, {text: '', is_correct: false, order: 1}]) : [],
            match_pairs: (newType === 'match') ? (currentQuestion.match_pairs?.length >= 2 ? currentQuestion.match_pairs : [{
                left_text: '',
                right_text: '',
                order: 0
            }, {left_text: '', right_text: '', order: 1}]) : [],
        });
        clearErrors(`questions.${qIndex}.options`);
        clearErrors(`questions.${qIndex}.match_pairs`);
    }, [getValues, update, clearErrors]);

    const handleAddOption = useCallback((qIndex: number) => {
        const options = getValues(`questions.${qIndex}.options`) || [];
        if (options.length < 5) {
            setValue(`questions.${qIndex}.options`, [...options, {
                text: '',
                is_correct: false,
                order: options.length
            }], {shouldDirty: true});
        } else {
            toast.warn("Макс. 5 варіантів.");
        }
    }, [getValues, setValue]);

    const handleRemoveOption = useCallback((qIndex: number, oIndex: number) => {
        const options = getValues(`questions.${qIndex}.options`);
        if (options?.length > 2) {
            const newOptions = options.filter((_, i) => i !== oIndex).map((opt, i) => ({...opt, order: i}));
            setValue(`questions.${qIndex}.options`, newOptions, {shouldDirty: true});
        } else {
            toast.warn("Мін. 2 варіанти.");
        }
    }, [getValues, setValue]);

    const handleCheckboxChange = useCallback((qIndex: number, optIndex: number) => {
        const questionType = getValues(`questions.${qIndex}.type`);
        const options = getValues(`questions.${qIndex}.options`);
        const updatedOptions = options.map((opt, idx) => ({
            ...opt,
            is_correct: (questionType === 'single_choice') ? (idx === optIndex) : (idx === optIndex ? !opt.is_correct : opt.is_correct)
        }));
        setValue(`questions.${qIndex}.options`, updatedOptions, {shouldDirty: true});
    }, [getValues, setValue]);

    const handleAddMatchPair = useCallback((qIndex: number) => {
        const pairs = getValues(`questions.${qIndex}.match_pairs`) || [];
        setValue(`questions.${qIndex}.match_pairs`, [...pairs, {
            left_text: '',
            right_text: '',
            order: pairs.length
        }], {shouldDirty: true});
    }, [getValues, setValue]);

    const handleRemoveMatchPair = useCallback((qIndex: number, pIndex: number) => {
        const pairs = getValues(`questions.${qIndex}.match_pairs`);
        if (pairs?.length > 2) {
            const newPairs = pairs.filter((_, i) => i !== pIndex).map((pair, i) => ({...pair, order: i}));
            setValue(`questions.${qIndex}.match_pairs`, newPairs, {shouldDirty: true});
        } else {
            toast.warn("Мін. 2 пари.");
        }
    }, [getValues, setValue]);

    const handleImageFileChange = useCallback(async (qIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const currentQuestionState = getValues(`questions.${qIndex}`);
        clearErrors(`questions.${qIndex}.image_media_id`);
        if (currentQuestionState.image_preview_url?.startsWith('blob:')) {
            URL.revokeObjectURL(currentQuestionState.image_preview_url);
        }
        if (!file) {
            update(qIndex, {
                ...currentQuestionState,
                image_file: null,
                image_preview_url: currentQuestionState.existing_image_url || null
            });
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        update(qIndex, {
            ...currentQuestionState,
            image_file: file,
            image_preview_url: previewUrl,
            is_uploading_image: true,
            image_media_id: null,
            remove_image: false
        });
        const formData = new FormData();
        formData.append('image', file);
        try {
            // *** ВИПРАВЛЕНО URL: Додано /api ***
            const response = await apiClient.post<{
                media_id: number,
                url: string
            }>('/media/upload', formData, {headers: {'Content-Type': 'multipart/form-data'}});
            update(qIndex, {
                ...getValues(`questions.${qIndex}`),
                image_media_id: response.data.media_id,
                image_file: null,
                is_uploading_image: false
            });
            toast.success(`Фото [${qIndex + 1}] завантажено.`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Could not upload file.";
            toast.error(`Помилка фото [${qIndex + 1}]: ${errorMessage}`);
            setError(`questions.${qIndex}.image_media_id`, {type: 'manual', message: errorMessage});
            update(qIndex, {...getValues(`questions.${qIndex}`), image_media_id: null, is_uploading_image: false});
        }
    }, [getValues, update, clearErrors, setError]);

    const handleRemoveImage = useCallback((qIndex: number) => {
        const questionState = getValues(`questions.${qIndex}`);
        if (questionState?.image_preview_url?.startsWith('blob:')) {
            URL.revokeObjectURL(questionState.image_preview_url);
        }
        update(qIndex, {
            ...questionState,
            image_file: null,
            image_preview_url: null,
            image_media_id: null,
            is_uploading_image: false,
            remove_image: true
        }); // Встановлюємо remove_image
        clearErrors(`questions.${qIndex}.image_media_id`);
        const fileInput = document.getElementById(`image-input-${qIndex}`) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }, [getValues, update, clearErrors]);

    // --- Відправка Форми Оновлення ---
    const onSubmit: SubmitHandler<TestFormData> = useCallback(async (formData) => {
        console.log('onSubmit Update triggered. Data:', formData);
        setFormError(null);
        const currentTestId = formData.id;
        if (!currentTestId) {
            setFormError("ID тесту відсутній.");
            return;
        }

        // --- Клієнтська валідація ---
        const rhfValid = await trigger();
        let customValid = true;
        const questions = formData.questions || [];
        questions.forEach((q, qIndex) => {
            clearErrors(`questions.${qIndex}.options`);
            clearErrors(`questions.${qIndex}.match_pairs`);
            clearErrors(`questions.${qIndex}.image_media_id`);
            clearErrors(`questions.${qIndex}.text`);
            if (!q.text.trim()) {
                setError(`questions.${qIndex}.text`, {type: 'required', message: 'Текст обов\'язковий'});
                customValid = false;
            }
            if (q.type === 'single_choice' || q.type === 'multiple_choice') {
                const correctCount = q.options?.filter(opt => opt.is_correct).length ?? 0;
                if (q.type === 'single_choice' && correctCount !== 1) {
                    setError(`questions.${qIndex}.options`, {type: 'manual', message: '1 правильний?'});
                    customValid = false;
                } else if (q.type === 'multiple_choice' && correctCount === 0) {
                    setError(`questions.${qIndex}.options`, {type: 'manual', message: 'Хоча б 1 правильний?'});
                    customValid = false;
                }
                q.options?.forEach((opt, oIndex) => {
                    if (!opt.text.trim()) {
                        setError(`questions.${qIndex}.options.${oIndex}.text`, {
                            type: 'required',
                            message: 'Заповніть'
                        });
                        customValid = false;
                    }
                });
            } else if (q.type === 'match') {
                if (q.match_pairs?.length < 2) {
                    setError(`questions.${qIndex}.match_pairs`, {type: 'manual', message: 'Мін. 2 пари?'});
                    customValid = false;
                }
                q.match_pairs?.forEach((pair, pIndex) => {
                    if (!pair.left_text.trim()) {
                        setError(`questions.${qIndex}.match_pairs.${pIndex}.left_text`, {
                            type: 'required',
                            message: 'Заповніть'
                        });
                        customValid = false;
                    }
                    if (!pair.right_text.trim()) {
                        setError(`questions.${qIndex}.match_pairs.${pIndex}.right_text`, {
                            type: 'required',
                            message: 'Заповніть'
                        });
                        customValid = false;
                    }
                });
            }
            if (q.image_file && !q.image_media_id) {
                setError(`questions.${qIndex}.image_media_id`, {type: 'manual', message: 'Фото не завантажено.'});
                customValid = false;
            }
            if (q.is_uploading_image) {
                setError(`questions.${qIndex}.image_media_id`, {type: 'manual', message: 'Зачекайте завантаження.'});
                customValid = false;
            }
        });

        if (!rhfValid || !customValid) {
            toast.error("Виправте помилки у формі.");
            console.log("Validation failed.", errors);
            return;
        }

        // --- Підготовка Payload ---
        const payload: ApiUpdateTestPayload = {
            title: formData.title.trim(),
            total_time_limit: formData.total_time_limit ? parseInt(String(formData.total_time_limit), 10) : null,
            time_per_question: formData.time_per_question ? parseInt(String(formData.time_per_question), 10) : null,
            questions: questions.map((q, qIndex) => ({
                id: q.id, type: q.type, text: q.text.trim(), order: qIndex,
                points: q.points ? parseInt(String(q.points)) : 1, image_media_id: q.image_media_id,
                remove_image: q.remove_image, // *** Надсилаємо прапорець ***
                options: (q.type !== 'match') ? q.options?.map((opt, oIndex) => ({
                    id: opt.id,
                    text: opt.text.trim(),
                    is_correct: opt.is_correct,
                    order: oIndex
                })) : undefined,
                match_pairs: (q.type === 'match') ? q.match_pairs?.map((pair, pIndex) => ({
                    id: pair.id,
                    left_text: pair.left_text.trim(),
                    right_text: pair.right_text.trim(),
                    order: pIndex
                })) : undefined,
            })),
        };

        // --- Відправка ---
        console.log('Sending API Update payload:', JSON.stringify(payload, null, 2));
        try {
            await updateTestApi(currentTestId, payload);
            toast.success("Тест успішно оновлено!");
            reset(getValues(), {keepValues: true, keepDirty: false}); // Зберігаємо значення, скидаємо dirty
            navigate(-1);
        } catch (error: any) {
            console.error("API Error on test update:", error);
            const responseData = error.response?.data;
            const errorMessage = responseData?.message || "Не вдалося оновити тест.";
            const errorDetails = responseData?.errors;
            setFormError(`Помилка оновлення: ${errorMessage}`);
            if (error.response?.status === 422 && errorDetails) {
                console.log("Validation Errors:", errorDetails);
                let displayedError = false;
                Object.keys(errorDetails).forEach(key => { /* ... мапінг помилок ... */
                });
                if (displayedError) toast.error("Виправте помилки валідації."); else toast.error(`Помилка валідації: ${errorMessage}`);
            } else {
                toast.error(`Помилка сервера: ${errorMessage}`);
            }
        }
    }, [reset, navigate, setError, clearErrors, trigger, errors, getValues]);

    // --- Мемоізовані значення ---
    const currentQuestions = watch('questions');
    const isSaveDisabled = useMemo(() => {
        const hasUploadingImages = currentQuestions?.some(q => q.is_uploading_image) ?? false;
        return isSubmitting || !isDirty || hasUploadingImages;
    }, [isSubmitting, isDirty, currentQuestions]);

    // --- Рендеринг ---
    if (isLoading) {
        return <Box sx={{display: 'flex', justifyContent: 'center', p: 5}}><CircularProgress/></Box>;
    }
    const hasAnyFormErrors = Object.keys(errors).length > 0;
    if (formError && !hasAnyFormErrors) {
        return <Box sx={{p: 3}}><Alert severity="error">{formError}</Alert><Button onClick={() => navigate(-1)}
                                                                                   startIcon={<ArrowBackIcon/>}
                                                                                   sx={{mt: 2}}>Назад</Button></Box>;
    }
    const currentTestIdFromForm = getValues('id');
    if (!currentTestIdFromForm && !isLoading) {
        return <Box sx={{p: 3}}><Alert severity="error">Не вдалося завантажити ID тесту.</Alert></Box>;
    }

    return (
        <Box sx={{p: {xs: 2, sm: 3}, maxWidth: 1100, mx: "auto", mt: 2}}>
            <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon/>} sx={{mb: 2}}>Назад</Button>
            <Typography variant="h4" gutterBottom sx={{mb: 1}}>
                Редагування тесту: <Typography component="span" variant="h4"
                                               color="primary">{testTitle || `ID ${currentTestIdFromForm}`}</Typography>
            </Typography>

            {formError && !hasAnyFormErrors && <Alert severity="error" sx={{mb: 2}}>{formError}</Alert>}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Загальна інформація */}
                <Paper elevation={1} sx={{p: 2.5, mb: 3}}>
                    <Typography variant="h6" sx={{mb: 2}}>Загальна інформація</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}> <TextField fullWidth
                                                       label="Назва тесту" {...register("title", {required: "Назва обов'язкова"})}
                                                       error={!!errors.title} helperText={errors.title?.message}/>
                        </Grid>
                        <Grid item xs={12} sm={6}> <TextField fullWidth label="Загальний час (хв)" type="number"
                                                              InputLabelProps={{shrink: true}} {...register("total_time_limit", {
                            valueAsNumber: true,
                            min: {value: 1, message: "Мін. 1"}
                        })} error={!!errors.total_time_limit}
                                                              helperText={errors.total_time_limit?.message || "Необов'язково"}
                                                              inputProps={{min: 1}}/> </Grid>
                        <Grid item xs={12} sm={6}> <Tooltip
                            title="Якщо не задано, час необмежений або береться із загального." placement="top-start">
                            <TextField fullWidth label="Час на питання (сек)" type="number"
                                       InputLabelProps={{shrink: true}} {...register("time_per_question", {
                                valueAsNumber: true,
                                min: {value: 5, message: "Мін. 5"}
                            })} error={!!errors.time_per_question} helperText={errors.time_per_question?.message}
                                       InputProps={{
                                           endAdornment: (<InfoOutlinedIcon color="action" sx={{fontSize: 18}}/>),
                                           inputProps: {min: 5}
                                       }}/> </Tooltip> </Grid>
                    </Grid>
                </Paper>

                {/* Питання */}
                <Typography variant="h5" sx={{mb: 2}}>Питання</Typography>
                <Stack spacing={3}>
                    {fields.map((field, index) => {
                        const questionErrors = errors.questions?.[index];
                        const imageError = questionErrors?.image_media_id;
                        const optionsError = questionErrors?.options as FieldError | undefined;
                        const matchPairsError = questionErrors?.match_pairs as FieldError | undefined;
                        const textError = questionErrors?.text;
                        const pointsError = questionErrors?.points;
                        const typeError = questionErrors?.type;
                        const isUploading = watch(`questions.${index}.is_uploading_image`);
                        const imageUrlToDisplay = watch(`questions.${index}.image_preview_url`) || watch(`questions.${index}.existing_image_url`);

                        return (
                            <Paper key={field.id} elevation={1}
                                   sx={{p: {xs: 1.5, sm: 2.5}, borderLeft: 3, borderColor: 'primary.light'}}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2
                                }}> <Typography variant="h6">Питання {index + 1}</Typography> <IconButton
                                    aria-label="Видалити питання" onClick={() => handleRemoveQuestion(index)}
                                    size="small" color="error" disabled={fields.length <= 1}> <DeleteIcon/>
                                </IconButton> </Box>
                                <Grid container spacing={2}>
                                    {/* Тип */}
                                    <Grid item xs={12} sm={7}> <FormControl fullWidth error={!!typeError}> <InputLabel
                                        id={`q-${index}-type-label`}>Тип</InputLabel> <Controller
                                        name={`questions.${index}.type`} control={control} rules={{required: true}}
                                        render={({field: controllerField}) => (
                                            <Select labelId={`q-${index}-type-label`} label="Тип" {...controllerField}
                                                    onChange={(e) => {
                                                        controllerField.onChange(e.target.value);
                                                        handleQuestionTypeChange(index, e.target.value as QuestionFormData['type']);
                                                    }}> <MenuItem value="single_choice">Один вибір</MenuItem> <MenuItem
                                                value="multiple_choice">Кілька</MenuItem> <MenuItem
                                                value="match">З'єднання</MenuItem> </Select>)}/> </FormControl> </Grid>
                                    {/* Бали */}
                                    <Grid item xs={12} sm={5}> <TextField fullWidth label="Бали" type="number"
                                                                          defaultValue={1}
                                                                          InputLabelProps={{shrink: true}} {...register(`questions.${index}.points`, {
                                        required: "Бали?",
                                        valueAsNumber: true,
                                        min: {value: 1, message: "Мін. 1"}
                                    })} error={!!pointsError} helperText={pointsError?.message} inputProps={{min: 1}}/>
                                    </Grid>
                                    {/* Текст */}
                                    <Grid item xs={12}> <TextField fullWidth label="Текст питання" multiline
                                                                   minRows={2} {...register(`questions.${index}.text`, {required: "Введіть текст питання"})}
                                                                   error={!!textError} helperText={textError?.message}/>
                                    </Grid>
                                    {/* Зображення */}
                                    <Grid item xs={12}> <FormLabel
                                        sx={{mb: 0.5, display: 'block'}}>Зображення</FormLabel> <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        border: 1,
                                        borderColor: imageError ? 'error.main' : 'divider',
                                        p: 1.5,
                                        borderRadius: 1
                                    }}> <Avatar variant="rounded" src={imageUrlToDisplay || undefined}
                                                sx={{width: 60, height: 60, bgcolor: 'grey.100', cursor: 'pointer'}}
                                                onClick={() => document.getElementById(`image-input-${index}`)?.click()}> {!imageUrlToDisplay &&
                                        <UploadFileIcon/>} </Avatar> <Box sx={{flexGrow: 1}}> <Button component="label"
                                                                                                      variant="outlined"
                                                                                                      size="small"
                                                                                                      startIcon={isUploading ?
                                                                                                          <CircularProgress
                                                                                                              size={20}/> :
                                                                                                          <UploadFileIcon/>}
                                                                                                      disabled={isUploading}
                                                                                                      htmlFor={`image-input-${index}`}> {imageUrlToDisplay ? "Змінити" : "Завантажити"}
                                        <input id={`image-input-${index}`} type="file" hidden accept="image/*"
                                               onChange={(e) => handleImageFileChange(index, e)}/>
                                    </Button> {imageUrlToDisplay &&
                                        <Button variant="text" size="small" onClick={() => handleRemoveImage(index)}
                                                sx={{ml: 1}} color="error"
                                                startIcon={<DeleteIcon/>}> Видалити </Button>} <FormHelperText
                                        error={!!imageError}
                                        sx={{mt: 0.5}}> {imageError?.message || 'Макс. 2MB'} </FormHelperText> </Box>
                                    </Box> </Grid>
                                    {/* Варіанти/Пари */}
                                    <Grid item xs={12}>
                                        {/* Опції */}
                                        {(watch(`questions.${index}.type`) !== 'match') && (
                                            <Box>
                                                <FormLabel error={!!optionsError}
                                                           sx={{display: 'block', mb: 1}}>Варіанти:</FormLabel>
                                                {optionsError?.message && <FormHelperText error sx={{
                                                    mt: -1,
                                                    mb: 1
                                                }}>{optionsError.message}</FormHelperText>}
                                                <Stack spacing={1}>
                                                    {(watch(`questions.${index}.options`) || []).map((opt, optIndex) => {
                                                        const optionTextError = errors.questions?.[index]?.options?.[optIndex]?.text;
                                                        return (<Box key={opt.id || `new-opt-${index}-${optIndex}`}
                                                                     sx={{
                                                                         display: "flex",
                                                                         alignItems: "center",
                                                                         gap: 1
                                                                     }}> <Tooltip title="Правильна?" placement="left">
                                                            <Controller
                                                                name={`questions.${index}.options.${optIndex}.is_correct`}
                                                                control={control} render={({field: cbField}) => (
                                                                <Checkbox checked={!!cbField.value}
                                                                          onChange={() => handleCheckboxChange(index, optIndex)}
                                                                          sx={{p: 0.5}}/>)}/> </Tooltip> <TextField
                                                            fullWidth size="small"
                                                            label={`Варіант ${optIndex + 1}`} {...register(`questions.${index}.options.${optIndex}.text`, {required: "Текст?"})}
                                                            error={!!optionTextError}
                                                            helperText={optionTextError?.message}/> <IconButton
                                                            aria-label="Видалити варіант"
                                                            onClick={() => handleRemoveOption(index, optIndex)}
                                                            size="small"
                                                            disabled={(watch(`questions.${index}.options`) || []).length <= 2}>
                                                            <DeleteIcon fontSize="small"/> </IconButton> </Box>);
                                                    })}
                                                </Stack>
                                                <Button startIcon={<AddCircleOutlineIcon/>}
                                                        onClick={() => handleAddOption(index)} size="small"
                                                        sx={{mt: 1.5}}
                                                        disabled={(watch(`questions.${index}.options`) || []).length >= 5}> Додати
                                                    варіант </Button>
                                            </Box>
                                        )}
                                        {/* Пари */}
                                        {watch(`questions.${index}.type`) === 'match' && (
                                            <Box>
                                                <FormLabel error={!!matchPairsError}
                                                           sx={{display: 'block', mb: 1}}>Пари:</FormLabel>
                                                {matchPairsError?.message && <FormHelperText error sx={{
                                                    mt: -1,
                                                    mb: 1
                                                }}>{matchPairsError.message}</FormHelperText>}
                                                <Stack spacing={1.5}>
                                                    {(watch(`questions.${index}.match_pairs`) || []).map((pair, pairIndex) => {
                                                        const leftTextError = errors.questions?.[index]?.match_pairs?.[pairIndex]?.left_text;
                                                        const rightTextError = errors.questions?.[index]?.match_pairs?.[pairIndex]?.right_text;
                                                        return (<Box key={pair.id || `new-pair-${index}-${pairIndex}`}
                                                                     sx={{
                                                                         display: 'flex',
                                                                         gap: {xs: 1, sm: 1.5},
                                                                         alignItems: 'flex-start'
                                                                     }}> <TextField fullWidth size="small"
                                                                                    label={`Ліворуч ${pairIndex + 1}`} {...register(`questions.${index}.match_pairs.${pairIndex}.left_text`, {required: "Текст?"})}
                                                                                    error={!!leftTextError}
                                                                                    helperText={leftTextError?.message}/>
                                                            <Typography sx={{pt: 1}}>=</Typography> <TextField fullWidth
                                                                                                               size="small"
                                                                                                               label={`Праворуч ${pairIndex + 1}`} {...register(`questions.${index}.match_pairs.${pairIndex}.right_text`, {required: "Текст?"})}
                                                                                                               error={!!rightTextError}
                                                                                                               helperText={rightTextError?.message}/>
                                                            <IconButton aria-label="Видалити пару"
                                                                        onClick={() => handleRemoveMatchPair(index, pairIndex)}
                                                                        size="small"
                                                                        disabled={(watch(`questions.${index}.match_pairs`) || []).length <= 2}
                                                                        sx={{mt: 0.5}}> <DeleteIcon fontSize="small"/>
                                                            </IconButton> </Box>);
                                                    })}
                                                </Stack>
                                                <Button startIcon={<AddCircleOutlineIcon/>}
                                                        onClick={() => handleAddMatchPair(index)} size="small"
                                                        sx={{mt: 1.5}}> Додати пару </Button>
                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>
                            </Paper>
                        );
                    })}
                </Stack>

                {/* Кнопки */}
                <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 4, flexWrap: 'wrap', gap: 2}}>
                    <Button variant="outlined" onClick={handleAddQuestion} startIcon={<AddCircleOutlineIcon/>}
                            sx={{order: {xs: 2, sm: 1}}}> Додати питання </Button>
                    <Button type="submit" variant="contained" color="primary" disabled={isSaveDisabled}
                            sx={{order: {xs: 1, sm: 2}, width: {xs: '100%', sm: 'auto'}}}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit"/> : 'Зберегти Зміни'}
                    </Button>
                </Box>

            </Box>
        </Box>
    );
};