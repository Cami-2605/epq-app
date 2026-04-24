import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class LoginComponent {

  username     = '';
  password     = '';
  showPassword = false;
  loading      = false;
  errors: { username?: string; password?: string } = {};

  constructor(private router: Router, private auth: AuthService) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  private validate(): boolean {
    this.errors = {};
    if (!this.username.trim()) this.errors.username = 'El usuario es obligatorio';
    if (!this.password)        this.errors.password = 'La contraseña es obligatoria';
    return Object.keys(this.errors).length === 0;
  }

  login() {
    if (!this.validate()) return;

    this.loading = true;

    fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.username, password: this.password })
    })
    .then(res => {
      if (!res.ok) throw new Error('Credenciales incorrectas');
      return res.json();
    })
    .then((data: { token: string; role: string; user: any }) => {
      this.auth.saveSession(data.token, data.role, data.user);

      if (data.role === 'admin') {
        this.router.navigate(['/dashboard-admin']);
      } else {
        this.router.navigate(['/dashboard-user']);
      }
    })
    .catch((err: Error) => {
      this.errors.password = err.message || 'Error al iniciar sesión';
    })
    .finally(() => {
      this.loading = false;
    });
  }
}
