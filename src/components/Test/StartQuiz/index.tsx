import React from 'react';
import { StartScreenProps } from '../../../model';
import { Paper, Typography, Button } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'; // Приклад іконки MUI

export const StartScreen: React.FC<StartScreenProps> = ({ testTitle, onStartQuiz }) => {
    return (
        // Використовуємо Paper для ефекту картки
        <Paper
            elevation={4} // Тінь
            sx={{
                p: { xs: 3, sm: 4 }, // Падінги
                textAlign: 'center',
                maxWidth: '500px', // Максимальна ширина
                width: '100%',     // Займає всю доступну ширину до maxWidth
                borderRadius: 2,    // Закруглені кути
            }}
        >
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {testTitle || 'Тестування'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Перевірте свої знання! На кожне питання буде обмежений час.
            </Typography>
            <Button
                onClick={onStartQuiz}
                variant="contained" // Стиль кнопки
                color="primary"     // Колір кнопки
                size="large"        // Розмір кнопки
                startIcon={<PlayCircleOutlineIcon />} // Іконка на початку
                sx={{
                    fontWeight: 'bold',
                    px: 4, // Горизонтальні падінги
                    py: 1.5 // Вертикальні падінги
                }}
            >
                Розпочати тест
            </Button>
        </Paper>
    );
};