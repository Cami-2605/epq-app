import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent {

  constructor(private router: Router) {}

  municipio: string = '';
  periodo: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';
  tipoReporte: string = '';
  tipoArchivo: string = '';

  municipios: string[] = [
    'Buenavista',
    'Circasia',
    'Filandia',
    'Génova',
    'La Tebaida',
    'Montenegro',
    'Pijao',
    'Salento',
    'Quimbaya',
    'Córdoba'
  ];

  periodos: string[] = [
    'Mensual',
    'Trimestral',
    'Semestral',
    'Anual'
  ];

  tiposReporte: string[] = [
    'Consumo',
    'Facturación',
    'Usuarios',
    'General'
  ];

  tiposArchivo: string[] = [
    'PDF',
    'Excel'
  ];

  logout() {
    localStorage.removeItem('role');
    this.router.navigate(['/']);
  }

  goToReportes() {
    this.router.navigate(['/reportes']);
  }

  goToUsuarios() {
    alert('Módulo de usuarios en construcción');
  }

  goToExcel() {
    this.router.navigate(['/excel']);
  }

  generarReporte() {

  if (!this.municipio || !this.tipoReporte || !this.tipoArchivo) {
    alert('Completa los campos obligatorios');
    return;
  }

  if (!this.archivosSeleccionados) {
    alert('Selecciona un archivo primero');
    return;
  }

  const body = {
    nombreArchivo: this.archivosSeleccionados,
    tipoFuente: 'extra',

    municipio: this.municipio,
    periodo: this.periodo,
    fechaInicio: this.fechaInicio,
    fechaFin: this.fechaFin,
    tipoReporte: this.tipoReporte,
    tipoArchivo: this.tipoArchivo.toLowerCase()
  };

  fetch('http://localhost:8080/api/reportes/generar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  .then(res => res.blob())
  .then(blob => {

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `reporte.${this.tipoArchivo.toLowerCase()}`;

    a.click();
  })
  .catch(() => {
    alert('Error generando reporte');
  });
  }

  archivos: any[] = [];
  archivosSeleccionados: string[] = [];

  ngOnInit() {
  fetch('http://localhost:8080/api/excel')
    .then(res => res.json())
    .then(data => this.archivos = data);
  }

  toggleArchivo(nombre: string) {

  if (this.archivosSeleccionados.includes(nombre)) {
    this.archivosSeleccionados =
      this.archivosSeleccionados.filter(a => a !== nombre);
    } else {
      this.archivosSeleccionados.push(nombre);
    }
  }
}