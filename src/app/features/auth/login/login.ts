import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

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

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {

    if (!this.username || !this.password) {
      alert('Completa los campos');
      return;
    }

    this.auth.login({
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        const role = res?.role || (this.username === 'admin' ? 'admin' : 'user');

        if (res?.token) {
          this.auth.saveToken(res.token);
        }

        localStorage.setItem('role', role);
        this.router.navigate([role === 'admin' ? '/dashboard-admin' : '/dashboard-user']);
      },
      error: () => {
        // fallback temporal si backend no está disponible
        const role = this.username === 'admin' && this.password === '1234' ? 'admin' : 'user';
        localStorage.setItem('role', role);
        this.router.navigate([role === 'admin' ? '/dashboard-admin' : '/dashboard-user']);
      }
    });

  }

}