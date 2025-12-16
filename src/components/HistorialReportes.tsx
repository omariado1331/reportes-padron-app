import React, { useState, useEffect } from 'react';
import { authService, type ReporteDiarioHistorico } from '../services/auth';
import { 
  Calendar, 
  FileText, 
  Filter, 
  Download, 
  Search, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  BarChart3,
  MapPin,
  Hash,
  AlertCircle,
  Clock,
  Building,
  Loader2,
  Trash2
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface HistorialReportesProps {
  operadorId: number;
}

const HistorialReportes: React.FC<HistorialReportesProps> = ({ operadorId }) => {
  const [historial, setHistorial] = useState<ReporteDiarioHistorico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaFilter, setFechaFilter] = useState('');
  const [estacionFilter, setEstacionFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [eliminandoReporte, setEliminandoReporte] = useState<number | null>(null);
  const [eliminacionError, setEliminacionError] = useState<string | null>(null);
  const [eliminacionExito, setEliminacionExito] = useState(false);

  useEffect(() => {
    cargarHistorial();
  }, [operadorId]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.getHistorialReportesDiarios(operadorId);
      setHistorial(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarReporte = async (reporteId: number, index: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este reporte?\nEsta acción no se puede deshacer.')) {
      return;
    }

    setEliminandoReporte(reporteId);
    setEliminacionError(null);
    setEliminacionExito(false);

    try {
      await authService.eliminarReporte(reporteId);

      if (historial) {
        const nuevosData = historial.data.filter((_, i) => i !== index);
        setHistorial({
          ...historial,
          data: nuevosData,
          total_reportes: nuevosData.length
        })
      }

      setEliminacionExito(true);
      setTimeout(() => setEliminacionExito(false), 3000);

    } catch (error: any) {
      setEliminacionError(error.response?.data?.message || error.message || 'Error al eliminar el reporte');
    } finally {
      setEliminandoReporte(null);
    }
  };

  // Filtrar reportes
  const filteredReportes = historial?.data.filter(reporte => {
    const matchesSearch = 
      reporte.punto_empadronamiento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporte.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporte.nombre_ruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporte.incidencias.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFecha = fechaFilter ? reporte.fecha_reporte === fechaFilter : true;
    const matchesEstacion = estacionFilter ? 
      reporte.nro_estacion.toString().includes(estacionFilter) : true;

    return matchesSearch && matchesFecha && matchesEstacion;
  }) || [];

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReportes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReportes.length / itemsPerPage);

  const toggleRow = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatHora = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  };

  const getEstadoColor = (registroC: number, registroR: number) => {
    if (registroC > 0 && registroR > 0) return 'bg-green-100 text-green-800';
    if (registroC > 0 || registroR > 0) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const exportarCSV = () => {
    if (!historial) return;
    
    const headers = [
      'Fecha Reporte', 
      'Fecha Registro', 
      'Estación', 
      'N° Estación',
      'Registro C', 
      'Registro R', 
      'Punto Empadronamiento',
      'Municipio', 
      'Provincia', 
      'Departamento', 
      'Ruta',
      'Incidencias',
      'Observaciones'
    ];

    const csvContent = [
      headers.join(';'),
      ...historial.data.map(item => [
        item.fecha_reporte,
        item.fecha_registro,
        `"${item.codigo_estacion}"`,
        item.nro_estacion,
        item.registro_c,
        item.registro_r,
        `"${item.punto_empadronamiento}"`,
        `"${item.municipio}"`,
        `"${item.provincia}"`,
        `"${item.departamento}"`,
        `"${item.nombre_ruta}"`,
        `"${item.incidencias}"`,
        `"${item.observaciones}"`
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial_reportes_${operadorId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Cargando historial de reportes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar historial</h3>
        <p className="text-red-600">{error}</p>
        <Button
          onClick={cargarHistorial}
          className="mt-4"
          variant="outline"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <FileText className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold">Historial de Reportes Diarios</h2>
              <p className="text-purple-100 text-sm">
                {historial?.nombre_operador} - {historial?.total_reportes || 0} reportes registrados
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            
            <Button
              onClick={exportarCSV}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/30"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filtros de Búsqueda</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Input
              type="text"
              placeholder="Buscar por punto, municipio, ruta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div>
            <Input
              type="date"
              placeholder="Filtrar por fecha"
              value={fechaFilter}
              onChange={(e) => setFechaFilter(e.target.value)}
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>

          <div>
            <Input
              type="number"
              placeholder="Filtrar por n° estación"
              value={estacionFilter}
              onChange={(e) => setEstacionFilter(e.target.value)}
              icon={<Hash className="h-4 w-4" />}
            />
          </div>
        </div>

        {searchTerm || fechaFilter || estacionFilter ? (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Mostrando {filteredReportes.length} de {historial?.total_reportes} reportes
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFechaFilter('');
                setEstacionFilter('');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </Button>
          </div>
        ) : null}

        {eliminacionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error al eliminar reporte</p>
              <p className="text-sm text-red-600 mt-1">{eliminacionError}</p>
            </div>
          </div>
        )}

        {eliminacionExito && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <FileText className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Reporte eliminado exitosamente</p>
              <p className="text-sm text-green-600 mt-1">El reporte ha sido eliminado del sistema.</p>
            </div>
          </div>
        )}
      </div>

      {/* Resumen estadístico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reportes</p>
              <p className="text-2xl font-bold text-gray-900">{historial?.total_reportes || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estaciones Utilizadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(historial?.data.map(r => r.nro_estacion)).size || 0}
              </p>
            </div>
            <Hash className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Registros C</p>
              <p className="text-2xl font-bold text-green-700">
                {historial?.data.reduce((sum, item) => sum + item.registro_c, 0) || 0}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Registros R</p>
              <p className="text-2xl font-bold text-blue-700">
                {historial?.data.reduce((sum, item) => sum + item.registro_r, 0) || 0}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tabla de reportes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Reporte
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estación
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registros
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eliminar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron reportes</p>
                    {searchTerm || fechaFilter || estacionFilter ? (
                      <p className="text-sm text-gray-400 mt-2">Intenta con otros filtros de búsqueda</p>
                    ) : null}
                  </td>
                </tr>
              ) : (
                currentItems.map((reporte, index) => (
                  <React.Fragment key={`${reporte.fecha_reporte}-${index}`}>
                    <tr className={`hover:bg-gray-50 ${expandedRow === index ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatFecha(reporte.fecha_reporte)}
                          </p>
                          <p className="text-xs text-gray-500 hidden">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {formatHora(reporte.fecha_registro)}
                          </p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Estación {reporte.nro_estacion}
                          </p>
                          <p className="text-xs text-gray-500">{reporte.codigo_estacion}</p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {reporte.punto_empadronamiento}
                          </p>
                          <p className="text-xs text-gray-500">
                            {reporte.municipio}, {reporte.provincia}
                          </p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-sm font-medium">C: {reporte.registro_c}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-sm font-medium">R: {reporte.registro_r}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(reporte.registro_c, reporte.registro_r)}`}>
                          {reporte.registro_c > 0 && reporte.registro_r > 0 ? 'Activo' : 
                           reporte.registro_c > 0 || reporte.registro_r > 0 ? 'Parcial' : 'Sin registros'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(index)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>{expandedRow === index ? 'Ocultar' : 'Ver'}</span>
                          {expandedRow === index ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={()=> handleEliminarReporte(reporte.id_reporte, index)}
                          disabled= {eliminandoReporte === index}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          {eliminandoReporte === index ? (
                            <>
                              <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                              Eliminando ...  
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar 
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                    
                    {/* Fila expandida */}
                    {expandedRow === index && (
                      <tr className="bg-blue-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-2 text-amber-600" />
                                  Incidencias
                                </h4>
                                <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded">
                                  {reporte.incidencias || 'Sin incidencias reportadas'}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                                  <FileText className="h-4 w-4 mr-2 text-gray-600" />
                                  Observaciones
                                </h4>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                  {reporte.observaciones || 'Sin observaciones'}
                                </p>
                              </div>
                              
                              <div className="md:col-span-2">
                                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                                  <Building className="h-4 w-4 mr-2 text-gray-600" />
                                  Información de Ruta
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-xs text-gray-600">Ruta Asignada</p>
                                    <p className="font-medium">{reporte.nombre_ruta}</p>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-xs text-gray-600">Departamento</p>
                                    <p className="font-medium">{reporte.departamento}</p>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-xs text-gray-600">Provincia</p>
                                    <p className="font-medium">{reporte.provincia}</p>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-xs text-gray-600">Municipio</p>
                                    <p className="font-medium">{reporte.municipio}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {filteredReportes.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredReportes.length)} de {filteredReportes.length} reportes
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Información sobre los reportes:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Registro C:</strong> Cambios realizados en el sistema</li>
              <li>• <strong>Registro R:</strong> Registros nuevos ingresados</li>
              <li>• Haz clic en "Ver" para expandir y ver detalles completos del reporte</li>
              <li>• Usa los filtros para buscar reportes específicos</li>
              <li>• Exporta los datos en formato CSV para análisis externo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorialReportes;