import { Outlet } from 'react-router-dom';
import { RequireAuth } from '../components/Common/RequireAuth';

export const AdminLayout: React.FC = () => (
    <RequireAuth>
        <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, padding: 16 }}>
                <Outlet />
            </div>
        </div>
    </RequireAuth>
);
