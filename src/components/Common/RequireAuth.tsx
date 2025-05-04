import { useContext } from "react";
import { AuthContext } from "../../Backend/Auth";
import { Navigate } from "react-router";
import { ReactNode } from "react";

type RequireAuthProps = {
    children: ReactNode;
};

export const RequireAuth = ({ children }: RequireAuthProps) => {
    // @ts-ignore
    const { user, isLoading } = useContext(AuthContext);

    // Якщо дані завантажуються, показуємо індикатор завантаження
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // Якщо користувач не авторизований, перенаправляємо на сторінку входу
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Якщо користувач авторизований, повертаємо дочірній компонент
    return children;
};