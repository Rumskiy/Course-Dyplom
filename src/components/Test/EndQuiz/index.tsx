import React from 'react';
import {Trophy} from 'lucide-react'; // Залишаємо Lucide іконку
import {GameOverProps} from "../../../model.tsx";
import {Box, Paper, Typography, Button} from '@mui/material';
import {useNavigate} from "react-router-dom"; // Іконка для перезапуску
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export const GameOverScreen: React.FC<GameOverProps> = ({score, totalQuestions}) => {
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const nav = useNavigate();
    // Визначення кольору залежно від результату (приклад)
    let resultColor = 'text.secondary';
    if (percentage >= 80) resultColor = 'success.main';
    else if (percentage >= 50) resultColor = 'warning.main';
    else resultColor = 'error.main';

    return (
        <Paper
            elevation={4}
            sx={{
                p: {xs: 3, sm: 4},
                textAlign: 'center',
                maxWidth: '500px',
                width: '100%',
                borderRadius: 2,
            }}
        >
            {/* Використовуємо Box для центрування іконки */}
            <Box sx={{display: 'flex', justifyContent: 'center', mb: 2}}>
                {/* Стилізуємо Lucide іконку через sx */}
                <Trophy size={64}
                        style={{color: '#FFC107'}}/> {/* Можна задати колір напряму або через theme.palette.warning.main */}
            </Box>

            <Typography variant="h5" component="h2" gutterBottom sx={{fontWeight: 'bold', color: 'text.primary'}}>
                Тест завершено!
            </Typography>
            <Typography variant="h6" sx={{color: resultColor, fontWeight: 'medium'}}> {/* Колір результату */}
                Ваш результат: {score} з {totalQuestions}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{mb: 4}}>
                ({percentage}% правильних відповідей)
            </Typography>
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '24px'}}>
                <Button
                    onClick={() => nav(-1)}
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<ArrowBackIcon/>}
                    sx={{
                        fontWeight: 'bold',
                        px: 4,
                        py: 1.5
                    }}
                >
                    Вернутися до розділу
                </Button>
                <Button
                    onClick={() => nav('/account/progress')}
                    variant="contained"
                    color="primary"
                    size="large"
                    endIcon={<ArrowForwardIcon/>}
                    sx={{
                        fontWeight: 'bold',
                        px: 4,
                        py: 1.5
                    }}
                >
                    Перейти до сторінки результатів
                </Button>
            </div>
        </Paper>
    );
};