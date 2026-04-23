import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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

  constructor(private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {

    if (!this.username || !this.password) {
      alert('Completa los campos');
      return;
    }

    let role = '';

    // 🔐 admin simulado
    if (this.username === 'admin' && this.password === '1234') {
      role = 'admin';
    } else {
      role = 'user';
    }

    // guardar rol
    localStorage.setItem('role', role);

    // redirección
    if (role === 'admin') {
      this.router.navigate(['/dashboard-admin']);
    } else {
      this.router.navigate(['/dashboard-user']);
    }

  }

}