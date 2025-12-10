import axios from 'axios';
import { get } from 'react-hook-form';

const API_URL = 'http://localhost:8000'; // URL API

// Cuerpo del login
interface LoginCredentials {
  username: string;
  password: string;
  role: 'Operador' | 'Coordinador';
}

// interface de la respuesta
interface LoginResponse {
  refresh: string;
  access: string;
  user: {
    id: number;
    username: string;
    email: string;
    groups: string[];
    operador?: {
      id_operador: number;
      ruta: {
        id: number;
        nombre: string;
      };
      id_estacion: number;
      nro_estacion: number;
      tipo_operador: string;
    } | null;
    coordinador?: {
      id: number;
      nombre: string;
      apellido_paterno: string;
      apellido_materno: string | null;
      celular: string | null;
      cantidad_operadores: number;
    } | null;
    operadores_asignados?: Array<{
      id: number;
      id_operador: number;
      tipo_operador: string;
      ruta: string;
      nro_estacion: number;
      username: string;
      email: string;
    }>;
  };
}

// Interfaz de operador informacion
export interface OperadorInfo {
  success: boolean;
  operador_id: number;
  data: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    celular: string;
    carnet: string;
    tipo_operador: string;
    nombre_coordinador: string | null;
    id_estacion: number;
    codigo_equipo: string;
    modelo_estacion: string;
    tipo_estacion: string;
    nro_estacion: number;
    contador_r: number;
    contador_c: number;
    punto_de_empadronamiento: string;
    municipio: string;
    provincia: string;
    departamento: string;
    nombre_ruta: string;
  };
}

// Interfaz para el envio de reporte diario
export interface ReporteDiario {
  fecha_reporte: string; // ISO string
  contador_inicial_c: string;
  contador_final_c: string;
  registro_c: number;
  contador_inicial_r: string;
  contador_final_r: string;
  registro_r: number;
  incidencias: string;
  observaciones: string;
  fecha_registro?: string;
  sincronizar?: boolean;
  estado?: string;
  operador: number;
  estacion: number;
  centro_empadronamiento: number;
}

// Interfaz para el formulario de reporte
export interface ReporteFormData {
  fecha_reporte: string; // YYYY-MM-DD
  nro_estacion: string;
  contador_inicial_c: string; // 4 dígitos
  contador_final_c: string; // 4 dígitos
  contador_inicial_r: string; // 4 dígitos
  contador_final_r: string; // 4 dígitos
  nro_tramite_c: string; // 1 dígito
  nro_tramite_r: string; // 1 dígito
  nro_saltos_c?: string;
  nro_saltos_r?: string;
  incidencias?: string;
  observaciones?: string;
}

// Interfaz para centro de empadronamiento
export interface CentroEmpadronamiento {
  id: number;
  provincia: string;
  municipio: string;
  punto_de_empadronamiento: string;
  id_ruta: number;
  nombre_ruta: string;
}

