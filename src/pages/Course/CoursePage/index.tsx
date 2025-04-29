import React, { useState, useEffect, useCallback } from "react"; // Імпортуємо React явно
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    List,
    ListItemButton, // Використовуємо ListItemButton
    ListItemText,
    Typography,
    Divider,
    styled,
    keyframes,
    CircularProgress,
    Alert,
} from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getSections } from "../../../api/Section"; // Перевірте шлях!
import parser from 'html-react-parser';
import { Section as SectionType } from "../../../model"; // Імпортуйте ваш тип Section!

// --- Анімація та Стилі ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Оновлений StyledListItemButton, що обробляє стилі залежно від selected
const StyledListItemButton = styled(ListItemButton, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected: boolean }>(({ theme, selected }) => ({
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(0.5, 1),
    transition: 'background-color 0.3s ease, transform 0.2s ease, border-color 0.3s ease, padding-left 0.3s ease',
    backgroundColor: selected ? theme.palette.action.selected : 'transparent',
    borderLeft: selected ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
    paddingLeft: selected ? theme.spacing(1.75) : theme.spacing(2), // Невеликий відступ для активного
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
        transform: 'translateX(3px)',
    },
    // Стилі для тексту всередині кнопки тепер тут не потрібні,
    // але ми можемо додати їх, якщо хочемо вплинути на всі дочірні елементи
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary, // Колір тексту залежно від вибору
    '.MuiListItemText-primary': { // Стилізуємо текст через клас MUI
        fontWeight: selected ? 600 : 400,
        fontSize: '0.9375rem', // 15px
        whiteSpace: 'normal', // Дозволяємо перенос
    }
}));


const ContentContainer = styled(Box)(({ theme }) => ({
    maxWidth: '700px',
    margin: '0 auto',
    padding: theme.spacing(3),
    fontFamily: '"Georgia", "Cambria", "Times New Roman", Times, serif',
    lineHeight: 1.7,
    animation: `${fadeIn} 0.6s ease-out`,
    color: theme.palette.text.primary,
}));

const TitleTypography = styled(Typography)(({ theme }) => ({
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.3,
    marginBottom: theme.spacing(3),
    color: theme.palette.text.primary,
    fontFamily: '"Merriweather", serif', // Красивіший шрифт для заголовка
}));

const ContentBox = styled(Box)(({ theme }) => ({
    fontSize: '1.125rem', // 18px
    lineHeight: 1.75, // Збільшимо ще трохи
    color: theme.palette.text.secondary,
    '& p': {
        marginBottom: theme.spacing(2.5),
    },
    '& h1, & h2, & h3, & h4, & h5, & h6': { // Застосуємо до всіх заголовків
        fontFamily: '"Lato", "Helvetica Neue", Helvetica, Arial, sans-serif', // Шрифт без засічок
        fontWeight: 700, // Жирніший
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(1.5),
        lineHeight: 1.4,
        color: theme.palette.text.primary, // Темніший колір для заголовків
    },
    '& h1': { fontSize: '2rem' }, // Розміри заголовків
    '& h2': { fontSize: '1.75rem' },
    '& h3': { fontSize: '1.5rem' },
    '& h4': { fontSize: '1.25rem' },
    '& img': {
        maxWidth: '100%',
        height: 'auto',
        borderRadius: '8px',
        margin: theme.spacing(4, 0),
        display: 'block', // Щоб margin auto працював
        marginLeft: 'auto',
        marginRight: 'auto',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)', // Легка тінь
    },
    '& blockquote': {
        borderLeft: `4px solid ${theme.palette.primary.light}`,
        paddingLeft: theme.spacing(2.5),
        marginLeft: 0, // Скидаємо стандартний відступ
        marginRight: 0,
        margin: theme.spacing(3, 0),
        fontStyle: 'italic',
        color: theme.palette.text.secondary,
    },
    '& a': {
        color: theme.palette.primary.main,
        textDecoration: 'underline', // Додамо підкреслення
        fontWeight: 500,
        '&:hover': {
            color: theme.palette.primary.dark, // Темніший при наведенні
            textDecoration: 'none', // Забираємо підкреслення при наведенні
        }
    },
    '& ul, & ol': { // Стилізація списків
        paddingLeft: theme.spacing(3),
        marginBottom: theme.spacing(2.5),
    },
    '& li': {
        marginBottom: theme.spacing(1),
    },
    '& pre, & code': {
        fontFamily: '"Fira Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace', // Популярний моноширинний шрифт
        backgroundColor: theme.palette.grey[100],
        padding: theme.spacing(0.25, 0.75),
        borderRadius: '4px',
        fontSize: '0.9em', // Трохи менший
    },
    '& pre': {
        padding: theme.spacing(2),
        overflowX: 'auto',
        marginBottom: theme.spacing(2.5),
        lineHeight: 1.5, // Міжрядковий інтервал для коду
    }
}));

