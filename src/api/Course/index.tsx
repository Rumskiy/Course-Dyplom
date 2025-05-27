import axios from "axios";
import {apiClient, ApiToken} from "../api.tsx";
import {Course} from "../../model.tsx";

export const GetCourses = async () => {
    const response = await axios.get(`${ApiToken}/courses`);
    return response.data
};

export const GetCoursesById = async (id: number | string) => {
    const response = await axios.get(`${ApiToken}/courses/${id}`);
    return response.data;
};

export const GetUserCourses = async () => {
    const response = await axios.get(`${ApiToken}/user/courses`);
    return response.data;
};

export const UpdateCourse = async (
    id: number | string,
    courseData: FormData
): Promise<Course> => {
    const { data } = await apiClient.post<Course>(
        `/courses/edit/${id}`,
        courseData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
};



export const CreateCourse = async (courseData: FormData) => {
    const { data } = await apiClient.post<Course>(
        '/courses',
        courseData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
};

export const getCoursesByCategoryId = async (id: number | string) => {
    const response = await axios.get(`${ApiToken}/courses/category/${id}`);
    return response.data;
};