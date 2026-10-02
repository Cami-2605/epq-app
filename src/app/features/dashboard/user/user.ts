import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user.html',
  styleUrls: ['./user.css']
})
export class UserComponent implements OnInit {
  users = [
    { nombre: 'Juan Camilo Rojas', cedula: '1090112233', correo: 'juan@epq.com', telefono: '3101112233' },
    { nombre: 'Maria Paula Leon', cedula: '1090887766', correo: 'maria@epq.com', telefono: '3119977665' },
    { nombre: 'Carlos Andres Soto', cedula: '1542044766', correo: 'carlos@epq.com', telefono: '3126678990' },
    { nombre: 'Laura Jimenez', cedula: '1099123344', correo: 'laura@epq.com', telefono: '3154412299' },
    { nombre: 'Pedro Diaz', cedula: '923334449', correo: 'pedro@epq.com', telefono: '3165500441' }
  ];

  usuarioFoto = '';

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarFotoUsuario();
  }

  cargarFotoUsuario(): void {
    this.usuarioService.getPerfil().subscribe({
      next: (user) => this.usuarioFoto = user.fotoPerfil,
      error: () => {}
    });
  }

  logout() {
    localStorage.removeItem('role');
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

  view(user: any) {
    alert(`Ver usuario: ${user.nombre}`);
  }

  remove(user: any) {
    this.users = this.users.filter(u => u !== user);
  }

  edit(user: any) {
    alert(`Editar usuario: ${user.nombre}`);
  }
}