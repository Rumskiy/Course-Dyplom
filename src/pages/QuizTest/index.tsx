// src/pages/Quiz/QuizTestPage.tsx (or wherever it resides)
import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {TimerIcon, AlertCircle, ChevronLeft, ChevronRight, Send} from 'lucide-react';
import {
    Button, Typography, Container, Box, Paper, CircularProgress, Stack, Alert, AlertTitle,
    Checkbox, FormControlLabel, RadioGroup, Radio, List, ListItem, ListItemText, CardMedia, Chip, Grid
} from "@mui/material";
// Import Drag and Drop components
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
    DroppableProvided,
    DraggableProvided,
    DroppableStateSnapshot,
    DraggableStateSnapshot
} from 'react-beautiful-dnd';

import {apiClient} from '../../api/api';
import {ApiMatchPair, ApiQuestion, QuizResultPayload, TestData, UserAnswerPayload} from '../../model'; // Ensure these types are correct
import {StartScreen} from '../../components/Test/StartQuiz'; // Adjust path if needed
import {GameOverScreen} from '../../components/Test/EndQuiz'; // Adjust path if needed


// --- Типи ---
type QuizGameState = "loading" | "start" | "playing" | "gameOver";


// Тип для даних, що повертаються після збереження спроби
interface QuizAttemptResult {
    id: number; // Attempt ID
    score: number;
    total_questions: number;
    percentage: number;
    // ... maybe correct_answers_count, incorrect_answers_count etc.
}


// --- API Функції (Keep your existing functions) ---
const getTestByIdApi = async (id: string | number): Promise<TestData> => {
    // Make sure URL is correct, e.g., /api/tests/{id} or similar
    const response = await apiClient.get(`/courses/section/tests/${id}`); // CHECK URL
    if (!response.data) { // Adjust based on your actual API response structure
        throw new Error("Invalid API response structure for getTestById");
    }
    return response.data; // Adjust if necessary (e.g., response.data)
};

const submitQuizResultApi = async (payload: QuizResultPayload): Promise<QuizAttemptResult> => {
    const response = await apiClient.post('/quiz/attempts', payload); // CHECK URL
    if (!response.data?.data) { // Adjust based on your actual API response structure
        throw new Error("Invalid API response structure for submitQuizResult");
    }
    return response.data.data; // Adjust if necessary
};

