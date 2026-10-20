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

  username: string = '';
  password: string = '';
  showPassword: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.errorMessage = '';

    this.auth.login(this.username, this.password).subscribe({
      next: (perfil: any) => {
        console.log('Login exitoso, perfil:', perfil);
        // auth.service ya guardó el token y el rol en localStorage
        const role = this.auth.getRole() || 'user';
        this.router.navigate([role === 'admin' ? '/dashboard-admin' : '/dashboard-user']);
      },
      error: (err) => {
        console.error('Error de login:', err);
        this.errorMessage = 'Su usuario o contraseña son incorrectos';
      }
    });
  }
}