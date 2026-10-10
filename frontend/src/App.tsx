import React from 'react';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/common/Header';
import { AuthScreen } from './components/auth/AuthScreen';
import { ReceiverDashboard } from './components/receiver/ReceiverDashboard';
import { SupplierDashboard } from './components/supplier/SupplierDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Truck } from 'lucide-react';

export const MainContent: React.FC = () => {
  const { user, isLoading, isNewUser } = useAuth();
  const [isAdminViewOpen, setIsAdminViewOpen] = React.useState<boolean>(false);

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
    return <AuthScreen />;
  }

  const isAdmin = Boolean(
    user.email === 'sbunyod15@gmail.com' || 
    user.role === 'ADMIN' || 
    String(user.telegram_id) === '8012592174'
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 font-sans">
      <Header onOpenAdmin={() => setIsAdminViewOpen(true)} isAdmin={isAdmin} />
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4">
        {isAdminViewOpen ? (
          <AdminDashboard onBack={() => setIsAdminViewOpen(false)} />
        ) : user.role === 'SUPPLIER' ? (
          <SupplierDashboard />
        ) : (
          <ReceiverDashboard />
        )}
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
