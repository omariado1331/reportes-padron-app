import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, type OperadorInfo } from '../services/auth';
import { 
  LogOut, 
  User, 
  FileText, 
  History,
  Menu,
  X,
  Shield,
  Home,
  Calendar,
  Phone,
  IdCard,
  MapPin,
  Building,
  Cpu,
  Monitor,
  Hash,
  Users,
  Target,
  Map,
  Award,
  BarChart,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import RegistroDiarioForm from '../components/RegistroDiarioForm';

type MenuItem = 'informacion' | 'registro' | 'historial';

const OperadorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [activeMenu, setActiveMenu] = useState<MenuItem>('informacion');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Inicialmente cerrado en móviles
  const [operadorInfo, setOperadorInfo] = useState<OperadorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efecto para manejar responsividad
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // En tablets y desktop, sidebar abierto por defecto
        setSidebarOpen(true);
      } else {
        // En móviles, sidebar cerrado por defecto
        setSidebarOpen(false);
      }
    };

    // Establecer estado inicial
    handleResize();

    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchOperadorInfo = async () => {
      if (!user?.operador?.id_operador) return;
      
      try {
        setLoading(true);
        const info = await authService.getOperadorInfo(user.operador.id_operador);
        setOperadorInfo(info);
      } catch (err: any) {
        setError(err.message || 'Error al cargar información del operador');
      } finally {
        setLoading(false);
      }
    };

    if (activeMenu === 'informacion') {
      fetchOperadorInfo();
    }
  }, [activeMenu, user?.operador?.id_operador]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Cerrar sidebar en móviles cuando se selecciona un menú
  const handleMenuClick = (menu: MenuItem) => {
    setActiveMenu(menu);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  if (!user || !user.operador) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso no autorizado</h2>
          <p className="text-gray-600 mb-6">No tiene permisos para acceder a esta vista</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  // Componente del menú lateral
  const Sidebar = () => (
    <>
      {/* Overlay para móviles */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed md:relative 
        top-0 left-0 
        h-screen 
        bg-gradient-to-b from-blue-900 to-blue-800 
        text-white 
        flex flex-col 
        transition-all duration-300 ease-in-out
        z-50
        ${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}
      `}>
        {/* Logo y Toggle */}
        <div className="p-4 border-b border-blue-700 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              
              <h3 className="text-lg font-bold hidden md:block">EMPADRONAMIENTO MASIVO SUBNACIONALES 2026</h3>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <Home className="h-6 w-6" />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="text-blue-200 hover:text-white hidden md:block"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-blue-200 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 p-4 space-y-2">
          <div 
            className={`p-3 rounded-lg cursor-pointer transition-all ${activeMenu === 'informacion' ? 'bg-blue-700' : 'hover:bg-blue-700/50'}`}
            onClick={() => handleMenuClick('informacion')}
          >
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5" />
              {(sidebarOpen || window.innerWidth < 768) && <span>Información de Operador</span>}
            </div>
          </div>

          <div 
            className={`p-3 rounded-lg cursor-pointer transition-all ${activeMenu === 'registro' ? 'bg-blue-700' : 'hover:bg-blue-700/50'}`}
            onClick={() => handleMenuClick('registro')}
          >
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5" />
              {(sidebarOpen || window.innerWidth < 768) && <span>Registro Diario</span>}
            </div>
          </div>

          <div 
            className={`p-3 rounded-lg cursor-pointer transition-all ${activeMenu === 'historial' ? 'bg-blue-700' : 'hover:bg-blue-700/50'}`}
            onClick={() => handleMenuClick('historial')}
          >
            <div className="flex items-center space-x-3">
              <History className="h-5 w-5" />
              {(sidebarOpen || window.innerWidth < 768) && <span>Historial de Registros</span>}
            </div>
          </div>
        </nav>

        {/* Información del Usuario y Logout */}
        <div className="border-t border-blue-700 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-600 p-2 rounded-full">
              <User className="h-4 w-4" />
            </div>
            {(sidebarOpen || window.innerWidth < 768) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <p className="text-xs text-blue-200 truncate">Operador</p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg bg-red-600 hover:bg-red-700 transition ${!(sidebarOpen || window.innerWidth < 768) && 'justify-center'}`}
          >
            <LogOut className="h-4 w-4" />
            {(sidebarOpen || window.innerWidth < 768) && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );

  // Contenido Principal
  const MainContent = () => (
    <main className="flex-1 bg-gray-50 overflow-y-auto min-h-screen md:min-h-0">
      {/* Header Superior - Ahora con botón de menú para móviles */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSidebar}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                {activeMenu === 'informacion' && 'Información del Operador'}
                {activeMenu === 'registro' && 'Registro Diario'}
                {activeMenu === 'historial' && 'Historial de Registros'}
              </h2>
              <p className="text-xs md:text-sm text-gray-600">
                {activeMenu === 'informacion' && 'Datos personales y estación asignada'}
                {activeMenu === 'registro' && 'Ingreso de reporte de empadronamiento'}
                {activeMenu === 'historial' && 'Consultar registros anteriores'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">
                {operadorInfo?.data.nombre_ruta || " "}
              </p>
              <p className="text-xs text-gray-500">
                Estación {operadorInfo?.data.nro_estacion || " "}
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
      </header>

      {/* Contenido del Panel */}
      <div className="p-4 md:p-6">
        {/* Panel de Información del Operador */}
        {activeMenu === 'informacion' && (
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Cargando información del operador...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar información</h3>
                <p className="text-red-600">{error}</p>
              </div>
            ) : operadorInfo && (
              <div className="space-y-4 md:space-y-6">
                {/* Tarjeta de Información Personal */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      <h3 className="text-base md:text-lg font-semibold text-white">Información Personal</h3>
                    </div>
                  </div>
                  <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span className="text-sm">Nombre Completo:</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">
                          {operadorInfo.data.nombre} {operadorInfo.data.apellido_paterno} {operadorInfo.data.apellido_materno}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <IdCard className="h-4 w-4" />
                          <span className="text-sm">Carnet de Identidad:</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">{operadorInfo.data.carnet}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">Celular:</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">{operadorInfo.data.celular}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Award className="h-4 w-4" />
                          <span className="text-sm">Tipo de Operador:</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">{operadorInfo.data.tipo_operador}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta de Información de la Estación */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center space-x-3">
                      <Monitor className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      <h3 className="text-base md:text-lg font-semibold text-white">Información de la Estación</h3>
                    </div>
                  </div>
                  <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <div className="space-y-3 md:space-y-4">
                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <Hash className="h-4 w-4" />
                            <span className="text-sm">Número de Estación:</span>
                          </div>
                          <p className="text-lg md:text-xl font-bold text-gray-900">{operadorInfo.data.nro_estacion}</p>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <Target className="h-4 w-4" />
                            <span className="text-sm">Tipo de Estación:</span>
                          </div>
                          <p className="font-medium text-gray-900 text-sm md:text-base">{operadorInfo.data.tipo_estacion}</p>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <Cpu className="h-4 w-4" />
                            <span className="text-sm">Código de Equipo:</span>
                          </div>
                          <p className="font-medium text-gray-900 text-sm md:text-base">{operadorInfo.data.codigo_equipo}</p>
                        </div>
                      </div>

                      <div className="space-y-3 md:space-y-4">
                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <Database className="h-4 w-4" />
                            <span className="text-sm">Modelo de Estación:</span>
                          </div>
                          <p className="font-medium text-gray-900 text-sm md:text-base">{operadorInfo.data.modelo_estacion}</p>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <BarChart className="h-4 w-4" />
                            <span className="text-sm">Contador R:</span>
                          </div>
                          <p className="text-lg md:text-xl font-bold text-blue-600">{operadorInfo.data.contador_r}</p>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <BarChart className="h-4 w-4" />
                            <span className="text-sm">Contador C:</span>
                          </div>
                          <p className="text-lg md:text-xl font-bold text-green-600">{operadorInfo.data.contador_c}</p>
                        </div>
                      </div>

                      <div className="space-y-3 md:space-y-4">
                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">Coordinador Asignado:</span>
                          </div>
                          <p className={`font-medium text-sm md:text-base ${operadorInfo.data.nombre_coordinador ? 'text-gray-900' : 'text-gray-400'}`}>
                            {operadorInfo.data.nombre_coordinador || 'No asignado'}
                          </p>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta de Ubicación y Ruta */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      <h3 className="text-base md:text-lg font-semibold text-white">Ubicación y Ruta</h3>
                    </div>
                  </div>
                  <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">Punto de Empadronamiento:</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">{operadorInfo.data.punto_de_empadronamiento}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Building className="h-4 w-4" />
                          <span className="text-sm">Municipio:</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">{operadorInfo.data.municipio}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Map className="h-4 w-4" />
                          <span className="text-sm">Provincia:</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">{operadorInfo.data.provincia}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Map className="h-4 w-4" />
                          <span className="text-sm">Departamento:</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm md:text-base">{operadorInfo.data.departamento}</p>
                      </div>

                      <div className="md:col-span-2 lg:col-span-4 space-y-1 mt-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">Ruta Asignada:</span>
                        </div>
                        <p className="text-base md:text-lg font-bold text-blue-700">{operadorInfo.data.nombre_ruta}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumen */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="text-center md:text-left mb-3 md:mb-0">
                      <p className="text-sm text-gray-600">Estado del Sistema</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Activo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel de Registro Diario */}
        {activeMenu === 'registro' && (
        <div className="max-w-4xl mx-auto">
            <RegistroDiarioForm 
            operadorId={user.operador.id_operador}
            nroEstacion={operadorInfo?.data.nro_estacion || user.operador.nro_estacion}
            estacionId={operadorInfo?.data.id_estacion}
            />
        </div>
        )}

        {/* Panel de Historial de Registros */}
        {activeMenu === 'historial' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 md:mb-4">Historial de Registros Diarios</h3>
              <p className="text-gray-600 text-sm md:text-base">Aquí se mostrará el historial completo de registros...</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
        <MainContent />
      </div>
    </div>
  );
};

export default OperadorDashboard;