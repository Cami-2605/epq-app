import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService, Usuario } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class PerfilComponent implements OnInit {
  usuario: Usuario = {
    id: 0, username: '', nombreCompleto: '', correo: '', telefono: '', cedula: '', fotoPerfil: '', rol: ''
  };
  editando = false;
  loading = false;
  mensajeError = '';
  mensajeExito = '';
  fotoSeleccionada: File | null = null;
  fotoPreview: string | null = null;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.loading = true;
    this.usuarioService.getPerfil().subscribe({
      next: (data) => { this.usuario = data; this.loading = false; },
      error: () => { this.mensajeError = 'Error al cargar perfil'; this.loading = false; }
    });
  }

  toggleEdit(): void { this.editando = !this.editando; if (!this.editando) this.cargarPerfil(); }

  guardarPerfil(): void {
    this.loading = true;
    this.usuarioService.actualizarPerfil({
      nombreCompleto: this.usuario.nombreCompleto,
      correo: this.usuario.correo,
      telefono: this.usuario.telefono
    }).subscribe({
      next: () => { this.mensajeExito = 'Perfil actualizado'; this.editando = false; this.loading = false; setTimeout(() => this.mensajeExito = '', 3000); },
      error: () => { this.mensajeError = 'Error al actualizar'; this.loading = false; }
    });
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.fotoSeleccionada = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => this.fotoPreview = e.target.result;
      reader.readAsDataURL(this.fotoSeleccionada);
    }
  }

  subirFoto(): void {
    if (!this.fotoSeleccionada) return;
    this.loading = true;
    this.usuarioService.actualizarFoto(this.fotoSeleccionada).subscribe({
      next: (fotoUrl) => {
        this.usuario.fotoPerfil = fotoUrl;
        this.fotoPreview = null;
        this.fotoSeleccionada = null;
        this.mensajeExito = 'Foto actualizada';
        this.loading = false;
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: () => { this.mensajeError = 'Error al subir foto'; this.loading = false; }
    });
  }

  logout(): void { this.authService.logout(); this.router.navigate(['/']); }
  goToExcel(): void { this.router.navigate(['/excel']); }
  goToGenerador(): void { this.router.navigate(['/dashboard-admin']); }
  goToUsuarios(): void { this.router.navigate(['/dashboard-user']); }
}