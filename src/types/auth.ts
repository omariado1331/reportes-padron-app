export type UserRole = 'Operador' | 'Coordinador';

export interface LoginFormData {
  username: string;
  password: string;
  role: UserRole;
}

export interface User {
  id: number;
  username: string;
  email: string;
  groups: string[];
  operador?: Operador | null;
  coordinador?: Coordinador | null;
  operadores_asignados?: OperadorAsignado[];
}

export interface Operador {
  id_operador: number;
  ruta: {
    id: number;
    nombre: string;
  };
  id_estacion: number;
  nro_estacion: number;
  tipo_operador: string;
}

export interface Coordinador {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  celular: string | null;
  cantidad_operadores: number;
}

export interface OperadorAsignado {
  id: number;
  id_operador: number;
  tipo_operador: string;
  ruta: string;
  nro_estacion: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: User;
}