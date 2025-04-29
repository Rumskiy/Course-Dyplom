import { createContext, useState, useEffect } from "react";
import {UserLogin} from "../../model.tsx";

type AuthContextType = {
    user: UserLogin;
    isLoading: boolean;
    login: (user) => void;
    logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState<UserLogin>(null);
    const [isLoading, setIsLoading] = useState(true); // Додано стан завантаження

    // Перевіряємо localStorage при завантаженні
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setIsLoading(false); // Завершуємо завантаження
    }, []);

    const login = (user) => {
        localStorage.setItem('userInfo', JSON.stringify(user));
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};