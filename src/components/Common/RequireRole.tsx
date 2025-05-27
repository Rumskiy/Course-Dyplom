// src/components/Common/RequireRole.tsx
import React, { ReactNode, useContext } from 'react';
import { Navigate } from 'react-router';
import { AuthContext } from '../../Backend/Auth';

type RequireRoleProps = {
    allowedRoles: string[]; // ['1'] для вчителів, ['2'] для учнів
    children: ReactNode;
};

export const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
    const auth = useContext(AuthContext);
    if (!auth) {
        console.error('AuthContext not found. Ensure this component is under AuthProvider.');
        return null;
    }
    const { user, isLoading } = auth;

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (!user) {
        // неавторизовані — на логін
        return <Navigate to="/login" replace />;
    }
    if (!allowedRoles.includes(user.role)) {
        // не має потрібної ролі — кидаємо на домашню або показуємо 403
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};
