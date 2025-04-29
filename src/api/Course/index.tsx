import axios from "axios";
import {ApiToken, token} from "../api.tsx";

export const GetCourses = async () => {
    const response = await axios.get(`${ApiToken}/courses`);
    return response.data
};

export const GetCoursesById = async (id: number | string) => {
    const response = await axios.get(`${ApiToken}/courses/${id}`);
    return response.data;
};


export const GetUserCourses = async () => {
    try {
        const response = await axios.get(`${ApiToken}/user/courses`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching user courses:", error);
        throw error;
    }
};

export const UpdateCourse = async (id: string, data: FormData) => {
    try {
        const response = await axios.post(
            `${ApiToken}/courses/edit/${id}`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating course:", error);
        throw error;
    }
};



export const CreateCourse = async (courseData: FormData) => {

    try {
        const response = await axios.post(
            `${ApiToken}/courses`,
            courseData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
        return response.data;
    } catch (error) {
        console.error("Error creating course:", error);
        throw error;
    }
};