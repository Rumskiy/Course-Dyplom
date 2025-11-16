// src/components/Test/EditTest.tsx
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {useForm, useFieldArray, Controller, SubmitHandler} from "react-hook-form";
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
import ClearIcon from '@mui/icons-material/Clear'; // Для кнопки видалення фото
import {toast} from 'react-toastify';
import {apiClient} from '../../../api/api'; // Перевірте шлях

// --- Типи даних з API (Приклад, уточніть відповідно до вашого API) ---
interface ApiMedia {
    id: number;
    url: string; // Або file_name, collection_name, etc.
    // ... інші поля медіа
}

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
    image?: ApiMedia | null; // URL або об'єкт медіа існуючого зображення
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


// --- Типи для форми ---
interface OptionFormData {
    id?: number; // ID існуючої опції
    text: string;
    is_correct: boolean;
    order: number;
}

interface MatchPairFormData {
    id?: number; // ID існуючої пари
    left_text: string;
    right_text: string;
    order: number;
}

interface QuestionFormData {
    id?: number; // ID існуючого питання
    type: 'single_choice' | 'multiple_choice' | 'match';
    text: string;
    order: number;
    points: number;
    options: OptionFormData[];
    match_pairs: MatchPairFormData[];
    image_file: File | FileList | null; // Файл для завантаження (використовуємо FileList з create)
    image_preview_url: string | null; // URL для прев'ю (blob або з API)
    existing_image_url: string | null; // URL існуючого зображення з API
    remove_image: boolean; // Прапорець для видалення існуючого зображення
    // image_media_id: number | null; // Не використовуємо напряму, якщо завантаження окремо
}

interface TestFormData {
    id: number | null; // ID тесту
    title: string;
    section_id: number | null; // ID розділу
    total_time_limit: number | string; // Використовуємо string для TextField
    time_per_question: number | string; // Використовуємо string для TextField
    questions: QuestionFormData[];
}
// --- Кінець типів форми ---


// --- Функція створення порожнього питання (якщо потрібно додати нове) ---
const createEmptyQuestion = (order: number): QuestionFormData => ({
    // Не встановлюємо id для нових
    type: 'single_choice',
    text: '',
    order: order,
    points: 1,
    options: [
        {text: '', is_correct: false, order: 0}, // Нові опції без id
        {text: '', is_correct: false, order: 1},
    ],
    match_pairs: [],
    image_file: null,
    image_preview_url: null,
    existing_image_url: null,
    remove_image: false,
});


// --- API Функції (Адаптовано під Edit) ---
const getTestById = async (id: string | number): Promise<TestData> => {
    // Переконайтесь, що цей ендпоінт правильний для отримання ОДНОГО тесту
    const response = await apiClient.get(`/courses/section/tests/${id}`);
    // Перевірка структури відповіді (може бути data.data або просто data)
    const responseData = response.data?.data || response.data;
    if (!responseData?.id) {
        console.error("Invalid API response structure for getTestById:", response.data);
        throw new Error("Invalid API response structure");
    }
    return responseData;
};

// Оновлення тесту (використовуємо FormData, якщо є файли, або JSON, якщо немає)
// Зазвичай для оновлення з файлами використовують POST з _method=PUT або спеціальний ендпоінт
const updateTestApi = async (id: string | number, formDataPayload: FormData): Promise<any> => {
    // Важливо: Laravel очікує POST для FormData навіть для оновлення.
    // Додаємо _method=PUT, якщо ваш бекенд це підтримує, або використовуємо POST роут.
    formDataPayload // Стандартний спосіб Laravel для PUT з FormData

    // Переконайтесь, що цей ендпоінт правильний для ОНОВЛЕННЯ тесту
    // Можливо, це /courses/section/tests/{id} з методом POST (завдяки _method=PUT)
    const response = await apiClient.post(`/courses/section/tests/${id}`, formDataPayload, {
        headers: {
            'Content-Type': 'multipart/form-data', // Важливо для FormData
        },
    });
    return response.data;
};


