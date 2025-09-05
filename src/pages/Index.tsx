import { useState } from 'react';
import { Header } from '@/components/Header';
import { CalendarView } from '@/components/CalendarView';
import { AdminView } from '@/components/AdminView';
import { TeamView } from '@/components/TeamView';

const Index = () => {
  const [currentView, setCurrentView] = useState<'calendar' | 'admin' | 'team'>('calendar');

  const renderView = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarView />;
      case 'admin':
        return <AdminView />;
      case 'team':
        return <TeamView />;
      default:
        return <CalendarView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="container mx-auto px-4 py-8">
        {renderView()}
      </main>
    </div>
  );
};

export default Index;
