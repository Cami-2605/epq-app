import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario';

export type { Usuario };

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  /** Perfil del usuario autenticado. */
  getPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/perfil`);
  }

  /** Actualiza nombre, correo y teléfono del usuario autenticado. */
  actualizarPerfil(data: Partial<Pick<Usuario, 'nombreCompleto' | 'correo' | 'telefono'>>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/perfil`, data);
  }

  /** Sube una nueva foto de perfil y devuelve la URL/base64 guardada. */
  actualizarFoto(foto: File): Observable<string> {
    const formData = new FormData();
    formData.append('foto', foto);
    return this.http.post(`${this.apiUrl}/usuarios/perfil/foto`, formData, {
      responseType: 'text'
    });
  }

  /** Lista todos los usuarios (solo admin). */
  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
  }

  /** Elimina un usuario por id (solo admin). */
  eliminarUsuario(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, {
      responseType: 'text'
    });
  }
}
