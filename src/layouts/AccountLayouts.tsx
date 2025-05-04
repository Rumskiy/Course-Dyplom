import { Outlet } from 'react-router-dom';
import { RequireAuth } from '../components/Common/RequireAuth';
import { AccountPage } from '../pages/Account/AccountPage';

export const AccountLayout: React.FC = () => (
    <RequireAuth>
        <div style={{ display: 'flex' }}>
            <aside style={{ width: 250, padding: 16 }}>
                <AccountPage />
            </aside>
            <main style={{ flex: 1, padding: 16 }}>
                <Outlet />
            </main>
        </div>
    </RequireAuth>
);