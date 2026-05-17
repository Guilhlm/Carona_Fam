import { Outlet } from 'react-router-dom';
import BottomNav from '../components/ui/BottomNav';
import CaronaRideRedirect from '../components/ride/CaronaRideRedirect';
import { ActiveRideProvider } from '../contexts/ActiveRideContext';

export default function MainLayout() {
  return (
    <ActiveRideProvider>
      <div className="min-h-screen flex flex-col relative">
        <CaronaRideRedirect />
        <main className="flex-1 pb-24">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </ActiveRideProvider>
  );
}