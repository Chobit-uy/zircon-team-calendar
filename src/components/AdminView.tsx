import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Holiday } from '@/types';
import { holidayService } from '@/services/holidayService';
import { useToast } from '@/hooks/use-toast';

export function AdminView() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: '',
    scope: '' as Holiday['scope'] | ''
  });
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const holidayList = await holidayService.getHolidays();
      setHolidays(holidayList.sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error('Error loading holidays:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los feriados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.name.trim() || !newHoliday.date || !newHoliday.scope) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const holiday = await holidayService.addHoliday({
        name: newHoliday.name.trim(),
        date: newHoliday.date,
        scope: newHoliday.scope as Holiday['scope'],
        createdBy: 'admin@zircon.tech' // En producción esto vendría del usuario logueado
      });

      setHolidays(prev => [...prev, holiday].sort((a, b) => a.date.localeCompare(b.date)));
      setNewHoliday({ name: '', date: '', scope: '' });
      
      toast({
        title: "Éxito",
        description: "Feriado agregado correctamente"
      });
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el feriado",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    try {
      const rowIndex = holiday.rowIndex;
      if (!rowIndex) {
        toast({
          title: "Error",
          description: "No se puede eliminar este feriado",
          variant: "destructive"
        });
        return;
      }
      
      const success = await holidayService.deleteHoliday(rowIndex);
      if (success) {
        setHolidays(prev => prev.filter(h => h.id !== holiday.id));
        toast({
          title: "Éxito",
          description: "Feriado eliminado correctamente"
        });
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        title: "Error", 
        description: "No se pudo eliminar el feriado",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calcular feriados paginados
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedHolidays = holidays.slice(startIndex, endIndex);
  const totalPages = Math.ceil(holidays.length / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Administración</h2>
          <p className="text-muted-foreground">Gestiona los feriados del equipo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agregar nuevo feriado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Agregar Feriado</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="holiday-name">Nombre del feriado</Label>
              <Input
                id="holiday-name"
                placeholder="Ej: Día de la Independencia"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="holiday-date">Fecha</Label>
              <Input
                id="holiday-date"
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="holiday-scope">Ámbito</Label>
              <Select 
                value={newHoliday.scope} 
                onValueChange={(value: Holiday['scope']) => setNewHoliday(prev => ({ ...prev, scope: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el ámbito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nacional">Nacional</SelectItem>
                  <SelectItem value="Local/Regional">Local/Regional</SelectItem>
                  <SelectItem value="Empresa">Empresa</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleAddHoliday} 
              disabled={saving}
              className="w-full bg-gradient-zircon hover:opacity-90"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Agregar Feriado
            </Button>
          </CardContent>
        </Card>

        {/* Lista de feriados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Feriados Programados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : holidays.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay feriados programados</p>
                <p className="text-sm">Agrega el primer feriado usando el formulario</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedHolidays.map(holiday => (
                    <div 
                      key={holiday.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-gradient-subtle"
                    >
                      <div>
                        <h4 className="font-medium text-foreground">{holiday.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(holiday.date)}
                        </p>
                        <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                          {holiday.scope}
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteHoliday(holiday)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1}-{Math.min(endIndex, holidays.length)} de {holidays.length} feriados
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 0}
                        className="flex items-center space-x-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </Button>
                      <span className="text-sm text-muted-foreground px-3">
                        {currentPage + 1} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages - 1}
                        className="flex items-center space-x-1"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Integración con Google Form:</span>
              <p className="text-muted-foreground">
                Los datos de vacaciones y ausencias se sincronizan automáticamente desde el formulario de Google.
              </p>
            </div>
            <div>
              <span className="font-medium">Acceso público:</span>
              <p className="text-muted-foreground">
                El calendario es accesible públicamente. Solo los administradores pueden gestionar feriados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}