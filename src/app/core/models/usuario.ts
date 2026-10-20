// Refleja el UsuarioDto del backend
export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  cedula: string;
  fotoPerfil?: string;
  rol: string; // 'admin' | 'user'
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
