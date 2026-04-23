import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  username = '';
  password = '';

  defaultImage =
  'https://res.cloudinary.com/dmjww2gh5/image/upload/v1765379696/descarga_1_jgxs8e.jpg';

  imagePreview: any = null;
  selectedFile: any = null;

  constructor(private router: Router) {}

  onFileSelected(event: any) {

  const file = event.target.files[0];

  if (!file) return;

  this.selectedFile = file;

  const reader = new FileReader();

  reader.onload = (e: any) => {
    this.imagePreview = e.target.result;
  };

  reader.readAsDataURL(file);

  // reinicia el input para permitir subir otra imagen
  event.target.value = '';

}

  register() {

    if (!this.nombre || !this.username || !this.password) {
      alert('Completa los campos obligatorios');
      return;
    }

    console.log({
      nombre: this.nombre,
      telefono: this.telefono,
      correo: this.correo,
      username: this.username,
      password: this.password,
      foto: this.selectedFile
    });

    alert('Registro exitoso');

    this.router.navigate(['/']);

  }

}