// --- Компонент ---
export const EditTest: React.FC = () => {
    const {id: testIdParam} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [formError, setFormError] = useState<string | null>(null); // Загальна помилка форми
    const [testTitle, setTestTitle] = useState<string>(''); // Для заголовку сторінки
    const [isSubmittingForm, setIsSubmittingForm] = useState(false); // Додано для блокування

    const {
        control, register, handleSubmit, reset, watch,
        setValue, setError, clearErrors,
        formState: {errors, isDirty,}, // isSubmitting від RHF може бути корисним
        getValues, trigger // Додаємо trigger для валідації
    } = useForm<TestFormData>({
        // criteriaMode: "all", // Не завжди потрібно, може сповільнювати
        defaultValues: {
            id: null,
            title: '',
            section_id: null,
            total_time_limit: '',
            time_per_question: '',
            questions: [] // Починаємо з порожнього масиву
        }
    });

    const {fields, append, remove, update} = useFieldArray({control, name: "questions"});

    // --- Ефекти ---
    // 1. Завантаження даних тесту
    useEffect(() => {
        let isMounted = true;
        if (!testIdParam) {
            if (isMounted) {
                setFormError("ID тесту відсутній у URL.");
                setIsLoading(false);
                toast.error("Не вдалося визначити ID тесту.");
                navigate(-1); // Повернення назад
            }
            return;
        }

        setIsLoading(true);
        setFormError(null);

        getTestById(testIdParam)
            .then(testData => {
                if (isMounted) {
                    if (!testData?.id) {
                        setFormError("Отримано некоректні дані тесту.");
                        toast.error("Не вдалося завантажити дані тесту.");
                        return;
                    }
                    setTestTitle(testData.title); // Для заголовку сторінки

                    // --- Мапінг даних API -> Форма ---
                    const mappedData: TestFormData = {
                        id: testData.id,
                        title: testData.title,
                        section_id: testData.section_id, // Зберігаємо ID розділу
                        total_time_limit: testData.total_time_limit ?? '', // Якщо null, то порожній рядок
                        time_per_question: testData.time_per_question ?? '',
                        questions: (testData.questions || []).map((qApi, index): QuestionFormData => ({
                            id: qApi.id, // Зберігаємо ID питання
                            type: qApi.type || 'single_choice', // Тип з API або дефолтний
                            text: qApi.text ?? '',
                            order: qApi.order ?? index, // Порядок з API або індекс
                            points: qApi.points ?? 1, // Бали з API або дефолтні
                            options: (qApi.options || []).map((optApi, oIndex): OptionFormData => ({
                                id: optApi.id, // ID опції
                                text: optApi.text ?? '',
                                is_correct: !!optApi.is_correct, // Перетворення на boolean
                                order: optApi.order ?? oIndex
                            })),
                            match_pairs: (qApi.match_pairs || []).map((pairApi, pIndex): MatchPairFormData => ({
                                id: pairApi.id, // ID пари
                                left_text: pairApi.left_text ?? '',
                                right_text: pairApi.right_text ?? '',
                                order: pairApi.order ?? pIndex
                            })),
                            // --- Обробка зображення ---
                            image_file: null, // Починаємо без файлу
                            // Показуємо існуюче зображення одразу
                            image_preview_url: qApi.image?.url || null, // URL з API
                            existing_image_url: qApi.image?.url || null, // Запам'ятовуємо URL з API
                            remove_image: false, // Починаємо без видалення
                        })),
                    };

                    // Якщо тест прийшов без питань (малоймовірно, але можливо), додаємо одне порожнє
                    if (mappedData.questions.length === 0) {
                        mappedData.questions.push(createEmptyQuestion(0));
                    }

                    console.log("Data mapped for form reset:", mappedData);
                    reset(mappedData); // Заповнюємо форму даними з API
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error("Error fetching test data:", err);
                    const message = err.response?.data?.message || err.message || "Невідома помилка";
                    setFormError(`Не вдалося завантажити дані тесту: ${message}`);
                    toast.error("Помилка завантаження тесту.");
                }
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        // Функція очищення для useEffect
        return () => {
            isMounted = false;
            // Додатково: очищення Object URLs, якщо вони створювались
            const currentFormValues = getValues(); // Отримати поточні значення перед розмонтуванням
            if (Array.isArray(currentFormValues?.questions)) {
                currentFormValues.questions.forEach(q => {
                    if (q.image_preview_url && q.image_preview_url.startsWith('blob:')) {
                        URL.revokeObjectURL(q.image_preview_url);
                    }
                });
            }
        };
    }, [testIdParam, reset, navigate, getValues]); // Додали getValues до залежностей для очищення

    // 2. Ефект для очищення Object URLs (залишаємо, корисно)
    useEffect(() => {
        // Ця логіка вже перенесена в функцію очищення попереднього useEffect
        return () => {
            // Можна залишити порожнім або дублювати логіку очищення з попереднього ефекту
            // (краще мати її в одному місці)
        }
    }, []); // Порожній масив залежностей - виконується один раз при розмонтуванні


    // --- Обробники дій (Адаптовані під Edit) ---

    const handleAddQuestion = useCallback(() => {
        // Додаємо порожнє питання без ID
        append(createEmptyQuestion(fields.length));
    }, [append, fields.length]);

    const handleRemoveQuestion = useCallback((index: number) => {
        if (fields.length <= 1) {
            toast.warn("Тест повинен мати хоча б одне питання.");
            return;
        }
        // Очищення preview URL перед видаленням
        const q = getValues(`questions.${index}`);
        if (q?.image_preview_url && q.image_preview_url.startsWith('blob:')) {
            URL.revokeObjectURL(q.image_preview_url);
        }
        remove(index);
    }, [fields.length, remove, getValues]);

    // handleQuestionTypeChange, handleAddOption, handleRemoveOption, handleCheckboxChange,
    // handleAddMatchPair, handleRemoveMatchPair - логіка залишається схожою,
    // але потрібно переконатись, що вони працюють з оновленою структурою QuestionFormData
    // і встановлюють `shouldDirty: true` для відстеження змін.

    const handleQuestionTypeChange = useCallback((qIndex: number, newType: QuestionFormData['type']) => {
        const currentQuestion = getValues(`questions.${qIndex}`);
        // Створюємо нові опції/пари без ID
        update(qIndex, {
            ...currentQuestion,
            type: newType,
            // Якщо були опції/пари, обнуляємо їх, бо тип змінився
            options: (newType === 'single_choice' || newType === 'multiple_choice')
                ? [{text: '', is_correct: false, order: 0}, {text: '', is_correct: false, order: 1}]
                : [],
            match_pairs: (newType === 'match')
                ? [{left_text: '', right_text: '', order: 0}, {left_text: '', right_text: '', order: 1}]
                : [],
        });
        // Очистка помилок валідації для опцій/пар старого типу
        clearErrors(`questions.${qIndex}.options`);
        clearErrors(`questions.${qIndex}.match_pairs`);
    }, [getValues, update, clearErrors]);

    const handleAddOption = useCallback((qIndex: number) => {
        const options = getValues(`questions.${qIndex}.options`) || [];
        if (options.length < 5) {
            // Додаємо нову опцію без ID
            setValue(`questions.${qIndex}.options`, [
                ...options,
                {text: '', is_correct: false, order: options.length /* id не вказуємо */}
            ], {shouldDirty: true}); // Позначаємо форму як змінену
        } else {
            toast.warn("Максимум 5 варіантів.");
        }
    }, [getValues, setValue]);

    const handleRemoveOption = useCallback((qIndex: number, oIndex: number) => {
        const options = getValues(`questions.${qIndex}.options`);
        if (options?.length > 2) {
            const newOptions = options.filter((_, i) => i !== oIndex)
                .map((opt, i) => ({...opt, order: i})); // Оновлюємо порядок
            setValue(`questions.${qIndex}.options`, newOptions, {shouldDirty: true});
        } else {
            toast.warn("Мінімум 2 варіанти.");
        }
    }, [getValues, setValue]);

    const handleCheckboxChange = useCallback((qIndex: number, optIndex: number) => {
        const questionType = getValues(`questions.${qIndex}.type`);
        const options = getValues(`questions.${qIndex}.options`);
        const updatedOptions = options.map((opt, idx) => ({
            ...opt,
            is_correct: (questionType === 'single_choice')
                ? (idx === optIndex) // Тільки вибрана стає true
                : (idx === optIndex ? !opt.is_correct : opt.is_correct) // Інвертуємо вибрану для multiple
        }));
        setValue(`questions.${qIndex}.options`, updatedOptions, {shouldDirty: true});
    }, [getValues, setValue]);


    const handleAddMatchPair = useCallback((qIndex: number) => {
        const pairs = getValues(`questions.${qIndex}.match_pairs`) || [];
        // Додаємо нову пару без ID
        setValue(`questions.${qIndex}.match_pairs`, [
            ...pairs,
            {left_text: '', right_text: '', order: pairs.length /* id не вказуємо */}
        ], {shouldDirty: true});
    }, [getValues, setValue]);


    const handleRemoveMatchPair = useCallback((qIndex: number, pIndex: number) => {
        const pairs = getValues(`questions.${qIndex}.match_pairs`);
        if (pairs?.length > 2) {
            const newPairs = pairs.filter((_, i) => i !== pIndex)
                .map((pair, i) => ({...pair, order: i})); // Оновлюємо порядок
            setValue(`questions.${qIndex}.match_pairs`, newPairs, {shouldDirty: true});
        } else {
            toast.warn("Мінімум 2 пари.");
        }
    }, [getValues, setValue]);


    // --- Обробка Зображення (Адаптовано під Edit) ---
    const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, qIndex: number) => {
        const file = event.target.files?.[0];
        const currentQuestionState = getValues(`questions.${qIndex}`); // Отримуємо поточний стан

        // Очищаємо попередній Blob URL, якщо він був
        if (currentQuestionState.image_preview_url && currentQuestionState.image_preview_url.startsWith('blob:')) {
            URL.revokeObjectURL(currentQuestionState.image_preview_url);
        }

        if (file) {
            const newPreviewUrl = URL.createObjectURL(file);
            // Оновлюємо стан питання: додаємо файл, URL прев'ю, скидаємо прапорець видалення
            update(qIndex, {
                ...currentQuestionState,
                image_file: event.target.files, // Зберігаємо FileList (як у create)
                image_preview_url: newPreviewUrl,
                remove_image: false, // Якщо вибрали новий файл, видаляти старий не потрібно явно (бекенд замінить)
            });
            clearErrors(`questions.${qIndex}.image_file`); // Очистити можливі помилки валідації
            setValue(`questions.${qIndex}.remove_image`, false, {shouldDirty: true}); // Додатково для isDirty
            // Можна додати перевірку розміру/типу файлу тут
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                setError(`questions.${qIndex}.image_file`, { type: 'manual', message: 'Файл занадто великий (макс. 2MB)' });
                toast.error('Файл зображення занадто великий (макс. 2MB)');
                // Очистити вибір файлу (необов'язково, але може бути корисно)
                event.target.value = '';
                update(qIndex, { // Повернути стан до попереднього (без файлу)
                    ...currentQuestionState,
                    image_file: null,
                    image_preview_url: currentQuestionState.existing_image_url // Показати старе фото, якщо було
                });
                return; // Зупинити подальшу обробку
            }

        } else {
            // Якщо файл не вибрано (наприклад, користувач натиснув Cancel)
            // Повертаємо preview до існуючого URL (якщо він є)
            update(qIndex, {
                ...currentQuestionState,
                image_file: null,
                image_preview_url: currentQuestionState.existing_image_url, // Повертаємо старий URL
            });
        }
        // Переконаємось, що форма вважається зміненою
        setValue(`questions.${qIndex}.text`, currentQuestionState.text, { shouldDirty: true }); // Трігер isDirty

    }, [getValues, update, setValue, clearErrors, setError]); // Додаємо setError

    const handleRemoveImage = useCallback((qIndex: number) => {
        const currentQuestionState = getValues(`questions.${qIndex}`);

        // Очищаємо Blob URL, якщо він є
        if (currentQuestionState.image_preview_url && currentQuestionState.image_preview_url.startsWith('blob:')) {
            URL.revokeObjectURL(currentQuestionState.image_preview_url);
        }

        // Оновлюємо стан: очищаємо файл, preview, встановлюємо прапорець remove_image
        update(qIndex, {
            ...currentQuestionState,
            image_file: null,
            image_preview_url: null, // Більше не показуємо прев'ю
            remove_image: true, // Позначаємо для бекенду, що треба видалити зв'язане зображення
        });
        clearErrors(`questions.${qIndex}.image_file`); // Очищуємо помилки
        setValue(`questions.${qIndex}.remove_image`, true, {shouldDirty: true}); // Для isDirty

        // Скидання значення input file, щоб можна було вибрати той самий файл знову (якщо потрібно)
        const fileInput = document.getElementById(`image-input-${qIndex}`) as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }

    }, [getValues, update, setValue, clearErrors]);


    // --- Відправка Форми Оновлення ---
    const onSubmit: SubmitHandler<TestFormData> = useCallback(async (formData) => {
        setIsSubmittingForm(true); // Початок відправки
        setFormError(null); // Очистити попередні загальні помилки

        const currentTestId = formData.id;
        if (!currentTestId) {
            setFormError("Помилка: ID тесту для оновлення не знайдено.");
            toast.error("Не вдалося оновити тест. Відсутній ID.");
            setIsSubmittingForm(false);
            return;
        }

        // --- Клієнтська валідація (додаткова до RHF) ---
        let customValid = true;
        const questions = formData.questions || [];
        questions.forEach((q, qIndex) => {
            // Очищення попередніх помилок для цього питання
            clearErrors(`questions.${qIndex}.text`);
            clearErrors(`questions.${qIndex}.points`);
            clearErrors(`questions.${qIndex}.options`);
            clearErrors(`questions.${qIndex}.match_pairs`);
            clearErrors(`questions.${qIndex}.image_file`);

            if (!q.text.trim()) {
                setError(`questions.${qIndex}.text`, { type: 'required', message: 'Текст питання обов\'язковий' });
                customValid = false;
            }
            if (!q.points || q.points < 1) {
                setError(`questions.${qIndex}.points`, { type: 'min', message: 'Мін. 1 бал' });
                customValid = false;
            }

            if (q.type === 'single_choice' || q.type === 'multiple_choice') {
                if (!q.options || q.options.length < 2) {
                    setError(`questions.${qIndex}.options`, { type: 'manual', message: 'Мін. 2 варіанти' });
                    customValid = false;
                } else {
                    const correctCount = q.options.filter(opt => opt.is_correct).length;
                    if (q.type === 'single_choice' && correctCount !== 1) {
                        setError(`questions.${qIndex}.options`, { type: 'manual', message: 'Має бути 1 правильний варіант' });
                        customValid = false;
                    } else if (q.type === 'multiple_choice' && correctCount === 0) {
                        setError(`questions.${qIndex}.options`, { type: 'manual', message: 'Хоча б 1 правильний варіант' });
                        customValid = false;
                    }
                    q.options.forEach((opt, oIndex) => {
                        if (!opt.text.trim()) {
                            setError(`questions.${qIndex}.options.${oIndex}.text`, { type: 'required', message: 'Текст варіанту обов\'язковий' });
                            customValid = false;
                        }
                    });
                }
            } else if (q.type === 'match') {
                if (!q.match_pairs || q.match_pairs.length < 2) {
                    setError(`questions.${qIndex}.match_pairs`, { type: 'manual', message: 'Мін. 2 пари' });
                    customValid = false;
                } else {
                    q.match_pairs.forEach((pair, pIndex) => {
                        if (!pair.left_text.trim()) {
                            setError(`questions.${qIndex}.match_pairs.${pIndex}.left_text`, { type: 'required', message: 'Лівий текст обов\'язковий' });
                            customValid = false;
                        }
                        if (!pair.right_text.trim()) {
                            setError(`questions.${qIndex}.match_pairs.${pIndex}.right_text`, { type: 'required', message: 'Правий текст обов\'язковий' });
                            customValid = false;
                        }
                    });
                }
            }
        });

        // Додаткова перевірка RHF валідації
        const rhfValid = await trigger();

        if (!rhfValid || !customValid) {
            toast.error("Будь ласка, виправте помилки у формі.");
            console.log("Validation errors:", errors);
            setIsSubmittingForm(false);
            return;
        }

        // --- Підготовка FormData для відправки ---
        const formDataPayload = new FormData();

        // Додавання загальних полів
        formDataPayload.append('title', formData.title.trim());
        if (formData.total_time_limit) {
            formDataPayload.append('total_time_limit', String(formData.total_time_limit));
        }
        if (formData.time_per_question) {
            formDataPayload.append('time_per_question', String(formData.time_per_question));
        }

        // Додавання питань та їх деталей
        questions.forEach((q, qIndex) => {
            const questionPrefix = `questions[${qIndex}]`;

            // ID питання (важливо для оновлення)
            if (q.id) {
                formDataPayload.append(`${questionPrefix}[id]`, String(q.id));
            }

            formDataPayload.append(`${questionPrefix}[type]`, q.type);
            formDataPayload.append(`${questionPrefix}[text]`, q.text.trim());
            formDataPayload.append(`${questionPrefix}[order]`, String(qIndex)); // Оновлюємо порядок
            formDataPayload.append(`${questionPrefix}[points]`, String(q.points || 1));

            // Обробка зображення
            if (q.image_file instanceof FileList && q.image_file.length > 0) {
                // Якщо є новий файл, додаємо його
                const file = q.image_file[0];
                formDataPayload.append(`${questionPrefix}[image]`, file, file.name);
            } else if (q.remove_image) {
                // Якщо позначено на видалення
                formDataPayload.append(`${questionPrefix}[remove_image]`, '1'); // або 'true'
            }
            // Не потрібно передавати existing_image_url, бекенд має сам розібратися

            // Додавання опцій/пар
            if (q.type === 'single_choice' || q.type === 'multiple_choice') {
                q.options.forEach((opt, oIndex) => {
                    const optionPrefix = `${questionPrefix}[options][${oIndex}]`;
                    if (opt.id) { // ID опції для оновлення
                        formDataPayload.append(`${optionPrefix}[id]`, String(opt.id));
                    }
                    formDataPayload.append(`${optionPrefix}[text]`, opt.text.trim());
                    formDataPayload.append(`${optionPrefix}[is_correct]`, opt.is_correct ? '1' : '0');
                    formDataPayload.append(`${optionPrefix}[order]`, String(oIndex)); // Оновлюємо порядок
                });
            } else if (q.type === 'match') {
                q.match_pairs.forEach((pair, pIndex) => {
                    const pairPrefix = `${questionPrefix}[match_pairs][${pIndex}]`;
                    if (pair.id) { // ID пари для оновлення
                        formDataPayload.append(`${pairPrefix}[id]`, String(pair.id));
                    }
                    formDataPayload.append(`${pairPrefix}[left_text]`, pair.left_text.trim());
                    formDataPayload.append(`${pairPrefix}[right_text]`, pair.right_text.trim());
                    formDataPayload.append(`${pairPrefix}[order]`, String(pIndex)); // Оновлюємо порядок
                });
            }
        });

        // --- Відправка ---
        console.log('Sending API Update FormData Payload:', /* formDataPayload не показує вміст легко */ formData);
        try {
            await updateTestApi(currentTestId, formDataPayload);
            toast.success("Тест успішно оновлено!");
            // Після успішного оновлення, скидаємо стан isDirty
            // Можливо, варто перезавантажити дані, щоб отримати нові ID, але простіше повернутись
            reset(getValues(), {keepValues: true, keepDirty: false}); // Оновлюємо defaultValues і скидаємо dirty
            navigate(-1); // Повернення на попередню сторінку
        } catch (error: any) {
            console.error("API Error on test update:", error);
            const responseData = error.response?.data;
            const errorMessage = responseData?.message || "Не вдалося оновити тест.";
            const errorDetails = responseData?.errors; // Помилки валідації Laravel

            setFormError(`Помилка оновлення: ${errorMessage}`);

            if (error.response?.status === 422 && errorDetails) {
                console.log("Validation Errors from backend:", errorDetails);
                let displayedError = false;
                // Спроба розпарсити та встановити помилки валідації з бекенду
                for (const key in errorDetails) {
                    const match = key.match(/^questions\.(\d+)\.(.+)$/);
                    if (match) {
                        const qIndex = parseInt(match[1], 10);
                        const fieldPart = match[2]; // 'text', 'image', 'options.0.text', etc.
                        let rhfFieldName: string = `questions.${qIndex}.${fieldPart}`;

                        // Специфічні поля
                        if (fieldPart === 'image') {
                            rhfFieldName = `questions.${qIndex}.image_file`; // Прив'язка до поля файлу
                        } else if (fieldPart.startsWith('options.')) {
                            rhfFieldName = `questions.${qIndex}.options`; // Загальна помилка опцій
                        } else if (fieldPart === 'options') {
                            rhfFieldName = `questions.${qIndex}.options`;
                        } else if (fieldPart.startsWith('match_pairs.')) {
                            rhfFieldName = `questions.${qIndex}.match_pairs`; // Загальна помилка пар
                        } else if (fieldPart === 'match_pairs') {
                            rhfFieldName = `questions.${qIndex}.match_pairs`;
                        }

                        setError(rhfFieldName as any, {message: errorDetails[key][0]});
                        displayedError = true;
                    } else if (key === 'title' || key === 'total_time_limit' || key === 'time_per_question') {
                        setError(key as keyof TestFormData, {message: errorDetails[key][0]});
                        displayedError = true;
                    }
                }

                if (displayedError) {
                    toast.error("Будь ласка, виправте помилки валідації у формі.");
                } else {
                    toast.error(`Помилка валідації: ${errorMessage}. Перевірте дані.`);
                }

            } else {
                // Інші помилки сервера (500, 403, etc.)
                toast.error(`Помилка сервера (${error.response?.status || 'N/A'}): ${errorMessage}`);
            }
        } finally {
            setIsSubmittingForm(false); // Завершення відправки
        }
    }, [reset, navigate, setError, clearErrors, trigger, getValues, testIdParam]); // Додали testIdParam

    // --- Мемоізовані значення ---
    // Дивимось на isSubmittingForm (наш стан) ТА isDirty (стан RHF)
    const isSaveDisabled = useMemo(() => {
        return isSubmittingForm || !isDirty;
    }, [isSubmittingForm, isDirty]);

    // --- Рендеринг ---
    if (isLoading) {
        return <Box sx={{display: 'flex', justifyContent: 'center', p: 5, alignItems: 'center', height: '100vh'}}><CircularProgress/></Box>;
    }

    // Якщо була помилка завантаження, показуємо її
    if (formError && !isLoading) {
        return (
            <Box sx={{p: 3}}>
                <Alert severity="error" sx={{mb: 2}}>{formError}</Alert>
                <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon/>}>
                    Назад
                </Button>
            </Box>
        );
    }

    // Додаткова перевірка, чи є ID тесту в формі після завантаження
    const currentTestIdFromForm = getValues('id');
    if (!currentTestIdFromForm && !isLoading && !formError) {
        return <Box sx={{p: 3}}><Alert severity="warning">Не вдалося завантажити ID тесту для редагування.</Alert></Box>;
    }


    return (
        <Box sx={{p: {xs: 2, sm: 3}, maxWidth: 1100, mx: "auto", mt: 8}}>
            <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon/>} sx={{mb: 2}}>
                Назад до розділу {/* Або куди веде navigate(-1) */}
            </Button>
            <Typography variant="h4" gutterBottom sx={{mb: 1}}>
                Редагування тесту: <Typography component="span" variant="h4" color="primary">
                {/* Використовуємо значення з форми, бо воно може бути змінене */}
                {watch('title') || testTitle || `ID ${currentTestIdFromForm}`}
            </Typography>
            </Typography>

            {/* Загальна помилка форми (не валідаційна) */}
            {formError && !Object.keys(errors).length && <Alert severity="error" sx={{mb: 2}}>{formError}</Alert>}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* --- Загальна інформація --- */}
                <Paper elevation={1} sx={{p: 2.5, mb: 3}}>
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
                                    // valueAsNumber: true, // Не завжди надійно з порожніми полями
                                })}
                                error={!!errors.total_time_limit}
                                helperText={errors.total_time_limit?.message || "Залиште порожнім, якщо без обмежень"}
                                inputProps={{min: 1}}
                                disabled={isSubmittingForm}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Tooltip title="Якщо не встановлено, час братиметься із загального ліміту або необмежений." placement="top">
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
                                        endAdornment: (<InfoOutlinedIcon color="action" sx={{fontSize: 18}}/>),
                                    }}
                                    inputProps={{min: 5}}
                                    disabled={isSubmittingForm}
                                />
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Paper>

                {/* --- Питання --- */}
                <Typography variant="h5" sx={{mb: 2}}>Питання</Typography>
                <Stack spacing={3}>
                    {fields.map((field, index) => {
                        // Використовуємо watch для отримання поточних значень для UI
                        const currentQuestionType = watch(`questions.${index}.type`);
                        const previewUrl = watch(`questions.${index}.image_preview_url`);
                        const existingImageUrl = watch(`questions.${index}.existing_image_url`);
                        const imageUrlToDisplay = previewUrl || existingImageUrl; // Показуємо прев'ю або існуюче

                        // Помилки для цього питання
                        const questionErrors = errors.questions?.[index];
                        // @ts-ignore - RHF може мати складну структуру помилок
                        const imageFileError = errors.questions?.[index]?.image_file;
                        // @ts-ignore
                        const optionsValidationError = errors.questions?.[index]?.options?.message || errors.questions?.[index]?.options?.root?.message;
                        // @ts-ignore
                        const matchPairsValidationError = errors.questions?.[index]?.match_pairs?.message || errors.questions?.[index]?.match_pairs?.root?.message;

                        return (
                            <Paper key={field.id} elevation={1} sx={{
                                p: {xs: 1.5, sm: 2.5},
                                borderLeft: 3,
                                borderColor: 'primary.light',
                                // Додаємо індикацію помилки на весь блок питання
                                ...(questionErrors && {borderColor: 'error.main', borderLeftWidth: 5})
                            }}>
                                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                                    <Typography variant="h6">Питання {index + 1}</Typography>
                                    <IconButton aria-label="Видалити питання" onClick={() => handleRemoveQuestion(index)} size="small" color="error"
                                                disabled={fields.length <= 1 || isSubmittingForm}>
                                        <DeleteIcon/>
                                    </IconButton>
                                </Box>
                                <Grid container spacing={2.5}>
                                    {/* Тип та Бали */}
                                    <Grid item xs={12} sm={7}>
                                        <FormControl fullWidth error={!!questionErrors?.type} disabled={isSubmittingForm}>
                                            <InputLabel id={`q-${index}-type-label`}>Тип</InputLabel>
                                            <Controller
                                                name={`questions.${index}.type`}
                                                control={control}
                                                rules={{required: true}}
                                                render={({field}) => (
                                                    <Select
                                                        labelId={`q-${index}-type-label`}
                                                        label="Тип питання"
                                                        value={field.value}
                                                        onChange={(e) => handleQuestionTypeChange(index, e.target.value as QuestionFormData['type'])}
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
                                            InputLabelProps={{shrink: true}}
                                            {...register(`questions.${index}.points`, {
                                                required: "Вкажіть бали",
                                                valueAsNumber: true,
                                                min: {value: 1, message: "Мін. 1 бал"},
                                                max: {value: 100, message: "Макс. 100 балів"},
                                            })}
                                            error={!!questionErrors?.points}
                                            helperText={questionErrors?.points?.message}
                                            inputProps={{min: 1}}
                                            disabled={isSubmittingForm}
                                        />
                                    </Grid>

                                    {/* Текст питання */}
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Текст питання"
                                            multiline
                                            minRows={2}
                                            {...register(`questions.${index}.text`, {required: "Текст питання є обов'язковим"})}
                                            error={!!questionErrors?.text}
                                            helperText={questionErrors?.text?.message}
                                            disabled={isSubmittingForm}
                                        />
                                    </Grid>

                                    {/* Зображення */}
                                    <Grid item xs={12}>
                                        <FormControl fullWidth error={!!imageFileError}>
                                            <FormLabel sx={{mb: 1}}>Зображення до питання (опціонально)</FormLabel>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center'}}
                                                   sx={{border: 1, borderColor: imageFileError ? 'error.main' : 'divider', p: 1.5, borderRadius: 1}}>

                                                {/* Блок прев'ю/іконки */}
                                                <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 70}}>
                                                    <Avatar
                                                        src={imageUrlToDisplay || undefined} // Показуємо прев'ю або існуюче
                                                        alt="Прев'ю"
                                                        variant="rounded"
                                                        sx={{width: 60, height: 60, bgcolor: 'grey.100', cursor: 'pointer', border: '1px solid lightgray'}}
                                                        // Додаємо обробник кліку для відкриття вибору файлу
                                                        onClick={() => document.getElementById(`image-input-${index}`)?.click()}
                                                    >
                                                        {/* Іконка завантаження, якщо немає зображення */}
                                                        {!imageUrlToDisplay && <UploadFileIcon color="action" />}
                                                    </Avatar>
                                                </Box>

                                                {/* Блок кнопок та тексту */}
                                                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            component="label"
                                                            startIcon={<UploadFileIcon/>}
                                                            disabled={isSubmittingForm}
                                                            htmlFor={`image-input-${index}`} // Додаємо для зв'язку з input
                                                        >
                                                            {imageUrlToDisplay ? "Змінити" : "Вибрати файл"}
                                                            <input
                                                                id={`image-input-${index}`} // ID для label
                                                                type="file"
                                                                hidden
                                                                accept="image/png, image/jpeg, image/gif, image/webp"
                                                                onChange={(e) => handleImageChange(e, index)}
                                                            />
                                                        </Button>
                                                        {/* Кнопка видалення з'являється, якщо є зображення для показу */}
                                                        {imageUrlToDisplay && (
                                                            <Button
                                                                variant="text"
                                                                size="small"
                                                                color="error"
                                                                startIcon={<ClearIcon/>}
                                                                onClick={() => handleRemoveImage(index)}
                                                                disabled={isSubmittingForm}
                                                            >
                                                                Видалити
                                                            </Button>
                                                        )}
                                                    </Box>
                                                    {/* Повідомлення про помилку або підказка */}
                                                    <FormHelperText error={!!imageFileError}>
                                                        {imageFileError?.message || 'Макс. розмір 2MB (png, jpg, gif, webp)'}
                                                    </FormHelperText>
                                                </Box>
                                            </Stack>
                                        </FormControl>
                                    </Grid>

                                    {/* Варіанти / Пари */}
                                    <Grid item xs={12}>
                                        {/* Опції */}
                                        {(currentQuestionType === 'single_choice' || currentQuestionType === 'multiple_choice') && (
                                            <Box>
                                                <FormLabel error={!!optionsValidationError} sx={{display: 'block', mb: 1}}>
                                                    Варіанти відповідей:
                                                </FormLabel>
                                                {optionsValidationError && <FormHelperText error sx={{mt: -1, mb: 1}}>
                                                    {optionsValidationError}
                                                </FormHelperText>}
                                                <Stack spacing={1.5}>
                                                    {watch(`questions.${index}.options`, []).map((_option, oIndex) => {
                                                        // @ts-ignore
                                                        const optionTextError = errors.questions?.[index]?.options?.[oIndex]?.text;
                                                        return (
                                                            <Box key={field.id + '-option-' + oIndex} sx={{display: "flex", alignItems: "center", gap: 1}}>
                                                                <Tooltip title={currentQuestionType === 'single_choice' ? "Правильний варіант" : "Позначити як правильний"} placement="left">
                                                                    <Controller
                                                                        name={`questions.${index}.options.${oIndex}.is_correct`}
                                                                        control={control}
                                                                        render={({field: cbField}) => (
                                                                            <Checkbox
                                                                                checked={!!cbField.value} // !! для boolean
                                                                                onChange={() => handleCheckboxChange(index, oIndex)}
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
                                                                    {...register(`questions.${index}.options.${oIndex}.text`, {required: "Текст варіанту не може бути порожнім"})}
                                                                    error={!!optionTextError}
                                                                    helperText={optionTextError?.message}
                                                                    disabled={isSubmittingForm}
                                                                />
                                                                <IconButton aria-label="Видалити варіант" onClick={() => handleRemoveOption(index, oIndex)} size="small"
                                                                            disabled={watch(`questions.${index}.options`, []).length <= 2 || isSubmittingForm}>
                                                                    <DeleteIcon fontSize="small"/>
                                                                </IconButton>
                                                            </Box>
                                                        );
                                                    })}
                                                </Stack>
                                                <Button startIcon={<AddCircleOutlineIcon/>} onClick={() => handleAddOption(index)} size="small" sx={{mt: 1.5}}
                                                        disabled={watch(`questions.${index}.options`, []).length >= 5 || isSubmittingForm}>
                                                    Додати варіант
                                                </Button>
                                            </Box>
                                        )}

                                        {/* Пари */}
                                        {currentQuestionType === 'match' && (
                                            <Box>
                                                <FormLabel error={!!matchPairsValidationError} sx={{display: 'block', mb: 1}}>
                                                    Пари для з'єднання (Ліва частина = Права частина):
                                                </FormLabel>
                                                {matchPairsValidationError && <FormHelperText error sx={{mt: -1, mb: 1}}>
                                                    {matchPairsValidationError}
                                                </FormHelperText>}
                                                <Stack spacing={1.5}>
                                                    {watch(`questions.${index}.match_pairs`, []).map((_pair, pIndex) => {
                                                        // @ts-ignore
                                                        const leftTextError = errors.questions?.[index]?.match_pairs?.[pIndex]?.left_text;
                                                        // @ts-ignore
                                                        const rightTextError = errors.questions?.[index]?.match_pairs?.[pIndex]?.right_text;
                                                        return (
                                                            <Box key={field.id + '-pair-' + pIndex} sx={{display: 'flex', gap: {xs: 1, sm: 1.5}, alignItems: 'flex-start'}}>
                                                                <TextField
                                                                    fullWidth size="small" variant="outlined" label={`Ліворуч ${pIndex + 1}`}
                                                                    {...register(`questions.${index}.match_pairs.${pIndex}.left_text`, {required: "Ліва частина є обов'язковою"})}
                                                                    error={!!leftTextError}
                                                                    helperText={leftTextError?.message}
                                                                    disabled={isSubmittingForm}
                                                                />
                                                                <Typography sx={{pt: 1}}>=</Typography>
                                                                <TextField
                                                                    fullWidth size="small" variant="outlined" label={`Праворуч ${pIndex + 1}`}
                                                                    {...register(`questions.${index}.match_pairs.${pIndex}.right_text`, {required: "Права частина є обов'язковою"})}
                                                                    error={!!rightTextError}
                                                                    helperText={rightTextError?.message}
                                                                    disabled={isSubmittingForm}
                                                                />
                                                                <IconButton aria-label="Видалити пару" onClick={() => handleRemoveMatchPair(index, pIndex)} size="small"
                                                                            disabled={watch(`questions.${index}.match_pairs`, []).length <= 2 || isSubmittingForm} sx={{mt: 0.5}}>
                                                                    <DeleteIcon fontSize="small"/>
                                                                </IconButton>
                                                            </Box>
                                                        );
                                                    })}
                                                </Stack>
                                                <Button startIcon={<AddCircleOutlineIcon/>} onClick={() => handleAddMatchPair(index)} size="small" sx={{mt: 1.5}}
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
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isSaveDisabled} // Використовуємо isSaveDisabled
                        sx={{order: {xs: 1, sm: 2}, width: {xs: '100%', sm: 'auto'}}}
                    >
                        {isSubmittingForm ? <CircularProgress size={24} color="inherit"/> : 'Зберегти Зміни'}
                    </Button>
                </Box>

            </Box> {/* Кінець форми */}
        </Box>
    );
};