// --- Компонент ---
export const QuizTestPage: React.FC = () => {
    const {sectionId} = useParams<{ sectionId: string }>(); // Test ID from URL
    const navigate = useNavigate();

    // --- Стани ---
    const [gameState, setGameState] = useState<QuizGameState>("loading");
    const [testData, setTestData] = useState<TestData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswerPayload>>({}); // question.id -> answer
    const [error, setError] = useState<string | null>(null);
    const [totalTimeLeft, setTotalTimeLeft] = useState<number | null>(null);
    const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null);
    // State to hold the current order of the RIGHT side pairs for drag-and-drop
    // Ensure ApiMatchPair has 'id', 'left_text', 'right_text'
    const [shuffledRightPairs, setShuffledRightPairs] = useState<ApiMatchPair[]>([]);
    const [finalResult, setFinalResult] = useState<QuizAttemptResult | null>(null);

    // --- Refs ---
    // @ts-ignore
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // --- Мемоізовані значення ---
    const currentQuestion: ApiQuestion | undefined = useMemo(() =>
            testData?.questions?.[currentQuestionIndex],
        [testData, currentQuestionIndex]
    );
    // Ensure correct check for null/undefined AND > 0
    const useTotalTimer = useMemo(() => testData?.total_time_limit != null && testData.total_time_limit > 0, [testData]);
    const useQuestionTimer = useMemo(() => !useTotalTimer && testData?.time_per_question != null && testData.time_per_question > 0, [useTotalTimer, testData]);
    const currentAnswer = useMemo(() =>
            currentQuestion ? userAnswers[currentQuestion.id] : undefined,
        [userAnswers, currentQuestion]
    );
    const totalQuestions = useMemo(() => testData?.questions?.length ?? 0, [testData]);

    // --- Функції-обробники ---
    const handleNextQuestion = useCallback(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
        // Removed auto-finish on next from last question, explicit finish button is better UX
    }, [currentQuestionIndex, totalQuestions]);

    const handlePrevQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }, [currentQuestionIndex]);

    // Explicit function to finish the quiz (triggered by button or timer)
    const finishQuiz = useCallback(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setGameState("gameOver"); // Transition state, results will be submitted via useEffect
    }, []);

    // Generic answer update function
    const updateAnswer = useCallback((questionId: number, answerData: Partial<UserAnswerPayload>) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: {
                // Ensure question_id is always present
                // @ts-ignore
                question_id: questionId,
                // Merge existing data (if any) with new data
                ...(prev[questionId] || {}),
                ...answerData
            }
        }));
    }, []);

    // Handler for single choice (Radio buttons)
    const handleSingleChoiceSelect = useCallback((optionIdStr: string) => {
        if (!currentQuestion) return;
        const numOptionId = parseInt(optionIdStr, 10);
        if (!isNaN(numOptionId)) {
            updateAnswer(currentQuestion.id, {selected_option_ids: [numOptionId]});
        }
    }, [currentQuestion, updateAnswer]);

    // Handler for multiple choice (Checkboxes)
    const handleMultipleChoiceSelect = useCallback((optionId: number, checked: boolean) => {
        if (!currentQuestion) return;
        const currentSelection = currentAnswer?.selected_option_ids || [];
        let newSelection: number[];
        if (checked) {
            newSelection = Array.from(new Set([...currentSelection, optionId]));
        } else {
            newSelection = currentSelection.filter(id => id !== optionId);
        }
        updateAnswer(currentQuestion.id, {selected_option_ids: newSelection});
    }, [currentQuestion, currentAnswer, updateAnswer]);

    // --- Drag and Drop Handler ---
    const handleMatchDragEnd = useCallback((result: DropResult) => {
        const {source, destination} = result;

        // 1. Guard Clauses (Checks if drop is valid) - LOOKS GOOD
        // Ignore drop outside the list
        if (!destination) {
            return;
        }
        // Ignore if dropped in the same place
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }
        // Ignore if not the current question or data is missing
        if (!currentQuestion || currentQuestion.type !== 'match' || !currentQuestion.match_pairs) {
            return;
        }

        // 2. Reordering Logic - LOOKS GOOD (Standard RBD reorder)
        const currentRightSideOrder = Array.from(shuffledRightPairs); // Create a copy
        const [reorderedItem] = currentRightSideOrder.splice(source.index, 1); // Remove from old index
        currentRightSideOrder.splice(destination.index, 0, reorderedItem); // Insert at new index

        // 3. Update Visual State - CRUCIAL STEP
        setShuffledRightPairs(currentRightSideOrder); // <-- This updates what the user sees

        // 4. Update Answer State - LOOKS LOGICALLY CORRECT
        // Maps the static left items to the newly ordered right items
        // @ts-ignore - If you are sure currentQuestion.match_pairs is valid here
        const selectedPairs = currentQuestion.match_pairs.map((leftPair, index) => {
            const correspondingRightPair = currentRightSideOrder[index]; // Get the item now at this index
            return {
                left_id: leftPair.id,
                selected_right_id: correspondingRightPair?.id ?? 0 // Use ID of the right pair
            };
        });
        updateAnswer(currentQuestion.id, {selected_pairs: selectedPairs});

    }, [currentQuestion, shuffledRightPairs, updateAnswer]); // Dependencies seem correct


    const handleRestartQuiz = useCallback(() => {
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setError(null);
        setFinalResult(null);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); // Clear timer
        timerIntervalRef.current = null;

        // Reset timers based on testData
        if (testData?.total_time_limit != null && testData.total_time_limit > 0) {
            setTotalTimeLeft(testData.total_time_limit * 60);
        } else {
            setTotalTimeLeft(null); // Ensure reset if no total timer
        }
        // Reset question timer based on first question or general setting
        const firstQuestionTime = testData?.time_per_question; // Using the general time per question
        setQuestionTimeLeft(firstQuestionTime ?? null);

        setGameState("playing"); // Go directly to playing
    }, [testData]); // Dependency on testData to access timer settings

    // Function to submit results (called by useEffect when gameState is gameOver)
    const submitResult = useCallback(async () => {
        // Ensure testData and its questions array are available
        if (!testData || !testData.id || !testData.questions) {
            setError("Не вдалося визначити дані тесту або питання для відправки.");
            // Keep gameState as "gameOver" to display the error, but don't proceed
            return;
        }

        const finalAnswersPayload: UserAnswerPayload[] = testData.questions.map(question => {
            // Get the answer the user provided for this specific question, if any
            const userAnswer = userAnswers[question.id];

            if (userAnswer) {
                const hasSelection = (userAnswer.selected_option_ids && userAnswer.selected_option_ids.length > 0) ||
                    (userAnswer.selected_pairs && userAnswer.selected_pairs.length > 0);
                if (!hasSelection) {
                    console.warn(`User answer object exists for Q ${question.id}, but contains no selection.`);
                    // Sending it as is, backend validation might still occur if it requires a specific format
                }
                return {
                    ...userAnswer, // Spread existing answer data (selected_option_ids or selected_pairs)
                    question_id: question.id // Make sure question_id is present
                };
            } else {
                return {
                    question_id: question.id
                };
            }
        });
        const payload: QuizResultPayload = {
            test_id: testData.id,
            answers: finalAnswersPayload // Use the comprehensive list
        };

        try {
            // Log the payload clearly before sending
            const resultData = await submitQuizResultApi(payload);
            setFinalResult(resultData); // Store result for GameOverScreen

        } catch (error: any) {
            const status = error.response?.status;
            const backendMessage = error.response?.data?.message || "Невідома помилка сервера";
            const validationErrors = error.response?.data?.errors; // Laravel-style validation errors

            let errorMessage = `Помилка збереження результату на сервері (${status || 'N/A'}).`;

            if (status === 422) {
                errorMessage = `Помилка валідації (${status}): ${backendMessage}.`;
                if (validationErrors) {
                    // Optional: Extract first validation error for more detail
                    try {
                        const firstErrorKey = Object.keys(validationErrors)[0];
                        const firstErrorMessage = Array.isArray(validationErrors[firstErrorKey]) ? validationErrors[firstErrorKey][0] : JSON.stringify(validationErrors[firstErrorKey]);
                        if (firstErrorMessage) {
                            errorMessage += ` Деталі: ${firstErrorMessage}`;
                        }
                    } catch (e) {
                    }
                }
            } else {
                errorMessage = `Помилка збереження (${status || 'N/A'}): ${backendMessage || error.message}`;
            }

            setError(errorMessage);
            // Keep gameState as "gameOver" to display the error
        }
    }, [testData, userAnswers, totalQuestions]); // Dependencies updated


    // --- useEffect Хуки ---

    // 1. Fetch Test Data
    useEffect(() => {
        let isMounted = true;
        if (!sectionId) {
            if (isMounted) {
                setError("ID тесту не вказано в URL.");
                setGameState("gameOver");
            }
            return;
        }
        setGameState("loading");
        setError(null);
        setUserAnswers({});
        setFinalResult(null);

        getTestByIdApi(sectionId)
            .then(data => {
                if (isMounted) {
                    if (data && data.questions && data.questions.length > 0) {
                        setTestData(data);
                        // Initialize timers correctly
                        if (data.total_time_limit != null && data.total_time_limit > 0) {
                            setTotalTimeLeft(data.total_time_limit * 60);
                            setQuestionTimeLeft(null); // Disable question timer if total timer exists
                        } else {
                            setTotalTimeLeft(null);
                            const firstQuestionTime = data.time_per_question; // General time per question
                            setQuestionTimeLeft(firstQuestionTime ?? null);
                        }
                        setGameState("start"); // Go to start screen first
                    } else {
                        const errMsg = data ? "Тест отримано, але він не містить питань." : "Тест з таким ID не знайдено.";
                        setError(errMsg);
                        setGameState("gameOver");
                    }
                }
            })
            .catch(err => {
                if (isMounted) {
                    setError("Не вдалося завантажити дані тесту. " + (err.message || ""));
                    setGameState("gameOver");
                }
            });

        // Cleanup function
        return () => {
            isMounted = false;
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [sectionId]); // Re-fetch only if sectionId changes

    // 2. Handle Current Question Change (for Match type setup & Question Timer reset)
    // 2. Handle Current Question Change (for Match type setup & Question Timer reset)
    useEffect(() => {

        if (currentQuestion?.type === 'match' && currentQuestion.match_pairs && currentQuestion.match_pairs.length > 0) {

            const shuffled = [...currentQuestion.match_pairs].sort(() => Math.random() - 0.5);
            setShuffledRightPairs(shuffled);

            if (!userAnswers[currentQuestion.id]) {
                const initialSelectedPairs = currentQuestion.match_pairs.map((leftPair, index) => ({
                    left_id: leftPair.id, // ID of the static left item
                    selected_right_id: shuffled[index]?.id ?? 0 // ID of the right item currently at this visual index
                }));
                updateAnswer(currentQuestion.id, {selected_pairs: initialSelectedPairs});
            }
        } else {
            // If not a match question or no pairs, clear the shuffled state
            setShuffledRightPairs([]);
        }

        // Reset the question timer if it's active when the question changes
        if (useQuestionTimer && testData?.time_per_question != null) { // Check for null explicitly
            setQuestionTimeLeft(testData.time_per_question);
        } else if (!useTotalTimer) { // If no total timer and no specific question time, ensure it's null
            setQuestionTimeLeft(null);
        }
    }, [currentQuestion, useQuestionTimer, testData?.time_per_question]); // <--- REMOVED userAnswers and updateAnswer

    // 3. Timer Logic
    useEffect(() => {
        // Only run timer logic when actively playing
        if (gameState !== "playing") {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            return; // Exit if not playing
        }

        // Prevent multiple intervals
        if (timerIntervalRef.current) {
            return;
        }

        // Only start if a timer is actually configured
        if (!useTotalTimer && !useQuestionTimer) {
            return;
        }

        timerIntervalRef.current = setInterval(() => {
            if (useTotalTimer) {
                setTotalTimeLeft(prev => {
                    if (prev === null) return null; // Should not happen if useTotalTimer is true
                    const nextTime = prev - 1;
                    if (nextTime <= 0) {
                        finishQuiz(); // Call the explicit finish function
                        return 0;
                    }
                    return nextTime;
                });
            } else if (useQuestionTimer) {
                setQuestionTimeLeft(prev => {
                    if (prev === null) return null;
                    const nextTime = prev - 1;
                    if (nextTime <= 0) {
                        // Move to next question or finish if last one
                        if (currentQuestionIndex < totalQuestions - 1) {
                            handleNextQuestion(); // This will trigger the other useEffect to reset time
                        } else {
                            finishQuiz(); // It was the last question
                        }
                        // Return 0 or null to stop the timer for this question visually
                        // The other useEffect will set the correct time for the *next* question
                        return null;
                    }
                    return nextTime;
                });
            }
        }, 1000);

        // Cleanup interval on unmount or when dependencies change
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
        // Dependencies: Re-evaluate timer logic if game state or timer modes change
    }, [gameState, useTotalTimer, useQuestionTimer, finishQuiz, handleNextQuestion, currentQuestionIndex, totalQuestions]);

    // 4. Submit Results when Game Over
    useEffect(() => {
        // Only submit if game is over, we have test data, no error occurred during loading,
        // and results haven't already been fetched/set.
        if (gameState === 'gameOver' && testData && !error && !finalResult) {
            submitResult();
        }
    }, [gameState, testData, error, finalResult, submitResult]); // Dependencies


    // --- Форматування часу ---
    const formatTime = (seconds: number | null): string => {
        if (seconds === null || seconds < 0) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Рендеринг ---

    // Loading State
    if (gameState === "loading") {
        return <Box
            sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}><CircularProgress
            size={60}/></Box>;
    }

    // Start Screen State
    if (gameState === "start" && testData) {
        return <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: 'grey.100',
            p: 2
        }}>
            <StartScreen
                testTitle={testData.title}
                onStartQuiz={handleRestartQuiz} // Use handleRestartQuiz to transition to playing
            />
        </Box>;
    }

    // Game Over State (handles errors, submitting, and showing results)
    if (gameState === "gameOver") {
        return (
            <Container maxWidth="sm" sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                bgcolor: 'grey.100',
            }}>
                {error ? (
                    // Display Error
                    <Paper elevation={3} sx={{p: 4, textAlign: 'center', width: '100%'}}>
                        <Alert severity="error" icon={<AlertCircle size={40}/>} sx={{justifyContent: 'center', mb: 2}}>
                            <AlertTitle sx={{fontSize: '1.5rem', fontWeight: 'bold'}}>Помилка</AlertTitle>
                            <Typography variant="body1">{error}</Typography>
                        </Alert>
                        <Button onClick={() => navigate('/')} variant="contained" color="primary" sx={{mt: 3}}>На
                            головну</Button>
                    </Paper>
                ) : finalResult ? (
                    // Display Final Score
                    <GameOverScreen
                        score={finalResult.score}
                        totalQuestions={finalResult.total_questions}
                        percentage={finalResult.percentage}
                        onRestart={handleRestartQuiz}
                        // Optional: Link to view attempt details if applicable
                        // onViewDetails={() => navigate(`/quiz/attempt/${finalResult.id}`)}
                    />
                ) : (
                    // Display Submitting Indicator
                    <Box sx={{textAlign: 'center'}}>
                        <CircularProgress sx={{mb: 2}}/>
                        <Typography>Завершення тесту та збереження результатів...</Typography>
                    </Box>
                )}
            </Container>
        );
    }

    // Playing State
    if (gameState === "playing" && currentQuestion && testData) {
        const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
        const displayTime = useTotalTimer ? totalTimeLeft : (useQuestionTimer ? questionTimeLeft : null);
        // Highlight timer if <= 10 seconds remaining
        const isTimeRunningOut = displayTime !== null && displayTime <= 10;

        return (
            <Container maxWidth="md" sx={{py: {xs: 2, md: 12}}}>
                <Paper elevation={3} sx={{p: {xs: 2, sm: 3, md: 4}, borderRadius: 2, position: 'relative'}}>
                    {/* Top Bar: Timer & Navigation */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                        flexWrap: 'wrap',
                        gap: 1
                    }}>
                        <Button size="small" startIcon={<ChevronLeft/>} onClick={handlePrevQuestion}
                                disabled={currentQuestionIndex === 0}>Назад</Button>
                        <Stack direction="column" alignItems="center" spacing={0.5}>
                            <Typography variant="body2"
                                        color="text.secondary"> Питання {currentQuestionIndex + 1}/{totalQuestions} </Typography>
                            {displayTime !== null &&
                                <Chip icon={<TimerIcon size={16}/>} label={formatTime(displayTime)} size="small"
                                      color={isTimeRunningOut ? "error" : "default"} sx={{fontWeight: 'medium'}}/>}
                        </Stack>
                        <Button
                            size="small"
                            endIcon={isLastQuestion ? <Send size={16}/> : <ChevronRight/>}
                            onClick={isLastQuestion ? finishQuiz : handleNextQuestion} // Use finishQuiz for last question
                            variant="contained"
                            color={isLastQuestion ? "success" : "primary"}
                        >
                            {isLastQuestion ? 'Завершити' : 'Далі'}
                        </Button>
                    </Box>
                    <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '16px 0'}}/>

                    {/* --- IMAGE DISPLAY --- */}
                    {/* Check if image array exists, has items, and the first item has a link */}
                    {currentQuestion.image && Array.isArray(currentQuestion.image) && currentQuestion.image.length > 0 && currentQuestion.image[0]?.link && typeof currentQuestion.image[0].link === 'string' && (
                        <CardMedia
                            component="img"
                            // Access the link property from the first object in the image array
                            image={currentQuestion.image[0].link}
                            alt={`Зображення до питання ${currentQuestionIndex + 1}`}
                            sx={{
                                maxHeight: 300, // Adjust max height as needed
                                width: 'auto', // Let width adjust
                                maxWidth: '100%', // Prevent overflow
                                objectFit: 'contain', // 'cover' or 'contain'
                                display: 'block',
                                margin: '0 auto 24px auto', // Center horizontally, add bottom margin
                                borderRadius: 1 // Optional rounded corners
                            }}
                        />
                    )}
                    {/* End Image Display */}

                    {/* Question Text */}
                    <Typography variant="h5" component="h2" sx={{mb: 3, textAlign: 'center', fontWeight: 500}}>
                        {currentQuestion.text}
                        {/* Display points chip if points > 1 */}
                        {currentQuestion.points != null && currentQuestion.points > 1 &&
                            <Chip label={`${currentQuestion.points} бали`} size="small" variant='outlined'
                                  color="primary" sx={{ml: 1, verticalAlign: 'middle'}}/>
                        }
                    </Typography>

                    {/* Answer Options Area */}
                    <Box sx={{mb: 3, minHeight: '150px' /* Ensure some min height */}}>
                        {/* Single Choice */}
                        {currentQuestion.type === 'single_choice' && currentQuestion.options && (
                            <RadioGroup
                                value={currentAnswer?.selected_option_ids?.[0]?.toString() || ''} // Ensure value is string
                                onChange={(e) => handleSingleChoiceSelect(e.target.value)}
                            >
                                {currentQuestion.options.map((option) => (
                                    // Wrap each option in Paper for better styling/hover
                                    <Paper key={option.id} variant="outlined"
                                           sx={{mb: 1, '&:hover': {bgcolor: 'action.hover'}}}>
                                        <FormControlLabel
                                            value={option.id.toString()} // Value must be string
                                            control={<Radio sx={{mr: 1}}/>}
                                            label={option.text}
                                            sx={{width: '100%', p: 1.5, m: 0}} // Fill width, adjust padding
                                        />
                                    </Paper>
                                ))}
                            </RadioGroup>
                        )}

                        {/* Multiple Choice */}
                        {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                            <Stack spacing={1}>
                                {currentQuestion.options.map((option) => (
                                    <Paper key={option.id} variant="outlined"
                                           sx={{'&:hover': {bgcolor: 'action.hover'}}}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={currentAnswer?.selected_option_ids?.includes(option.id) || false}
                                                    onChange={(e) => handleMultipleChoiceSelect(option.id, e.target.checked)}
                                                    sx={{mr: 1}}
                                                />
                                            }
                                            label={option.text}
                                            sx={{width: '100%', p: 1.5, m: 0}}
                                        />
                                    </Paper>
                                ))}
                            </Stack>
                        )}

                        {/* --- MATCH TYPE with Drag-and-Drop --- */}
                        {currentQuestion.type === 'match' && currentQuestion.match_pairs && currentQuestion.match_pairs.length > 0 && (
                            <DragDropContext onDragEnd={handleMatchDragEnd}>
                                <Grid container spacing={2}
                                      alignItems="stretch"> {/* alignItems ensures columns have similar apparent height */}

                                    {/* Static Left Column */}
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle1" gutterBottom align="center"
                                                    sx={{fontWeight: 'medium'}}>
                                            З'єднайте з:
                                        </Typography>
                                        <List dense disablePadding sx={{
                                            bgcolor: 'grey.100',
                                            borderRadius: 1,
                                            border: '1px solid #eee',
                                            height: '100%'
                                        }}>
                                            {/* Ensure match_pairs is not undefined */}
                                            {(currentQuestion.match_pairs || []).map((leftPair) => (
                                                <ListItem key={`left-${leftPair.id}`} // Use unique leftPair.id
                                                          sx={{
                                                              borderBottom: '1px dashed #ddd',
                                                              minHeight: 56, /* Adjust min height */
                                                              display: 'flex',
                                                              alignItems: 'center',
                                                              '&:last-child': {borderBottom: 'none'}
                                                          }}
                                                >
                                                    <ListItemText primary={leftPair.left_text}
                                                                  sx={{textAlign: 'center'}}/>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Grid>

                                    {/* Draggable Right Column */}
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle1" gutterBottom align="center"
                                                    sx={{fontWeight: 'medium'}}>
                                            Перетягніть сюди:
                                        </Typography>
                                        {/* Droppable Area */}
                                        <Droppable droppableId={`match-droppable-${currentQuestion.id}`}>
                                            {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                                                <List
                                                    dense
                                                    disablePadding
                                                    ref={provided.innerRef} // Connect ref
                                                    {...provided.droppableProps} // Apply props
                                                    sx={{
                                                        bgcolor: snapshot.isDraggingOver ? 'primary.lighter' : 'grey.100', // Highlight when dragging over
                                                        borderRadius: 1,
                                                        border: '1px solid #eee',
                                                        height: '100%', // Match height of left column
                                                        transition: 'background-color 0.2s ease',
                                                        minHeight: 56 * (currentQuestion.match_pairs?.length ?? 1) // Ensure min height based on items
                                                    }}
                                                >
                                                    {/* Map over the SHUFFLED state for the right side */}
                                                    {shuffledRightPairs.map((rightPair, index) => (
                                                        <Draggable
                                                            key={`right-${rightPair.id}`} // Use unique rightPair.id
                                                            draggableId={`right-${rightPair.id}`} // Must be a unique string ID
                                                            index={index} // Current position in the list
                                                        >
                                                            {(providedDraggable: DraggableProvided, snapshotDraggable: DraggableStateSnapshot) => (
                                                                <ListItem
                                                                    ref={providedDraggable.innerRef} // Connect ref
                                                                    {...providedDraggable.draggableProps} // Make it draggable
                                                                    {...providedDraggable.dragHandleProps} // Define the drag handle area (whole item)
                                                                    sx={{
                                                                        borderBottom: '1px dashed #ddd',
                                                                        minHeight: 56, // Match left side height
                                                                        userSelect: 'none', // Prevent text selection while dragging
                                                                        bgcolor: snapshotDraggable.isDragging ? 'background.paper' : 'inherit', // Change background when dragging
                                                                        boxShadow: snapshotDraggable.isDragging ? '0px 3px 5px rgba(0,0,0,0.2)' : 'none', // Add shadow when dragging
                                                                        display: 'flex', alignItems: 'center',
                                                                        '&:last-child': {borderBottom: 'none'},
                                                                        // IMPORTANT: Apply styles from providedDraggable for correct positioning
                                                                        ...providedDraggable.draggableProps.style,
                                                                    }}
                                                                >
                                                                    <ListItemText primary={rightPair.right_text}
                                                                                  sx={{textAlign: 'center'}}/>
                                                                </ListItem>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {/* Placeholder space for dragging items */}
                                                    {provided.placeholder}
                                                </List>
                                            )}
                                        </Droppable>
                                    </Grid>
                                </Grid>
                            </DragDropContext>
                        )}

                    </Box>

                    {/* Bottom Navigation */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 4,
                        pt: 2,
                        borderTop: '1px solid #eee'
                    }}>
                        <Button size="small" startIcon={<ChevronLeft/>} onClick={handlePrevQuestion}
                                disabled={currentQuestionIndex === 0}>Назад</Button>
                        <Button
                            size="small"
                            endIcon={isLastQuestion ? <Send size={16}/> : <ChevronRight/>}
                            onClick={isLastQuestion ? finishQuiz : handleNextQuestion}
                            variant="contained"
                            color={isLastQuestion ? "success" : "primary"}
                        >
                            {isLastQuestion ? 'Завершити' : 'Далі'}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        );
    }
    return <Box sx={{p: 3}}><Alert severity="warning">Сталася неочікувана помилка при відображенні тесту.</Alert></Box>;
};