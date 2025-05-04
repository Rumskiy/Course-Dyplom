import React, { createContext, useState, useEffect, ReactNode } from "react";
import axios from 'axios';
import { UserLogin, UpdateData } from "../../model"; // assume UpdateData has full user fields
import { toast } from "react-toastify";
import {ApiToken} from "../../api/api.tsx";

export type AuthContextType = {
    user: UserLogin | null;
    login: (user: UserLogin) => Promise<void>;
    logout: () => void;
};

const defaultContextValue: AuthContextType = {
    user: null,
    login: async () => {},
    logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserLogin | null>(() => {
        const stored = localStorage.getItem('userInfo');
        return stored ? JSON.parse(stored) : null;
    });

    // Sync axios header when user token changes, and fetch full profile
    useEffect(() => {
        const initAuth = async () => {
            if (user?.token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
                try {
                    const resp = await axios.get(`${ApiToken}/account`);
                    const full: UpdateData = resp.data.data;
                    // merge minimal userLogin (id, token, role, avatar) with full profile fields
                    setUser({ ...user, ...full });
                } catch (err) {
                    console.error('Failed to fetch full user profile', err);
                    // invalid token or expired, force logout
                    logout();
                }
            } else {
                delete axios.defaults.headers.common['Authorization'];
            }
        };
        initAuth();
    }, [user?.token]);

    const login = async (userData: UserLogin) => {
        try {
            // store minimal login payload
            localStorage.setItem('userInfo', JSON.stringify(userData));
            // set token header
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
            // fetch full profile
            const resp = await axios.get(`${ApiToken}/account`);
            const full: UpdateData = resp.data.data;
            const merged: UserLogin = { ...userData, ...full };
            setUser(merged);
        } catch (err) {
            console.error('Error fetching user profile after login', err);
            toast.error('Не вдалося завантажити дані користувача.');
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const contextValue = React.useMemo(
        () => ({ user, login, logout }),
        [user]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};