// --- Компоненти ---

interface SectionMenuProps {
    sections: SectionType[];
    activeSectionId: string | number | null;
    onSelectSection: (id: string | number) => void;
}

interface SectionContentProps {
    section: SectionType | null | undefined;
}

const PanelContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isOpen',
})<{ isOpen: boolean }>(({ theme, isOpen }) => ({
    flexShrink: 0,
    width: isOpen ? '300px' : '0px',
    minWidth: isOpen ? '300px' : '0px',
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: theme.transitions.create(['width', 'min-width', 'opacity', 'visibility'], {
        duration: theme.transitions.duration.enteringScreen,
        easing: theme.transitions.easing.easeInOut,
    }),
    overflow: 'hidden',
    borderRight: isOpen ? `1px solid ${theme.palette.divider}` : 'none', // виправив синтаксис
    backgroundColor: theme.palette.background.paper,
    position: 'absolute',
    top: '60px', // <-- Ось так правильно
    height: 'calc(100vh - 64px)', // якщо navbar має 64px
    display: 'flex',
    flexDirection: 'column',
}));


const SectionMenu: React.FC<SectionMenuProps> = ({ sections, activeSectionId, onSelectSection }) => {
    // Removed the wrapping Paper from here, it will be part of PanelContainer
    return (
        <>
            <Typography variant="h6" sx={{
                p: 2,
                fontWeight: 600,
                fontSize: '1rem',
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                color: 'text.primary',
                flexShrink: 0, // Prevent title from shrinking
            }}>
                Зміст курсу
            </Typography>
            <List sx={{
                p: 1,
                overflowY: 'auto', // Allow only the list to scroll
                flexGrow: 1, // Allow list to take remaining space
            }}>
                {Array.isArray(sections) && sections.map((section, index) => (
                    <StyledListItemButton
                        key={section.id}
                        selected={section.id === activeSectionId}
                        onClick={() => onSelectSection(section.id)}
                        // Add a tabIndex to make items focusable when panel is closed/reopened
                        tabIndex={0}
                    >
                        <ListItemText primary={`${index + 1}. ${section.title}`} />
                    </StyledListItemButton>
                ))}
                {/* Placeholder if sections are empty */}
                {(!sections || sections.length === 0) && (
                    <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center', fontStyle: 'italic' }}>
                        Розділи відсутні
                    </Typography>
                )}
            </List>
        </>
    );
};

const SectionContent: React.FC<SectionContentProps> = ({ section }) => {
    if (!section) {
        return (
            <ContentContainer sx={{ textAlign: 'center', color: 'text.secondary', mt: 10 }}>
                <Typography variant="h6">Будь ласка, оберіть розділ зі списку зліва.</Typography>
                <Typography variant="body1" sx={{mt: 2}}>Якщо список порожній, в курсі ще немає розділів.</Typography>
            </ContentContainer>
        );
    }

    return (
        <ContentContainer>
            <TitleTypography>
                {section.title}
            </TitleTypography>
            <Divider sx={{ mb: 4 }} />
            <ContentBox>
                {/* Додаємо перевірку типу перед парсингом */}
                {typeof section.contentSection === 'string'
                    ? parser(section.contentSection)
                    : <Alert severity="warning">Контент для цього розділу відсутній або має невірний формат.</Alert>
                }
            </ContentBox>
        </ContentContainer>
    );
};

// --- Основний Компонент Сторінки ---

