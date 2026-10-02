import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  cedula: string;
  fotoPerfil: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/perfil`);
  }

  actualizarPerfil(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/perfil`, usuario);
  }

  actualizarFoto(foto: File): Observable<string> {
    const formData = new FormData();
    formData.append('foto', foto);
    return this.http.post(`${this.apiUrl}/usuarios/perfil/foto`, formData, {
      responseType: 'text'
    });
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
  }

  eliminarUsuario(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, {
      responseType: 'text'
    });
  }
}