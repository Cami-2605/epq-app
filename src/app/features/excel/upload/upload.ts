import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.css']
})
export class UploadComponent {

  constructor(private router: Router) {}

  selectedFile: File | null = null;

  files: any[] = [];

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

uploadFile() {

  if (!this.selectedFile) {
    alert('Selecciona un archivo');
    return;
  }

  const formData = new FormData();
  formData.append('archivo', this.selectedFile);

  fetch('http://localhost:8080/api/excel/cargar', {
    method: 'POST',
    body: formData
  })
  .then(() => {
    alert('Archivo subido correctamente');
    this.loadFiles(); // 🔥 recargar lista
  })
  .catch(() => {
    alert('Error al subir archivo');
  });
}
  deleteFile(file: any) {
    this.files = this.files.filter(f => f.id !== file.id);
  }

  viewFile(file: any) {
    alert('Vista previa no implementada aún');
  }

  downloadFile(file: any) {
    alert('Aquí se descargará el archivo');
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
  
  loadFiles() {
  fetch('http://localhost:8080/api/excel')
    .then(res => res.json())
    .then(data => this.files = data);
  }

  ngOnInit() {
    this.loadFiles();
  }
}