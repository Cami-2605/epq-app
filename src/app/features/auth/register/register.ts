import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  nombre = '';
  telefono = '';
  correo = '';
  cedula = '';
  username = '';
  password = '';
  errorMessage = '';
  loading = false;

  defaultImage =
    'https://res.cloudinary.com/dmjww2gh5/image/upload/v1765379696/descarga_1_jgxs8e.jpg';

  imagePreview: any = null;
  selectedFile: any = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  register() {
    if (!this.nombre || !this.username || !this.password) {
      this.errorMessage = 'Por favor, complete todos los campos obligatorios';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Mapea RegisterRequest → UsuarioDto (campos que el backend espera)
    const payload = {
      nombreCompleto: this.nombre,
      correo: this.correo,
      telefono: this.telefono,
      cedula: this.cedula,
      username: this.username,
      password: this.password
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        // Intentar leer ApiErrorDto
        const body = err?.error;
        if (typeof body === 'string') {
          this.errorMessage = body;
        } else if (body?.mensaje) {
          this.errorMessage = body.mensaje;
        } else if (body?.codigo === 'ERR_503') {
          this.errorMessage = 'El nombre de usuario ya está en uso';
        } else if (body?.codigo === 'ERR_504') {
          this.errorMessage = 'El correo electrónico ya está registrado';
        } else {
          this.errorMessage = 'Error al registrar usuario. Intente nuevamente.';
        }
      }
    });
  }
}