// Interfaz para estaciones y nro de estacion
export interface Estacion {
  id: number;
  codigo_equipo: string;
  tipo_estacion: string;
  id_llave: number;
  nro_estacion: number;
  contador_r: number;
  contador_c: number;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/api/token/`, {
      username: credentials.username,
      password: credentials.password
    });
    
    const data = response.data;
    
    // Verificar que el rol seleccionado coincida con la respuesta
    const userRole = data.user.groups[0]; // Suponiendo que el primer grupo es el rol principal
    
    if (userRole !== credentials.role) {
      throw new Error(`El usuario no tiene el rol de ${credentials.role}`);
    }
    
    // Verificar que la información del rol no sea null
    if (credentials.role === 'Operador' && !data.user.operador) {
      throw new Error('El operador no tiene información asignada');
    }

    // Verificar que el operador tenga estación asignada (id_estacion diferente de 0)
    if (credentials.role === 'Operador' && data.user.operador) {
      if (data.user.operador.id_estacion === 0) {
        throw new Error('El operador no tiene una estación asignada. Contacte a soporte.');
      }
      
      if (data.user.operador.nro_estacion === 0) {
        throw new Error('El operador no tiene una estación asignada. Contacte a soporte.');
      }
    }
    
    if (credentials.role === 'Coordinador' && !data.user.coordinador) {
      throw new Error('El coordinador no tiene información asignada');
    }
    
    // Guardar tokens y datos en localStorage
    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('role', credentials.role);
    
    return data;
  },

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getCurrentRole(): 'Operador' | 'Coordinador' | null {
    return localStorage.getItem('role') as 'Operador' | 'Coordinador' | null;
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_URL}/api/token/refresh/`, {
      refresh: refreshToken
    });
    
    const newAccessToken = response.data.access;
    localStorage.setItem('accessToken', newAccessToken);
    
    return newAccessToken;
  },

  validateRole(role: 'Operador' | 'Coordinador'): boolean {
    const user = this.getCurrentUser();
    const currentRole = this.getCurrentRole();
    if (currentRole !== role) {
      return false;
    }
    
    // Verificar que la información del rol no sea null
    if (role === 'Operador') {
      if (!user?.operador) {
        return false;
      }
      
      // Verificar que tenga estación asignada
      
      if (user.operador.id_estacion === 0 || user.operador.nro_estacion === 0) {
        return false;
      }
    }
    
    if (role === 'Coordinador' && !user?.coordinador) {
      return false;
    }
    
    return true;
  },
  
  validateOperadorEstacion(): { tieneEstacion: boolean; mensaje?: string } {
    const user = this.getCurrentUser();
    const currentRole = this.getCurrentRole();
    
    if (currentRole !== 'Operador') {
      return { tieneEstacion: true }; // Solo aplica a operadores
    }
    
    if (!user?.operador) {
      return { 
        tieneEstacion: false, 
        mensaje: 'El operador no tiene información asignada' 
      };
    }
    
    if (user.operador.id_estacion === 0) {
      return { 
        tieneEstacion: false, 
        mensaje: 'El operador no tiene una estación asignada. Contacte a soporte.' 
      };
    }
    
    if (user.operador.nro_estacion === 0) {
      return { 
        tieneEstacion: false, 
        mensaje: 'El operador no tiene una estación asignada. Contacte a soporte.' 
      };
    }
    
    return { tieneEstacion: true };
  },

  getRedirectPath(): string {
    const role = this.getCurrentRole();
    
    switch (role) {
      case 'Operador':
        return '/operador';
      case 'Coordinador':
        return '/coordinador';
      default:
        return '/login';
    }
  },

  async getOperadorInfo(operadorId: number): Promise<OperadorInfo> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await axios.get(`${API_URL}/info-operador/${operadorId}/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  },

  async enviarReporteDiario(reporte: ReporteFormData, operadorId: number, estacionId: number, centroEmpadronamientoId: number): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No autenticado');
    }

    // Formatear los contadores según el formato requerido
    const contadorInicialC = `C-${reporte.nro_estacion}-${reporte.contador_inicial_c.padStart(4, '0')}-${reporte.nro_tramite_c}`;
    const contadorFinalC = `C-${reporte.nro_estacion}-${reporte.contador_final_c.padStart(4, '0')}-${reporte.nro_tramite_c}`;
    const contadorInicialR = `R-${reporte.nro_estacion}-${reporte.contador_inicial_r.padStart(4, '0')}-${reporte.nro_tramite_r}`;
    const contadorFinalR = `R-${reporte.nro_estacion}-${reporte.contador_final_r.padStart(4, '0')}-${reporte.nro_tramite_r}`;

    // Calcular registros
    const registroC = parseInt(reporte.contador_final_c) - parseInt(reporte.contador_inicial_c) - parseInt(reporte.nro_saltos_c || "0");
    const registroR = parseInt(reporte.contador_final_r) - parseInt(reporte.contador_inicial_r) - parseInt(reporte.nro_saltos_r || "0");

    const payload: ReporteDiario = {
      fecha_reporte: `${reporte.fecha_reporte}T00:00:00Z`,
      contador_inicial_c: contadorInicialC,
      contador_final_c: contadorFinalC,
      registro_c: registroC >= 0 ? registroC : 0,
      contador_inicial_r: contadorInicialR,
      contador_final_r: contadorFinalR,
      registro_r: registroR >= 0 ? registroR : 0,
      incidencias: reporte.incidencias || "0",
      observaciones: reporte.observaciones || "",
      fecha_registro: new Date().toISOString(),
      sincronizar: true,
      estado: "ENVIO REPORTE",
      operador: operadorId,
      estacion: estacionId,
      centro_empadronamiento: centroEmpadronamientoId
    };

    const response = await axios.post(`${API_URL}/api/reportesdiarios/`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  },


// Trae la lista de centros de empadronamiento
async getCentrosEmpadronamiento(): Promise<CentroEmpadronamiento[]> {
  const token = this.getAccessToken();
  if (!token) {
    throw new Error('No autenticado');
  }

  const response = await axios.get<CentroEmpadronamiento[]>(`${API_URL}/lista-centros-empadronamiento/`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return response.data;
},

async getListaEstaciones(): Promise<Estacion[]> {
  const token = this.getAccessToken();
  if (!token) {
    throw new Error('No autenticado');
  }
  const response = await axios.get<Estacion[]>(`${API_URL}/lista-estaciones-llaves/`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
},

async buscarEstacionPorNumero(nroEstacion: string): Promise<Estacion | undefined> {
    try {
      const estaciones = await this.getListaEstaciones();
      const nroEstacionNum = parseInt(nroEstacion);
      
      return estaciones.find(estacion => 
        estacion.nro_estacion === nroEstacionNum
      );
    } catch (error) {
      console.error('Error al buscar estación:', error);
      return undefined;
    }
},

};

// Configurar axios para incluir el token en las peticiones
axios.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para refrescar token cuando expire
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Verificar si es una ruta de login o refresh
      const isLoginRequest = originalRequest.url.includes('/api/token/') && !originalRequest.url.includes('/refresh/');
      const isRefreshRequest = originalRequest.url.includes('/api/token/refresh/');

      if (isLoginRequest || isRefreshRequest) {
        // No intentar refrescar token para login/refresh fallidos
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      
      try {
        const newToken = await authService.refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Solo redirigir si realmente había una sesión activa
        if (authService.isAuthenticated()) {
          authService.logout();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
