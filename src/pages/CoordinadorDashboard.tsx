import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { 
  LogOut, 
  User, 
  MapPin, 
  FileText, 
  BarChart3,
  Clock,
  Shield
} from 'lucide-react';

const CoordinadorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!user || !user.coordinador) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Acceso no autorizado</h2>
          <p className="text-gray-600 mt-2">No tiene permisos para acceder a esta vista</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Panel de Operador</h1>
                <p className="text-sm text-gray-600">Bienvenido, {user.username}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del operador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-500" />
              Información Personal
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Usuario:</span>
                <p className="font-medium">{user.username}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="font-medium">{user.email || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">ID Operador:</span>
                <p className="font-medium">{user.operador.id_operador}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-500" />
              Estación Asignada
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Estación N°:</span>
                <p className="font-medium">{user.operador.nro_estacion}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Ruta:</span>
                <p className="font-medium">{user.operador.ruta.nombre}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Tipo de Operador:</span>
                <p className="font-medium">{user.operador.tipo_operador}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Acciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Nuevo Reporte</h3>
                <p className="text-sm text-gray-600">Registrar reporte diario</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Ingresa los datos del empadronamiento del día</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Mis Reportes</h3>
                <p className="text-sm text-gray-600">Historial de registros</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Consulta tus reportes anteriores</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Estadísticas</h3>
                <p className="text-sm text-gray-600">Resumen de actividad</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Visualiza tu rendimiento</p>
          </button>
        </div>
      </main>
    </div>
  );
};

export default CoordinadorDashboard;