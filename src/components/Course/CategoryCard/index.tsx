import {Button, Card, CardActions, CardContent, CardMedia, Typography} from "@mui/material";
import { Course } from "../../../model";
import {useNavigate} from "react-router-dom";

interface CategoryCardProps {
    course: Course;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({course}) => {
    const nav = useNavigate();
    const imageUrl = String(course?.title_img?.[0]?.link || "/placeholder.jpg");

    return (
        <Card>
            <CardMedia
                component="img"
                height="140"
                image={imageUrl}
                alt={course?.title || "Course image"}
            />
            <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                    {course?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                </Typography>
            </CardContent>
            <CardActions>
                <Button size="small" onClick={() => nav(`/course/${course.id}`)}>Переглянути</Button>
            </CardActions>
        </Card>
    );
}
