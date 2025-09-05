import { Calendar, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  currentView: 'calendar' | 'admin' | 'team';
  onViewChange: (view: 'calendar' | 'admin' | 'team') => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
  return (
    <header className="bg-header-bg text-header-foreground shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-zircon rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-white">ZIRCON</span>
                <span className="text-primary">Tech</span>
              </h1>
              <p className="text-sm text-gray-300">Team Calendar</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-2">
            <Button
              variant={currentView === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('calendar')}
              className="text-white hover:text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendario
            </Button>
            <Button
              variant={currentView === 'admin' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('admin')}
              className="text-white hover:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Administración
            </Button>
            <Button
              variant={currentView === 'team' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('team')}
              className="text-white hover:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Equipo
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}