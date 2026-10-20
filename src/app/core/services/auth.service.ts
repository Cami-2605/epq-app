import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8080/api';
  private tokenKey = 'token';
  private userKey = 'user';
  private roleKey = 'role';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const token = this.getToken();
    const user = localStorage.getItem(this.userKey);
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  /**
   * Autentica al usuario. El backend devuelve { token, username }.
   * Luego consulta /usuarios/perfil para obtener el rol real.
   */
  login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string; username: string }>(
      `${this.apiUrl}/auth/login`, { username, password }
    ).pipe(
      tap(response => {
        if (response?.token) {
          this.saveToken(response.token);
        }
      }),
      switchMap(response => {
        // Consultar el perfil para obtener el rol real del backend
        return this.http.get<any>(`${this.apiUrl}/usuarios/perfil`).pipe(
          tap(perfil => {
            const user = { username: response.username };
            localStorage.setItem(this.userKey, JSON.stringify(user));
            this.currentUserSubject.next(user);
            // El rol viene del backend: 'admin' o 'user'
            const rol = perfil?.rol || 'user';
            localStorage.setItem(this.roleKey, rol);
          })
        );
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/registrar`, userData);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.roleKey);
    this.currentUserSubject.next(null);
  }
}
