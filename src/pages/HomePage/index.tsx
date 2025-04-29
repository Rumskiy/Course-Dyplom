import {
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Box
} from "@mui/material";

export const Home = () => {
    return (
        <Container maxWidth="md" sx={{ mt: 14 }}>
            <Box textAlign="center" mb={6}>
                <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
                    Опануйте нові навички, змінюючи своє майбутнє
                </Typography>
                <Typography variant="h6" sx={{ color: "text.secondary", mb: 4 }}>
                    Пройдіть курси для отримання нової професії, розвитку навичок або підвищення кваліфікації. Почніть свій шлях до успіху вже сьогодні!
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    href="/category"
                    sx={{ borderRadius: 8, px: 4, py: 1.5, fontSize: "1rem" }}
                >
                    Переглянути курси
                </Button>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
                Найпопулярніші курси для вашого розвитку
            </Typography>

            <Grid container spacing={4}>
                {[
                    {
                        title: "React.js для початківців",
                        desc: "Вивчіть основи React.js і побудуйте власний веб-застосунок.",
                    },
                    {
                        title: "Laravel з нуля",
                        desc: "Створюйте потужні бекенд-додатки на Laravel і ставайте фахівцем з веб-розробки.",
                    },
                    {
                        title: "MySQL для розробників",
                        desc: "Освойте MySQL для ефективної роботи з базами даних в будь-якому проєкті.",
                    },
                ].map((course, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card
                            elevation={3}
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: 4,
                                transition: "0.3s",
                                '&:hover': {
                                    boxShadow: 6,
                                },
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    {course.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {course.desc}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small" href="/category" sx={{ ml: 1 }}>
                                    Детальніше
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};
