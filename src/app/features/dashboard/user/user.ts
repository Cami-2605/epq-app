import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/models/usuario';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user.html',
  styleUrls: ['./user.css']
})
export class UserComponent implements OnInit {
  users: Usuario[] = [];
  usuarioFoto = '';
  loading = false;
  error = '';

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarFotoUsuario();
  }

  cargarFotoUsuario(): void {
    this.usuarioService.getPerfil().subscribe({
      next: (user) => this.usuarioFoto = user.fotoPerfil ?? '',
      error: () => {}
    });
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        const body = err?.error;
        if (body?.mensaje) {
          this.error = body.mensaje;
        } else {
          this.error = 'Error al cargar usuarios';
        }
        this.loading = false;
      }
    });
  }

  eliminarUsuario(user: Usuario): void {
    if (!confirm(`¿Eliminar al usuario "${user.username}"?`)) return;
    this.usuarioService.eliminarUsuario(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
      },
      error: (err) => {
        const body = err?.error;
        this.error = body?.mensaje || 'Error al eliminar usuario';
        setTimeout(() => this.error = '', 4000);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToExcel() {
    this.router.navigate(['/excel']);
  }

  goToUsuarios() {
    this.router.navigate(['/dashboard-user']);
  }

  goToGenerador(): void {
    this.router.navigate(['/dashboard-admin']);
  }

  goToPerfil(): void {
    this.router.navigate(['/perfil']);
  }
}
