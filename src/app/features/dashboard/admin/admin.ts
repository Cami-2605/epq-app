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
   this.router.navigate(['/dashboard-user']);
  }

  goToExcel() {
    this.router.navigate(['/excel']);
  }

   async generarReporte() {

  if (!this.municipio || !this.tipoReporte || !this.tipoArchivo) {
    alert('Completa los campos obligatorios');
    return;
  }

  if (!this.archivoSeleccionado) {
    alert('Selecciona un archivo primero');
    return;
  }

  const body = {
    nombreArchivo: this.archivoSeleccionado,
    tipoFuente: 'extra',

    municipio: this.municipio,
    periodo: this.periodo,
    fechaInicio: this.fechaInicio,
    fechaFin: this.fechaFin,
    tipoReporte: this.tipoReporte,
    tipoArchivo: this.tipoArchivo.toLowerCase()
  };

  try {
    const res = await fetch('http://localhost:8080/api/reportes/generar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Error HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `reporte.${this.tipoArchivo.toLowerCase()}`;

    a.click();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generando reporte:', error);
    alert('No se pudo generar el reporte. Verifica el archivo seleccionado y los filtros.');
  }
  }

  archivos: any[] = [];
  archivoSeleccionado: string | null = null;

  ngOnInit() {
  fetch('http://localhost:8080/api/excel')
    .then(res => res.json())
    .then(data => this.archivos = data);
  }

    getNombreArchivo(file: any): string {
    return file?.nombreArchivo ?? file?.name ?? '';
  }

  toggleArchivo(nombre: string) {
    if (!nombre) {
      return;
    } if (this.archivoSeleccionado === nombre) {
      this.archivoSeleccionado = null;
      return;
    }

    this.archivoSeleccionado = nombre;
  }
}
