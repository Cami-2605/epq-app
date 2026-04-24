import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user.html',
  styleUrls: ['./user.css']
})
export class UserComponent {
  constructor(private router: Router) {}

  users = [
    { nombre: 'Juan Camilo Rojas', cedula: '1090112233', correo: 'juan@epq.com', telefono: '3101112233' },
    { nombre: 'Maria Paula Leon', cedula: '1090887766', correo: 'maria@epq.com', telefono: '3119977665' },
    { nombre: 'Carlos Andres Soto', cedula: '1542044766', correo: 'carlos@epq.com', telefono: '3126678990' },
    { nombre: 'Laura Jimenez', cedula: '1099123344', correo: 'laura@epq.com', telefono: '3154412299' },
    { nombre: 'Pedro Diaz', cedula: '923334449', correo: 'pedro@epq.com', telefono: '3165500441' }
  ];

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