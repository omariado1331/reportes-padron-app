import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  FileText, 
  Database, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw,
  //Download,
  Upload,
  //Calendar,
  //Filter,
  //ChevronRight,
  UserCheck,
  UserX
} from 'lucide-react';
import { authService, type Operador, type ReporteDiarioHistorico } from '../services/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface DashboardCoordinadorProps {
  coordinadorId?: number;
}

const CoordinadorDashboard: React.FC<DashboardCoordinadorProps> = ( {coordinadorId}) => {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [, setReportesDiarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOperadores, setLoadingOperadores] = useState(false);
  const [, setLoadingReportes] = useState(false);
  const id = coordinadorId || 0;
  console.log(id);

  // Estados para búsqueda
  const [searchCarnet, setSearchCarnet] = useState('');
  const [operadorEncontrado, setOperadorEncontrado] = useState<Operador | null>(null);
  const [operadorReportes, setOperadorReportes] = useState<ReporteDiarioHistorico | null>(null);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  // Estados para estadísticas
  const [totalOperadores, setTotalOperadores] = useState(0);
  const [operadoresConBackup, setOperadoresConBackup] = useState(0);
  const [operadoresSinBackup, setOperadoresSinBackup] = useState(0);
  const [totalRegistrosC, setTotalRegistrosC] = useState(0);
  const [totalRegistrosR, setTotalRegistrosR] = useState(0);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      await Promise.all([cargarOperadores(), cargarReportesDiarios()]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarOperadores = async () => {
    setLoadingOperadores(true);
    try {
      const data = await authService.getOperadores();
      setOperadores(data);
      calcularEstadisticasOperadores(data);
    } catch (error) {
      console.error('Error cargando operadores:', error);
    } finally {
      setLoadingOperadores(false);
    }
  };

  const cargarReportesDiarios = async () => {
    setLoadingReportes(true);
    try {
      const data = await authService.getReportesDiarios();
      setReportesDiarios(data);
      calcularEstadisticasReportes(data);
    } catch (error) {
      console.error('Error cargando reportes diarios:', error);
    } finally {
      setLoadingReportes(false);
    }
  };

  const calcularEstadisticasOperadores = (data: Operador[]) => {
    // Filtrar solo operadores Urbanos y Rurales
    const operadoresFiltrados = data.filter(op => 
      op.tipo_operador === 'Operador Urbano' || op.tipo_operador === 'Operador Rural'
    );
    
    setTotalOperadores(operadoresFiltrados.length);
    
    const conBackup = operadoresFiltrados.filter(op => op.entregaBackup).length;
    const sinBackup = operadoresFiltrados.filter(op => !op.entregaBackup).length;
    
    setOperadoresConBackup(conBackup);
    setOperadoresSinBackup(sinBackup);
  };

  const calcularEstadisticasReportes = (data: any[]) => {
    const totalC = data.reduce((sum, reporte) => sum + (reporte.registro_c || 0), 0);
    const totalR = data.reduce((sum, reporte) => sum + (reporte.registro_r || 0), 0);
    
    setTotalRegistrosC(totalC);
    setTotalRegistrosR(totalR);
  };

  const buscarOperadorPorCarnet = async () => {
    if (!searchCarnet.trim()) {
      setErrorBusqueda('Ingrese un número de carnet');
      return;
    }

    setLoadingBusqueda(true);
    setErrorBusqueda(null);
    setOperadorEncontrado(null);
    setOperadorReportes(null);

    try {
      // Buscar en la lista de operadores
      const operador = operadores.find(op => 
        op.carnet === searchCarnet.trim() &&
        (op.tipo_operador === 'Operador Urbano' || op.tipo_operador === 'Operador Rural')
      );

      if (!operador) {
        setErrorBusqueda('Operador no encontrado o no es operador urbano/rural');
        return;
      }

      setOperadorEncontrado(operador);

      // Cargar reportes del operador
      const reportes = await authService.getHistorialReportesDiarios(operador.id);
      setOperadorReportes(reportes);
      
    } catch (error: any) {
      setErrorBusqueda(error.response?.data?.message || 'Error al buscar operador');
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const handleActualizarBackup = async () => {
    if (!operadorEncontrado) return;

    const confirmar = window.confirm(
      `¿Está seguro de marcar como TRANSMITIDO al operador?\n\n` +
      `Nombre: ${operadorEncontrado.nombre} ${operadorEncontrado.apellido_paterno}\n` +
      `Carnet: ${operadorEncontrado.carnet}`
    );

    if (!confirmar) return;

    try {
      await authService.actualizarEntregaBackup(operadorEncontrado.id, true);
      
      // Actualizar estado local
      const updatedOperador = { ...operadorEncontrado, entregaBackup: true };
      setOperadorEncontrado(updatedOperador);
      
      // Actualizar lista de operadores
      const updatedOperadores = operadores.map(op => 
        op.id === updatedOperador.id ? updatedOperador : op
      );
      setOperadores(updatedOperadores);
      calcularEstadisticasOperadores(updatedOperadores);
      
    } catch (error: any) {
      alert('Error al actualizar estado de backup: ' + (error.response?.data?.message || error.message));
    }
  };

  const getTipoOperadorColor = (tipo: string) => {
    switch (tipo) {
      case 'Operador Urbano': return 'bg-blue-100 text-blue-800';
      case 'Operador Rural': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">Dashboard de Coordinador</h1>
              <p className="text-indigo-100 text-sm">Monitoreo de operadores y reportes diarios</p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={cargarDatos}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 border-white/30"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Datos
          </Button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Operadores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Operadores</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalOperadores}</p>
              <p className="text-xs text-gray-500 mt-1">Urbanos y Rurales</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Backup Completado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Backup Completado</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{operadoresConBackup}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalOperadores > 0 
                  ? `${Math.round((operadoresConBackup / totalOperadores) * 100)}% completado`
                  : '0% completado'
                }
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${totalOperadores > 0 ? (operadoresConBackup / totalOperadores) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Backup Pendiente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Backup Pendiente</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{operadoresSinBackup}</p>
              <p className="text-xs text-gray-500 mt-1">Por transmitir</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Total Registros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Registros</p>
              <div className="flex items-baseline space-x-4 mt-2">
                <div>
                  <p className="text-2xl font-bold text-blue-600">C: {totalRegistrosC}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">R: {totalRegistrosR}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Sumatoria de todos los reportes</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Database className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sección de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Búsqueda de Operador</h2>
          <div className="text-sm text-gray-500">
            {operadores.length} operadores cargados
          </div>
        </div>

        {/* Buscador */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              label="Número de Carnet"
              value={searchCarnet}
              onChange={(e) => setSearchCarnet(e.target.value)}
              placeholder="Ej: 10030763"
              disabled={loadingBusqueda}
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button
              onClick={buscarOperadorPorCarnet}
              isLoading={loadingBusqueda}
              disabled={!searchCarnet.trim() || loadingBusqueda}
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar Operador
            </Button>
          </div>
        </div>

        {errorBusqueda && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{errorBusqueda}</p>
            </div>
          </div>
        )}

        {/* Información del operador encontrado */}
        {operadorEncontrado && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {operadorEncontrado.nombre} {operadorEncontrado.apellido_paterno} {operadorEncontrado.apellido_materno}
                </h3>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-600">
                    Carnet: <span className="font-medium">{operadorEncontrado.carnet}</span>
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getTipoOperadorColor(operadorEncontrado.tipo_operador)}`}>
                    {operadorEncontrado.tipo_operador}
                  </span>
                  <span className={`flex items-center space-x-1 text-sm ${operadorEncontrado.entregaBackup ? 'text-green-600' : 'text-red-600'}`}>
                    {operadorEncontrado.entregaBackup ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>TRANSMITIDO</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        <span>NO TRANSMITIDO</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
              
              {!operadorEncontrado.entregaBackup && (
                <Button
                  onClick={handleActualizarBackup}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Marcar como Transmitido
                </Button>
              )}
            </div>

            {/* Aviso de estado de backup */}
            <div className={`mb-4 p-4 rounded-lg ${operadorEncontrado.entregaBackup ? 'bg-green-50 border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center space-x-3">
                {operadorEncontrado.entregaBackup ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-800">TRANSMITIDO</h4>
                      <p className="text-sm text-green-700">
                        El operador ha completado la transmisión de datos.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-red-800">NO TRANSMITIDO</h4>
                      <p className="text-sm text-red-700">
                        El operador aún no ha completado la transmisión de datos.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Historial de reportes del operador */}
        {operadorReportes && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">
                Historial de Reportes ({operadorReportes.total_reportes} reportes)
              </h4>
              <span className="text-sm text-gray-500">
                Operador ID: {operadorReportes.operador_id}
              </span>
            </div>

            {operadorReportes.data.length === 0 ? (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No se encontraron reportes para este operador</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Reporte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registros C
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registros R
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Punto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Municipio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Incidencias
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {operadorReportes.data.map((reporte) => (
                      <tr key={reporte.id_reporte} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(reporte.fecha_reporte).toISOString().split('T')[0]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {reporte.nro_estacion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reporte.registro_c > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {reporte.registro_c}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reporte.registro_r > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {reporte.registro_r}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {reporte.punto_empadronamiento}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {reporte.municipio}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={reporte.incidencias}>
                          {reporte.incidencias || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista completa de operadores (resumen) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Operadores (Urbanos y Rurales)</h2>
          <div className="flex items-center space-x-2 text-sm">
            <span className="flex items-center text-green-600">
              <UserCheck className="h-4 w-4 mr-1" />
              {operadoresConBackup} transmitidos
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center text-red-600">
              <UserX className="h-4 w-4 mr-1" />
              {operadoresSinBackup} pendientes
            </span>
          </div>
        </div>

        {loadingOperadores ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando operadores...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre Completo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carnet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Backup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estación
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {operadores
                  .filter(op => op.tipo_operador === 'Operador Urbano' || op.tipo_operador === 'Operador Rural')
                  .map((operador) => (
                    <tr 
                      key={operador.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${operadorEncontrado?.id === operador.id ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        setSearchCarnet(operador.carnet);
                        setTimeout(() => buscarOperadorPorCarnet(), 100);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {operador.nombre} {operador.apellido_paterno} {operador.apellido_materno}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {operador.carnet}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoOperadorColor(operador.tipo_operador)}`}>
                          {operador.tipo_operador}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${operador.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {operador.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {operador.entregaBackup ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-sm text-green-700">Transmitido</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-sm text-red-700">Pendiente</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {operador.estacion || '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Instrucciones para coordinadores:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Busque operadores por número de carnet para ver su historial de reportes</li>
              <li>• Solo se muestran operadores con rol "Operador Urbano" o "Operador Rural"</li>
              <li>• Puede marcar manualmente cuando un operador haya completado la transmisión de datos</li>
              <li>• El estado "TRANSMITIDO" indica que el operador entregó el backup de datos</li>
              <li>• Los totales incluyen únicamente operadores activos con roles de empadronamiento</li>
              <li>• Haga clic en cualquier operador de la lista para ver su historial completo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinadorDashboard;