export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;
  email: string;
  correo?: string;
  telefono: string;
  cedula: string;
  roles: string[];
  activo: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
}

export interface RegisterRequest {
  nombreCompleto: string;
  correo: string;
  telefono: string;
  cedula: string;
  username: string;
  password: string;
}