export const CoursePage = () => {
    const { id: courseId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sections, setSections] = useState<SectionType[]>([]);
    const [activeSectionId, setActiveSectionId] = useState<string | number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(true); // Panel state

    // Завантаження секцій
    useEffect(() => {
        let isMounted = true; // Прапорець для відстеження монтування
        const fetchSections = async () => {
            if (!courseId) {
                setError("Не вказано ID курсу.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const data: SectionType[] | null = await getSections(courseId); // API може повернути null при помилці

                if (!isMounted) return; // Не оновлюємо стан, якщо компонент розмонтовано

                if (data && Array.isArray(data)) {
                    setSections(data);
                    if (data.length > 0) {
                        // Встановлюємо першу секцію активною за замовчуванням
                        setActiveSectionId(data[0].id);
                    } else {
                        setError("У цьому курсі ще немає розділів.");
                    }
                } else {
                    console.warn("API GetSections не повернуло масив:", data);
                    setError("Не вдалося завантажити розділи курсу (невірний формат відповіді).");
                }

            } catch (error) {
                if (!isMounted) return;
                console.error("Помилка при отриманні секцій курсу:", error);
                setError("Сталася помилка при завантаженні розділів. Спробуйте оновити сторінку.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchSections();

        // Функція очищення
        return () => {
            isMounted = false;
        };
    }, [courseId]);



    // Навігація до тесту (ВИПРАВЛЕНИЙ ШЛЯХ)
    const handleTestNavigation = () => {
        if (activeSectionId) {
            navigate(`/course/section/${activeSectionId}/test`);
        } else {
            console.warn("Спроба перейти до тесту без активної секції.");
        }
    };

    // Обробник вибору секції
    const handleSelectSection = useCallback((id: string | number) => {
        setActiveSectionId(id);
    }, []);

    const togglePanel = useCallback(() => {
        setIsPanelOpen(prev => !prev);
    }, []);

    const activeSection = sections.find((s) => s.id === activeSectionId);

    // --- Рендеринг ---
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Завантаження...</Typography>
            </Box>
        );
    }

    // Показуємо помилку на весь екран, якщо вона виникла при завантаженні
    if (error && sections.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)', p: 3 }}>
                <Alert severity="error" sx={{ maxWidth: '600px', width: '100%' }}>{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", bgcolor: 'background.default', // Використовуємо фон з теми
            minHeight: 'calc(100vh - 64px)' }}>

            {/* Ліва панель з меню */}
            <PanelContainer isOpen={isPanelOpen}>
                {/* Render SectionMenu ONLY if sections are loaded (or show empty message) */}
                {!isLoading && (
                    <SectionMenu
                        sections={sections}
                        activeSectionId={activeSectionId}
                        onSelectSection={handleSelectSection}
                    />
                )}
                {/* Show loading indicator inside panel if sections are still loading */}
                {isLoading && <CircularProgress sx={{ m: 'auto' }} />}
            </PanelContainer>

            {/* Основний контент */}
            <Box sx={{
                flexGrow: 1,
                overflowY: 'auto', // Дозволяємо прокрутку контенту
                py: 3,
                px: { xs: 2, sm: 3, md: 4 }
            }}>
                {/* Показуємо помилку завантаження секцій тут, якщо вони вже були */}
                {error && sections.length > 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}
                {/* Показуємо контент */}
                <SectionContent section={activeSection} />
            </Box>

            <Button
                variant="contained"
                size="small"
                onClick={togglePanel}
                sx={{
                    position: 'fixed',
                    top: '100px', // Adjust top position (below potential navbar)
                    left: isPanelOpen ? '285px' : '15px', // Position based on panel state
                    minWidth: '40px', // Ensure button has width
                    width: '80px',
                    height: '40px',
                    borderRadius: '50%',
                    p: 0, // Remove padding for icon centering
                    zIndex: (theme) => theme.zIndex.drawer + 1, // Above panel/content
                    transition: (theme) => theme.transitions.create('left', {
                        duration: theme.transitions.duration.enteringScreen,
                        easing: theme.transitions.easing.easeInOut,
                    }),
                    boxShadow: 3,
                }}

            >
                {isPanelOpen ? "Приховати" : "Показати"}
            </Button>

            {/* Кнопка "Пройти тест" */}
            {activeSection && ( // Тільки якщо є активна секція
                <Box sx={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    zIndex: (theme) => theme.zIndex.fab, // Використовуємо zIndex теми
                    animation: `${fadeIn} 0.5s ease-out 0.2s backwards`
                }}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleTestNavigation}
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                            borderRadius: '50px',
                            py: 1.5, // Зробимо кнопку вищою
                            px: 4,   // І ширшою
                            fontWeight: 'bold',
                            textTransform: 'none',
                            fontSize: '1rem',
                            boxShadow: 3, // Використовуємо рівень тіні теми
                            '&:hover': {
                                boxShadow: 6,
                                transform: 'translateY(-2px)' // Більший ефект підйому
                            }
                        }}
                    >
                        Пройти тест до розділу
                    </Button>
                </Box>
            )}
        </Box>
    );
};