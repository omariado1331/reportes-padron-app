import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService, type ReporteFormData, type CentroEmpadronamiento, type Estacion} from '../services/auth';
import { 
  Calendar,
  Hash,
  AlertTriangle,
  FileText,
  Save,
  RotateCcw,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Calculator,
  Info,
  MapPin,
  ChevronDown,
  X,
  Check,
  //Search
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

// Esquema Zod actualizado
const reporteSchema = z.object({
  fecha_reporte: z.string().min(1, 'La fecha es requerida'),
  nro_estacion: z.string()
    .min(1, 'El número de estación es requerido')
    .regex(/^\d{5}$/, 'Debe ser un número de exactamente 5 dígitos'),
  contador_inicial_c: z.string()
    .min(1, 'El contador inicial C es requerido')
    .regex(/^\d{1,4}$/, 'Debe ser un número de hasta 4 dígitos'),
  contador_final_c: z.string()
    .min(1, 'El contador final C es requerido')
    .regex(/^\d{1,4}$/, 'Debe ser un número de hasta 4 dígitos'),
  contador_inicial_r: z.string()
    .min(1, 'El contador inicial R es requerido')
    .regex(/^\d{1,4}$/, 'Debe ser un número de hasta 4 dígitos'),
  contador_final_r: z.string()
    .min(1, 'El contador final R es requerido')
    .regex(/^\d{1,4}$/, 'Debe ser un número de hasta 4 dígitos'),
  nro_tramite_c: z.string()
    .min(1, 'El número de trámite C es requerido')
    .regex(/^\d$/, 'Debe ser un solo dígito'),
  nro_tramite_r: z.string()
    .min(1, 'El número de trámite R es requerido')
    .regex(/^\d$/, 'Debe ser un solo dígito'),
  nro_saltos_c: z.string().default("0"),
  nro_saltos_r: z.string().default("0"),
  incidencias: z.string().default(""),
  observaciones: z.string().default(""),
}).refine(data => {
  const inicialC = parseInt(data.contador_inicial_c);
  const finalC = parseInt(data.contador_final_c);
  //const saltosC = parseInt(data.nro_saltos_c || "0");
  return finalC >= inicialC;
}, {
  message: "El contador final C no puede ser menor que el inicial",
  path: ["contador_final_c"]
}).refine(data => {
  const inicialR = parseInt(data.contador_inicial_r);
  const finalR = parseInt(data.contador_final_r);
  //const saltosR = parseInt(data.nro_saltos_r || "0");
  return finalR >= inicialR;
}, {
  message: "El contador final R no puede ser menor que el inicial",
  path: ["contador_final_r"]
});

interface RegistroDiarioFormProps {
  operadorId: number;
  nroEstacion: number;
  estacionId?: number;
}

const RegistroDiarioForm: React.FC<RegistroDiarioFormProps> = ({
  operadorId,
  nroEstacion,
  estacionId: propEstacionId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCentros, setIsLoadingCentros] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estacionBloqueada, setEstacionBloqueada] = useState(true);
  
  // Estados para los centros de empadronamiento
  const [centros, setCentros] = useState<CentroEmpadronamiento[]>([]);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [puntosEmpadronamiento, setPuntosEmpadronamiento] = useState<CentroEmpadronamiento[]>([]);
  
  // Estados para las selecciones
  const [selectedProvincia, setSelectedProvincia] = useState<string>('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedPuntoEmpadronamiento, setSelectedPuntoEmpadronamiento] = useState<CentroEmpadronamiento | null>(null);
  const [centroEmpadronamientoId, setCentroEmpadronamientoId] = useState<number | null>(null);

  // ESTADOS PARA VALIDACIÓN DE ESTACIÓN
  const [listaEstaciones, setListaEstaciones] = useState<Estacion[]>([]);
  const [cargandoEstaciones, setCargandoEstaciones] = useState(false);
  const [estacionValidada, setEstacionValidada] = useState<Estacion | null>(null);
  const [validandoEstacion, setValidandoEstacion] = useState(false);
  const [estacionId, setEstacionId] = useState<number | undefined>(propEstacionId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm<ReporteFormData>({
    resolver: zodResolver(reporteSchema),
    defaultValues: {
      fecha_reporte: new Date().toISOString().split('T')[0],
      nro_estacion: nroEstacion.toString().padStart(5, '0'),
      nro_tramite_c: "0",
      nro_tramite_r: "0",
      incidencias: "",
      observaciones: "",
      contador_inicial_c: "",
      contador_final_c: "",
      contador_inicial_r: "",
      contador_final_r: ""
    }
  });

  // Observar cambios en los contadores para calcular diferencias en tiempo real
  const watchContadores = watch(['contador_inicial_c', 'contador_final_c', 'contador_inicial_r', 'contador_final_r']);
  const watchNroEstacion = watch('nro_estacion');
  const watchTramiteC = watch('nro_tramite_c');
  const watchTramiteR = watch('nro_tramite_r');

  // Calcular registros en tiempo real
  const registroC = React.useMemo(() => {
    const inicialC = watchContadores[0];
    const finalC = watchContadores[1];
    const saltosC = watch('nro_saltos_c') || "0";
    if (inicialC && finalC) {
      const dif = parseInt(finalC) - parseInt(inicialC) - parseInt(saltosC) + 1;
      return dif > 0 ? dif : 0;
    }
    return 0;
  }, [watchContadores,  watch('nro_saltos_c')]);

  const registroR = React.useMemo(() => {
    const inicialR = watchContadores[2];
    const finalR = watchContadores[3];
    const saltosR = watch('nro_saltos_r') || "0";
    if (inicialR && finalR) {
      const dif = parseInt(finalR) - parseInt(inicialR) - parseInt(saltosR) + 1;
      return dif > 0 ? dif : 0;
    }
    return 0;
  }, [watchContadores, watch('nro_saltos_r')]);

  // Generar formatos en tiempo real
  const formatoInicialC = React.useMemo(() => {
    if (!watchContadores[0] || !watchTramiteC) return '-----';
    return `C-${watchNroEstacion}-${watchContadores[0].padStart(4, '0')}-${watchTramiteC}`;
  }, [watchContadores[0], watchNroEstacion, watchTramiteC]);

  const formatoFinalC = React.useMemo(() => {
    if (!watchContadores[1] || !watchTramiteC) return '-----';
    return `C-${watchNroEstacion}-${watchContadores[1].padStart(4, '0')}-${watchTramiteC}`;
  }, [watchContadores[1], watchNroEstacion, watchTramiteC]);

  const formatoInicialR = React.useMemo(() => {
    if (!watchContadores[2] || !watchTramiteR) return '-----';
    return `R-${watchNroEstacion}-${watchContadores[2].padStart(4, '0')}-${watchTramiteR}`;
  }, [watchContadores[2], watchNroEstacion, watchTramiteR]);

  const formatoFinalR = React.useMemo(() => {
    if (!watchContadores[3] || !watchTramiteR) return '-----';
    return `R-${watchNroEstacion}-${watchContadores[3].padStart(4, '0')}-${watchTramiteR}`;
  }, [watchContadores[3], watchNroEstacion, watchTramiteR]);

  // Cargar centros de empadronamiento al montar el componente
  useEffect(() => {
    fetchCentrosEmpadronamiento();
  }, []);

  const fetchCentrosEmpadronamiento = async () => {
    setIsLoadingCentros(true);
    try {
      const data = await authService.getCentrosEmpadronamiento();
      setCentros(data);
      
      // Extraer provincias únicas - CORRECCIÓN DEL ERROR DE TIPADO
      const provinciasUnicas = [...new Set(data.map((centro: CentroEmpadronamiento) => centro.provincia))] as string[];
      setProvincias(provinciasUnicas);
      
    } catch (err: any) {
      setError('Error al cargar centros de empadronamiento: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoadingCentros(false);
    }
  };

  // Después de los otros useEffect, AGREGAR:
    useEffect(() => {
    cargarListaEstaciones();
    }, []);

    useEffect(() => {
    if (estacionBloqueada) {
        // Si está bloqueada, usar la estación por defecto
        const estacionDefault = listaEstaciones.find(e => e.nro_estacion === nroEstacion);
        if (estacionDefault) {
        setEstacionValidada(estacionDefault);
        setEstacionId(estacionDefault.id);
        }
        return;
    }

    if (watchNroEstacion && watchNroEstacion.length === 5) {
        validarEstacion(watchNroEstacion);
    } else {
        setEstacionValidada(null);
        setEstacionId(undefined);
    }
    }, [watchNroEstacion, estacionBloqueada, listaEstaciones, nroEstacion]);


  // Cuando se selecciona una provincia, cargar sus municipios
  const handleProvinciaChange = (provincia: string) => {
    setSelectedProvincia(provincia);
    setSelectedMunicipio('');
    setSelectedPuntoEmpadronamiento(null);
    setCentroEmpadronamientoId(null);
    
    const municipiosFiltrados = centros
      .filter(centro => centro.provincia === provincia)
      .map(centro => centro.municipio);
    
    setMunicipios([...new Set(municipiosFiltrados)]);
  };

  // Cuando se selecciona un municipio, cargar sus puntos de empadronamiento
  const handleMunicipioChange = (municipio: string) => {
    setSelectedMunicipio(municipio);
    setSelectedPuntoEmpadronamiento(null);
    setCentroEmpadronamientoId(null);
    
    const puntosFiltrados = centros.filter(centro => 
      centro.provincia === selectedProvincia && centro.municipio === municipio
    );
    
    setPuntosEmpadronamiento(puntosFiltrados);
  };

  // Cuando se selecciona un punto de empadronamiento
  const handlePuntoEmpadronamientoChange = (puntoId: number) => {
    const puntoSeleccionado = puntosEmpadronamiento.find(p => p.id === puntoId);
    setSelectedPuntoEmpadronamiento(puntoSeleccionado || null);
    setCentroEmpadronamientoId(puntoId);
  };

  const cargarListaEstaciones = async () => {
    try {
        setCargandoEstaciones(true);
        const estaciones = await authService.getListaEstaciones();
        setListaEstaciones(estaciones);
    } catch (err: any) {
        setError('Error al cargar lista de estaciones: ' + err.message);
    } finally {
        setCargandoEstaciones(false);
    }
    };

    const validarEstacion = async (nroEstacionStr: string) => {
    //const nroEstacionNum = parseInt(nroEstacionStr);
    
    if (!/^\d{5}$/.test(nroEstacionStr)) {
        setEstacionValidada(null);
        setEstacionId(undefined);
        return;
    }

    setValidandoEstacion(true);
    
    try {
        const estacion = await authService.buscarEstacionPorNumero(nroEstacionStr);
        
        if (estacion) {
        setEstacionValidada(estacion);
        setEstacionId(estacion.id);
        setError(null); // Limpiar error si existe
        } else {
        setEstacionValidada(null);
        setEstacionId(undefined);
        setError(`El número de estación ${nroEstacionStr} no existe en el sistema`);
        }
    } catch (err: any) {
        setError('Error al validar estación: ' + err.message);
    } finally {
        setValidandoEstacion(false);
    }
    };

  const onSubmit = async (data: ReporteFormData) => {
    if (!centroEmpadronamientoId) {
      setError('Debe seleccionar un centro de empadronamiento');
      return;
    }

    if (!estacionId) {
      setError('ID de estación no disponible');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await authService.enviarReporteDiario(
        data, 
        operadorId, 
        estacionId, 
        centroEmpadronamientoId
      );
      
      setSuccess(true);
      // Resetear formulario después de éxito
      setTimeout(() => {
        reset();
        setValue('nro_estacion', nroEstacion.toString());
        setSelectedProvincia('');
        setSelectedMunicipio('');
        setSelectedPuntoEmpadronamiento(null);
        setCentroEmpadronamientoId(null);
        setEstacionBloqueada(true);
      }, 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al enviar el reporte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDesbloquearEstacion = () => {
    if (estacionBloqueada) {
      const confirmar = window.confirm(
        '⚠️ ADVERTENCIA\n\n' +
        'Al desbloquear, podrás cambiar el número de Estación.\n' +
        'Solo modifica si realizaste registros desde otra estación que no sea tu estación asignada.\n\n' +
        '¿Estás seguro de continuar? Se verificará el número ingresado'
      );
      
      if (confirmar) {
        setEstacionBloqueada(false);
        setValue('nro_estacion', '', { shouldDirty: true });
        setEstacionValidada(null);
        setEstacionId(undefined);
      }
    } else {
        // volver a bloquear
        setEstacionBloqueada(true);
        setValue('nro_estacion', nroEstacion.toString().padStart(5, '0'));
        const estacionDefault = listaEstaciones.find(e => e.nro_estacion === nroEstacion);
        if (estacionDefault) {
            setEstacionValidada(estacionDefault);
            setEstacionId(estacionDefault.id)
        }
    }
  };

  const handleResetForm = () => {
    const confirmar = window.confirm('¿Estás seguro de que deseas limpiar todos los campos?');
    if (confirmar) {
      reset();
      setEstacionBloqueada(true);
      setValue('nro_estacion', nroEstacion.toString());
      setSelectedProvincia('');
      setSelectedMunicipio('');
      setSelectedPuntoEmpadronamiento(null);
      setCentroEmpadronamientoId(null);
      setError(null);
      setSuccess(false);
      // Restablecer estación validada
        const estacionDefault = listaEstaciones.find(e => e.nro_estacion === nroEstacion);
        if (estacionDefault) {
        setEstacionValidada(estacionDefault);
        setEstacionId(estacionDefault.id);
        }
        setError(null);
        setSuccess(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold">Registro Diario de Empadronamiento</h2>
              <p className="text-blue-100 text-sm">Complete todos los campos para enviar el reporte</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-blue-800 px-3 py-2 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Fecha actual: {new Date().toLocaleDateString('es-ES')}</span>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Fecha, Estación y Centro de Empadronamiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                type="date"
                label="Fecha del Reporte"
                {...register('fecha_reporte')}
                error={errors.fecha_reporte?.message}
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Número de Estación
                </label>
                <button
                  type="button"
                  onClick={handleDesbloquearEstacion}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                  disabled={isLoading || cargandoEstaciones} // AGREGAR deshabilitar si está cargando
                >
                  {estacionBloqueada ? (
                    <>
                      <Unlock className="h-3 w-3" />
                      <span>Desbloquear</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Bloquear</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className='relative'>
                <Input
                  {...register('nro_estacion')}
                  error={errors.nro_estacion?.message}
                  disabled={estacionBloqueada || isLoading || cargandoEstaciones}
                  placeholder="Ej: 10795"
                  maxLength={5}
                />

                {/* AGREGAR: Indicador de validación */}
                {!estacionBloqueada && watchNroEstacion && watchNroEstacion.length === 5 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validandoEstacion ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    ) : estacionValidada ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              
              {/* AGREGAR: Información de la estación validada */}
              {estacionValidada && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Estación: {estacionValidada.nro_estacion}
                      </p>
                      <p className="text-xs text-gray-600">
                        {estacionValidada.tipo_estacion} • {estacionValidada.codigo_equipo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">ID: {estacionValidada.id}</p>
                      <p className="text-xs text-gray-600">
                        Contadores: R={estacionValidada.contador_r} C={estacionValidada.contador_c}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AGREGAR: Mensaje de error si la estación no es válida */}
              {!estacionBloqueada && watchNroEstacion && watchNroEstacion.length === 5 && 
              !validandoEstacion && !estacionValidada && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">
                      El número de estación {watchNroEstacion} no existe en el sistema
                    </p>
                  </div>
                </div>
              )}

              {!estacionBloqueada && (
                <div className="flex items-center space-x-1 mt-2 text-amber-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Número de estación desbloqueado - debe ser válido</span>
                </div>
              )}              

              {/* <Input
                {...register('nro_estacion')}
                error={errors.nro_estacion?.message}
                disabled={estacionBloqueada || isLoading}
                placeholder="Número de estación"
              />
              {!estacionBloqueada && (
                <div className="flex items-center space-x-1 mt-2 text-amber-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Número de estación desbloqueado - modificar con precaución</span>
                </div>
              )} */}
            </div>
          </div>

          {/* Selección de Centro de Empadronamiento */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Centro de Empadronamiento</h3>
            </div>

            {isLoadingCentros ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando centros de empadronamiento...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Provincia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProvincia}
                      onChange={(e) => handleProvinciaChange(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    >
                      <option value="">Seleccione una provincia</option>
                      {provincias.map((provincia) => (
                        <option key={provincia} value={provincia}>
                          {provincia}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Municipio */}
                {selectedProvincia && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Municipio
                    </label>
                    <div className="relative">
                      <select
                        value={selectedMunicipio}
                        onChange={(e) => handleMunicipioChange(e.target.value)}
                        disabled={isLoading || !selectedProvincia}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                      >
                        <option value="">Seleccione un municipio</option>
                        {municipios.map((municipio) => (
                          <option key={municipio} value={municipio}>
                            {municipio}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Punto de Empadronamiento */}
                {selectedMunicipio && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Punto de Empadronamiento
                    </label>
                    <div className="relative">
                      <select
                        value={selectedPuntoEmpadronamiento?.id || ''}
                        onChange={(e) => handlePuntoEmpadronamientoChange(Number(e.target.value))}
                        disabled={isLoading || !selectedMunicipio}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                      >
                        <option value="">Seleccione un punto de empadronamiento</option>
                        {puntosEmpadronamiento.map((punto) => (
                          <option key={punto.id} value={punto.id}>
                            {punto.punto_de_empadronamiento} ({punto.nombre_ruta})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                    {selectedPuntoEmpadronamiento && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Ruta:</span> {selectedPuntoEmpadronamiento.nombre_ruta}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!centroEmpadronamientoId && isDirty && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <p className="text-sm text-amber-800">
                        Debe seleccionar un centro de empadronamiento para enviar el reporte
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Contadores R */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Hash className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Contador R (Registros nuevos)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Input
                  type="number"
                  label="Contador Inicial R"
                  {...register('contador_inicial_r')}
                  error={errors.contador_inicial_r?.message}
                  disabled={isLoading}
                  placeholder="Ej: 1234"
                  min="0"
                  max="9999"
                />
              </div>

              <div>
                <Input
                  type="number"
                  label="Contador Final R"
                  {...register('contador_final_r')}
                  error={errors.contador_final_r?.message}
                  disabled={isLoading}
                  placeholder="Ej: 5678"
                  min="0"
                  max="9999"
                />
              </div>

              <div>
                <Input
                  type="number"
                  label="N° Trámite R"
                  {...register('nro_tramite_r')}
                  error={errors.nro_tramite_r?.message}
                  disabled={isLoading}
                  placeholder="0-9"
                  min="0"
                  max="9"
                />
              </div>

              <div>
                <Input
                    type="number"
                    label="N° Saltos R"
                    {...register('nro_saltos_r')}
                    error={errors.nro_saltos_r?.message}
                    disabled={isLoading}
                    placeholder="Ej: 0"
                    min="0"
                    max="9999"
                    defaultValue="0"
                    />
                </div>
            </div>

            {/* Vista previa formato R - ACTUALIZADO EN TIEMPO REAL */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Formato generado:</p>
                  <p className="font-mono text-lg font-bold text-blue-700 mb-2">
                    {formatoInicialR}
                  </p>
                  <p className="font-mono text-lg font-bold text-green-700">
                    {formatoFinalR}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Registro R calculado:</p>
                  <div className="flex items-center space-x-2 justify-end">
                    <Calculator className="h-5 w-5 text-gray-500" />
                    <span className="text-2xl font-bold text-green-600">{registroR}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">(Final - Inicial - Saltos)</p>
                  <p className="text-xs text-gray-500">
                        Saltos R: {watch('nro_saltos_c') || '0'}
                    </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contadores C */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Hash className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Contador C (Cambios)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Input
                  type="number"
                  label="Contador Inicial C"
                  {...register('contador_inicial_c')}
                  error={errors.contador_inicial_c?.message}
                  disabled={isLoading}
                  placeholder="Ej: 1234"
                  min="0"
                  max="9999"
                />
              </div>

              <div>
                <Input
                  type="number"
                  label="Contador Final C"
                  {...register('contador_final_c')}
                  error={errors.contador_final_c?.message}
                  disabled={isLoading}
                  placeholder="Ej: 5678"
                  min="0"
                  max="9999"
                />
              </div>

              <div>
                <Input
                  type="number"
                  label="N° Trámite C"
                  {...register('nro_tramite_c')}
                  error={errors.nro_tramite_c?.message}
                  disabled={isLoading}
                  placeholder="0-9"
                  min="0"
                  max="9"
                />
              </div>
              
                <div>
                    <Input
                    type="number"
                    label="N° Saltos C"
                    {...register('nro_saltos_c')}
                    error={errors.nro_saltos_c?.message}
                    disabled={isLoading}
                    placeholder="Ej: 0"
                    min="0"
                    max="9999"
                    defaultValue="0"
                    />
                </div>

            </div>

            {/* Vista previa formato C - ACTUALIZADO EN TIEMPO REAL */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Formato generado:</p>
                  <p className="font-mono text-lg font-bold text-blue-700 mb-2">
                    {formatoInicialC}
                  </p>
                  <p className="font-mono text-lg font-bold text-green-700">
                    {formatoFinalC}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Registro C calculado:</p>
                  <div className="flex items-center space-x-2 justify-end">
                    <Calculator className="h-5 w-5 text-gray-500" />
                    <span className="text-2xl font-bold text-green-600">{registroC}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">(Final - Inicial - Saltos)</p>
                  <p className="text-xs text-gray-500">
                        Saltos C: {watch('nro_saltos_c') || '0'}
                    </p>
                </div>
              </div>
            </div>
          </div>

          {/* Incidencias y Observaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Incidencias</span>
                </div>
              </label>
              <textarea
                {...register('incidencias')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describa las incidencias ocurridas durante el empadronamiento, como cortes de luz, motivos por las que no pudo empadronar o complicaciones"
                disabled={isLoading}
              />
              {errors.incidencias && (
                <p className="mt-1 text-sm text-red-600">{errors.incidencias.message}</p>
              )}
              <div className="flex items-center space-x-1 mt-2 text-gray-500 text-sm">
                <Info className="h-3 w-3" />
                <span>Si no hay incidencias dejar en blanco</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span>Observaciones</span>
                </div>
              </label>
              <textarea
                {...register('observaciones')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Observaciones sobre los registros como registros que tuvieron saltos ejemplo 10745-0012-3 fue salto..."
                disabled={isLoading}
              />
              {errors.observaciones && (
                <p className="mt-1 text-sm text-red-600">{errors.observaciones.message}</p>
              )}
              <div className="flex items-center space-x-1 mt-2 text-gray-500 text-sm">
                <Info className="h-3 w-3" />
                <span>Si no hubo saltos dejar en blanco</span>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Resumen del Reporte</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Registros C:</span>
                  <span className="font-bold text-green-600">{registroC}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saltos en C:</span>
                  <span className="font-bold text-red-600"> {watch('nro_saltos_c') || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Registros R:</span>
                  <span className="font-bold text-green-600">{registroR}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saltos en R:</span>
                  <span className="font-bold text-red-600"> {watch('nro_saltos_r') || '0'}</span>
                </div>
               
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estación:</span>
                  <span className="font-medium">{watch('nro_estacion')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{watch('fecha_reporte')}</span>
                </div>
                {selectedPuntoEmpadronamiento && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Centro:</span>
                      <span className="font-medium text-right">
                        {selectedPuntoEmpadronamiento.punto_de_empadronamiento}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ruta:</span>
                      <span className="font-medium">{selectedPuntoEmpadronamiento.nombre_ruta}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {estacionValidada && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-gray-600">
                Estación válida: {estacionValidada.tipo_estacion} • {estacionValidada.codigo_equipo}
              </p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Error al enviar reporte</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">¡Reporte enviado exitosamente!</p>
                <p className="text-sm text-green-600 mt-1">El registro ha sido guardado en el sistema.</p>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpiar Formulario
            </Button>

            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!isDirty || isLoading || !centroEmpadronamientoId || !estacionValidada || !estacionId}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Enviando...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enviar Reporte Diario
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Instrucciones para el registro:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Seleccione primero la provincia, luego el municipio y finalmente el punto de empadronamiento</li>
              <li>• El número de estación se bloquea por defecto para evitar errores</li>
              <li>• Los contadores deben ser números de hasta 4 dígitos</li>
              <li>• El número de trámite debe ser un solo dígito (0-9)</li>
              <li>• Los registros C y R se calculan automáticamente</li>
              <li>• Los formatos se generan en tiempo real</li>
              <li>• Si no hay incidencias, dejar el valor "0"</li>
              <li>• Las observaciones son opcionales</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroDiarioForm;