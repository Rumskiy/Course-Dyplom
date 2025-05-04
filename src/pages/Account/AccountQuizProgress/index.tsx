import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Grid, // Використаємо Grid для сітки
    Chip, // Для відображення відсотка
    Accordion, // Акордеон для групування
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentIcon from '@mui/icons-material/Assessment'; // Іконка для прогресу
import RedoIcon from '@mui/icons-material/Redo'; // Іконка для "перепройти"
import { AuthContext } from '../../../Backend/Auth';
import {getQuizAttempts} from "../../../api/QuizAttemtps"; // Перевірте шлях
import { QuizAttempt } from '../../../model.tsx';
import {AccountPage} from "../AccountPage";

interface GroupedAttemptsByTest {
    [courseTitle: string]: {
        // Keys are Test IDs (represented as strings), values are arrays of attempts for that test
        [testIdKey: string]: QuizAttempt[];
    };
}

// Новий компонент сторінки
export const AccountProgressPage: React.FC = () => {
    // @ts-ignore
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    // @ts-ignore
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [groupedAttempts, setGroupedAttempts] = useState<GroupedAttemptsByTest>({});

    useEffect(() => {
        let isMounted = true;
        const fetchAttempts = async () => {
            if (!user) {
                setError("Будь ласка, увійдіть, щоб переглянути прогрес.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const data: QuizAttempt[] | null = await getQuizAttempts(); // Функція API для отримання спроб

                if (!isMounted) return;

                if (data && Array.isArray(data)) {
                    setAttempts(data);

                    // --- MODIFIED GROUPING LOGIC ---
                    const grouped = data.reduce((acc: GroupedAttemptsByTest, attempt) => {
                        const courseTitle = attempt.course_title ?? 'Невідомий Курс';
                        // @ts-ignore
                        const testIdKey = String(attempt?.test.id ?? 'unknown-test');

                        if (!acc[courseTitle]) {
                            acc[courseTitle] = {};
                        }
                        if (!acc[courseTitle][testIdKey]) {
                            acc[courseTitle][testIdKey] = [];
                        }
                        acc[courseTitle][testIdKey].push(attempt);

                        return acc;
                    }, {} as GroupedAttemptsByTest);
                    // --- END MODIFIED GROUPING ---
                    setGroupedAttempts(grouped);
                } else {
                    setAttempts([]); // Встановлюємо порожній масив, якщо даних немає
                    setGroupedAttempts({});
                    // Можна додати повідомлення, що спроб ще немає
                }
            } catch (err) {
                if (!isMounted) return;
                setError("Не вдалося завантажити ваш прогрес. Спробуйте пізніше.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchAttempts();

        return () => { isMounted = false; }; // Очищення
    }, [user]); // Перезавантажуємо, якщо користувач змінився

    // Навігація для повторного проходження тесту
    const handleRetakeTest = (sectionId: number | string | undefined) => {
        if(sectionId) {
            navigate(`/course/section/${sectionId}/test`);
        } else {
            console.error("Не вдалося перепройти тест: ID секції не знайдено.");
            // toast.error("Не вдалося перепройти тест.");
        }
    };


    if (isLoading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 12, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Завантаження прогресу...</Typography>
            </Container>
        );
    }

    // Використовуємо той самий макет, що й AccountCourses, але адаптуємо контент
    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 8, sm: 12 }, mb: 4 }}>
            <Grid container spacing={4}>

                {/* Бокове меню */}
                <Grid item xs={12} md={4}>
                        <AccountPage />
                </Grid>

                {/* Основний контент */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h4" component="h1">
                                Ваш Прогрес
                            </Typography>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        {!isLoading && Object.keys(groupedAttempts).length === 0 && !error && (
                            <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                                Ви ще не пройшли жодного тесту.
                            </Typography>
                        )}

                        {/* Відображення згрупованих спроб */}
                        {Object.entries(groupedAttempts).map(([courseTitle, testsById]) => (
                            <Box key={courseTitle} sx={{ mb: 4 }}>
                                <Typography variant="h5" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                                    {courseTitle}
                                </Typography>

                                {/* Тести в межах курсу */}
                                {Object.entries(testsById).map(([testIdKey, testAttempts]) => {
                                    const firstAttempt = testAttempts[0];
                                    const testTitle = firstAttempt?.test?.title ?? `Тест ID: ${testIdKey.replace('test-', '')}`;
                                    const sectionTitle = firstAttempt?.section_title;

                                    return (
                                        <Accordion key={testIdKey} sx={{ mb: 2, boxShadow: 1, '&:before': { display: 'none' } }}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography sx={{ fontWeight: 500, flexShrink: 0, mr: 2 }}>{testTitle}</Typography>
                                                {sectionTitle && (
                                                    <Typography sx={{ color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        (Розділ: {sectionTitle})
                                                    </Typography>
                                                )}
                                            </AccordionSummary>

                                            <AccordionDetails sx={{ bgcolor: 'grey.50', p: 0 }}>
                                                <List disablePadding>
                                                    {testAttempts.map((attempt) => (
                                                        <React.Fragment key={attempt.id}>
                                                            <ListItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', py: 1.5, px: 2 }}>
                                                                <Box sx={{ flexGrow: 1, mr: 2 }}>
                                                                    <ListItemText
                                                                        primary={`Спроба від: ${new Date(attempt.completed_at_iso).toLocaleString('uk-UA')}`}
                                                                    />
                                                                </Box>

                                                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                                    <Chip
                                                                        label={`${attempt.percentage}%`}
                                                                        color={attempt.percentage >= 80 ? 'success' : attempt.percentage >= 50 ? 'warning' : 'error'}
                                                                        size="small"
                                                                        sx={{ fontWeight: 'bold' }}
                                                                    />
                                                                    <Button
                                                                        variant="outlined"
                                                                        size="small"
                                                                        color="secondary"
                                                                        startIcon={<RedoIcon />}
                                                                        onClick={() => handleRetakeTest(attempt.test?.section_id)}
                                                                        disabled={!attempt.test?.section_id}
                                                                        sx={{ textTransform: 'none' }}
                                                                    >
                                                                        Пройти знову
                                                                    </Button>
                                                                </Box>
                                                            </ListItem>
                                                            <Divider component="li" />
                                                        </React.Fragment>
                                                    ))}
                                                </List>
                                            </AccordionDetails>

                                        </Accordion>
                                    );
                                })}
                            </Box>
                        ))}

                    </Paper>
                </Grid>

            </Grid>
        </Container>

    );
};