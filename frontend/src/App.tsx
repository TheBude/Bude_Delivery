import React, { Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/common/Header';
import { AuthScreen } from './components/auth/AuthScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { Truck } from 'lucide-react';

const ReceiverDashboard = lazy(() =>
  import('./components/receiver/ReceiverDashboard').then((m) => ({ default: m.ReceiverDashboard }))
);
const SupplierDashboard = lazy(() =>
  import('./components/supplier/SupplierDashboard').then((m) => ({ default: m.SupplierDashboard }))
);
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

export const MainContent: React.FC = () => {
  const { user, isLoading, isNewUser } = useAuth();
  const [authView, setAuthView] = React.useState<'ONBOARDING' | 'EMAIL'>('ONBOARDING');

  const isAdmin = Boolean(
    user && (
      user.email === 'sbunyod15@gmail.com' || 
      user.role === 'ADMIN' || 
      String(user.telegram_id) === '8012592174'
    )
  );

  const [adminViewMode, setAdminViewMode] = React.useState<'ADMIN' | 'SUPPLIER' | 'RECEIVER'>('ADMIN');

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-brand-500/25 animate-bounce">
          <Truck className="w-7 h-7" />
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
          Bude Delivery yuklanmoqda...
        </p>
      </div>
    );
  }

  // Not authenticated or new Telegram user needing profile setup
  if (!user || isNewUser) {
    if (authView === 'EMAIL') {
      return <AuthScreen onSwitchToRegister={() => setAuthView('ONBOARDING')} />;
    }
    return <RegisterScreen onSwitchToEmailAuth={() => setAuthView('EMAIL')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 font-sans">
      <Header 
        isAdmin={isAdmin}
        adminViewMode={adminViewMode}
        onAdminViewModeChange={(mode) => setAdminViewMode(mode)}
        onOpenAdmin={() => setAdminViewMode('ADMIN')}
      />
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-3" />
              <p className="text-xs font-medium">Bude Delivery yuklanmoqda...</p>
            </div>
          }
        >
          {isAdmin ? (
            adminViewMode === 'ADMIN' ? (
              <AdminDashboard onBack={() => setAdminViewMode('SUPPLIER')} />
            ) : adminViewMode === 'SUPPLIER' ? (
              <SupplierDashboard />
            ) : (
              <ReceiverDashboard />
            )
          ) : user.role === 'SUPPLIER' ? (
            <SupplierDashboard />
          ) : (
            <ReceiverDashboard />
          )}
        </Suspense>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <CartProvider>
      <MainContent />
    </CartProvider>
  );
}
