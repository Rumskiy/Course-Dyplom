import React, {useState, useEffect, useContext} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button,
    Grid,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RedoIcon from '@mui/icons-material/Redo';
import {AuthContext} from '../../../Backend/Auth';
import {getQuizAttempts, getSertificate} from "../../../api/QuizAttemtps";
import {QuizAttempt, CourseWithAttempts, CourseInfo} from '../../../model.tsx'; // Імпортуємо потрібні типи
import {AccountPage} from "../AccountPage";
import { toast } from 'react-toastify';
import {DownloadIcon} from "lucide-react";

// Тип для користувача з AuthContext (уточніть його, якщо потрібно)
interface AuthUser {
    id: string; // або number
    // ... інші поля користувача
}

export const AccountProgressPage: React.FC = () => {
    const {user} = useContext(AuthContext) as { user: AuthUser | null };
    const navigate = useNavigate();
    const [coursesWithAttempts, setCoursesWithAttempts] = useState<CourseWithAttempts[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSertificate, setIsLoadingSertificate] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // @ts-ignore
    const [isCertificateLoading, setIsCertificateLoading] = useState<{[courseId: number]: boolean}>({});

    useEffect(() => {
        let isMounted = true;
        const fetchAttemptsData = async () => {
            if (!user) {
                setError("Будь ласка, увійдіть, щоб переглянути прогрес.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const data: CourseWithAttempts[] | null = await getQuizAttempts();

                if (!isMounted) return;

                if (data && Array.isArray(data)) {
                    setCoursesWithAttempts(data);
                } else {
                    setCoursesWithAttempts([]);
                }
            } catch (err) {
                if (!isMounted) return;
                console.error("Error fetching quiz attempts:", err);
                setError("Не вдалося завантажити ваш прогрес. Спробуйте пізніше.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchAttemptsData();

        return () => {
            isMounted = false;
        };
    }, [user]);

    const handleRetakeTest = (sectionId: number | undefined) => {
        if (typeof sectionId === 'number') {
            navigate(`/course/section/${sectionId}/test`);
        } else {
            console.error("Не вдалося перепройти тест: ID секції не знайдено або некоректний.");
            // toast.error("Не вдалося перепройти тест.");
        }
    };

    const handleGetSertificate = async (course: CourseInfo) => {// Приймаємо весь об'єкт course
        setIsLoadingSertificate(true)
        if (!course || typeof course.id !== 'number') {
            toast.error("Некоректний ID курсу.");
            return;
        }

        setIsCertificateLoading(prev => ({ ...prev, [course.id]: true }));
        try {
            await getSertificate(course.id); // Викликаємо API функцію
            setIsLoadingSertificate(false);
            // toast.success(`Сертифікат для курсу "${course.title}" успішно завантажується.`); // Опціонально
        } catch (e: any) { // Ловимо помилку типу any або Error
            console.error("Error in handleGetSertificate:", e);
            toast.error(e.reason || "Не вдалося отримати сертифікат.");
            setIsLoadingSertificate(false);
        } finally {
            setIsCertificateLoading(prev => ({ ...prev, [course.id]: false }));
        }
    };

    if (isLoading) {
        return (
            <Container maxWidth="lg" sx={{mt: 12, textAlign: 'center'}}>
                <CircularProgress/>
                <Typography sx={{mt: 2}}>Завантаження прогресу...</Typography>
            </Container>
        );
    }


    return (
        <Container maxWidth="lg" sx={{mt: {xs: 8, sm: 12}, mb: 4}}>
            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <AccountPage/>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Paper elevation={2} sx={{p: {xs: 2, sm: 3}, borderRadius: 2}}>
                        <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                            <AssessmentIcon sx={{mr: 1, color: 'primary.main'}}/>
                            <Typography variant="h4" component="h1">
                                Ваш Прогрес
                            </Typography>
                        </Box>

                        {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}

                        {!isLoading && coursesWithAttempts.length === 0 && !error && (
                            <Typography sx={{textAlign: 'center', color: 'text.secondary', mt: 4}}>
                                Ви ще не пройшли жодного тесту.
                            </Typography>
                        )}

                        {coursesWithAttempts.map((courseData) => {
                            // Групуємо спроби всередині кожного курсу за тестом
                            // Ключ - ID тесту, значення - масив спроб для цього тесту
                            const attemptsGroupedByTestInCourse: { [testId: string]: QuizAttempt[] } = {};
                            courseData.attempts.forEach(attempt => {
                                const testIdKey = attempt.test ? String(attempt.test.id) : `unknown-test-${attempt.id}`;
                                if (!attemptsGroupedByTestInCourse[testIdKey]) {
                                    attemptsGroupedByTestInCourse[testIdKey] = [];
                                }
                                attemptsGroupedByTestInCourse[testIdKey].push(attempt);
                            });

                            return (
                                <Box key={courseData.course.id} sx={{mb: 4}}>
                                    <Box sx={{
                                        mb: 2,
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                        pb: 1,
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' }, // Адаптивність
                                        alignItems: {sm: 'center' },
                                        justifyContent: 'space-between',
                                        gap: 1 // Проміжок між елементами
                                    }}>
                                        <Typography variant="h5" sx={{ mb: { xs: 1, sm: 0 } }}>
                                            {courseData.course.title}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            onClick={() => handleGetSertificate(courseData.course)}
                                            disabled={isLoadingSertificate}
                                            startIcon={isLoadingSertificate ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                                        >
                                            {isLoadingSertificate ? "Завантаження..." : "Отримати сертифікат"}
                                        </Button>
                                    </Box>

                                    {Object.keys(attemptsGroupedByTestInCourse).length === 0 && (
                                        <Typography sx={{color: 'text.secondary', ml: 2, fontStyle: 'italic'}}>
                                            Немає спроб для тестів цього курсу.
                                        </Typography>
                                    )}

                                    {Object.entries(attemptsGroupedByTestInCourse).map(([testIdKey, testAttempts]) => {
                                        const firstAttempt = testAttempts[0]; // Беремо першу спробу для отримання назви тесту
                                        const testTitle = firstAttempt?.test?.title ?? `Тест ID: ${testIdKey.replace('unknown-test-', '')}`;
                                        // Якщо ваш QuizAttemptResource не повертає назву секції, її тут не буде.
                                        // const sectionTitle = firstAttempt?.section_title; // Якщо це поле є в QuizAttempt

                                        return (
                                            <Accordion key={testIdKey}
                                                       sx={{mb: 2, boxShadow: 1, '&:before': {display: 'none'}}}>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                                    <Typography sx={{
                                                        fontWeight: 500,
                                                        flexShrink: 0,
                                                        mr: 2
                                                    }}>{testTitle}</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails sx={{bgcolor: 'grey.50', p: 0}}>
                                                    <List disablePadding>
                                                        {testAttempts.map((attempt) => (
                                                            <React.Fragment key={attempt.id}>
                                                                <ListItem sx={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    flexWrap: 'wrap',
                                                                    py: 1.5,
                                                                    px: 2
                                                                }}>
                                                                    <Box sx={{flexGrow: 1, mr: 2}}>
                                                                        <ListItemText
                                                                            primary={`Спроба від: ${new Date(attempt.completed_at).toLocaleString('uk-UA')}`}
                                                                        />
                                                                    </Box>
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        flexWrap: 'wrap',
                                                                        gap: 1
                                                                    }}>
                                                                        <Chip
                                                                            label={`${attempt.percentage}%`}
                                                                            color={attempt.percentage >= 80 ? 'success' : attempt.percentage >= 50 ? 'warning' : 'error'}
                                                                            size="small"
                                                                            sx={{fontWeight: 'bold'}}
                                                                        />
                                                                        <Button
                                                                            variant="outlined"
                                                                            size="small"
                                                                            color="secondary"
                                                                            startIcon={<RedoIcon/>}
                                                                            onClick={() => handleRetakeTest(attempt.test?.section_id)}
                                                                            disabled={typeof attempt.test?.section_id !== 'number'}
                                                                            sx={{textTransform: 'none'}}
                                                                        >
                                                                            Пройти знову
                                                                        </Button>
                                                                    </Box>
                                                                </ListItem>
                                                                <Divider component="li"/>
                                                            </React.Fragment>
                                                        ))}
                                                    </List>
                                                </AccordionDetails>
                                            </Accordion>
                                        );
                                    })}
                                </Box>
                            );
                        })}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};