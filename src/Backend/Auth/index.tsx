import React, { createContext, useState, useEffect, ReactNode } from "react";
import axios from 'axios';
import { UserLogin } from "../../model";
import { toast } from "react-toastify";

export type AuthContextType = {
    user: UserLogin | null;
    isLoading: boolean;
    login: (user: UserLogin) => void;
    logout: () => void;
};

const defaultContextValue: AuthContextType = {
    user: null,
    isLoading: true,
    login: () => {},
    logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserLogin | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize user from localStorage and set axios header
    useEffect(() => {
        let mounted = true;
        try {
            const stored = localStorage.getItem('userInfo');

            if (stored) {
                const parsed: UserLogin = JSON.parse(stored);
                if (parsed.id && parsed.token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
                    if (mounted) setUser(parsed);
                } else {
                    localStorage.removeItem('userInfo');
                }
            }
        } catch (err) {
            console.error('Error loading user from storage', err);
            localStorage.removeItem('userInfo');
        } finally {
            if (mounted) setIsLoading(false);
        }
        return () => { mounted = false; };
    }, []);

    const login = (userData: UserLogin) => {

        try {
            localStorage.setItem('userInfo', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
            setUser(userData);
        } catch (err) {
            console.error('Error saving user info', err);
            toast.error('Не вдалося зберегти дані сесії.');
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const contextValue = React.useMemo(
        () => ({ user, isLoading, login, logout }),
        [user, isLoading]
    );

    if (isLoading) {
        // Optionally render a spinner or null while restoring session
        return null;
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};