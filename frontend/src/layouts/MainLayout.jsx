import { Outlet } from 'react-router-dom';
import BottomNav from '../components/ui/BottomNav';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}