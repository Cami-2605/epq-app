import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FacturaService } from '../../../core/services/factura.service';
import { AuthService } from '../../../core/services/auth.service';
import { FiltroReporte } from '../../../core/models/filtro-reporte';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {
  municipiosSeleccionados: string[] = [];
  fechaInicio: string = '';
  fechaFin: string = '';
  estrato: number | null = null;
  soloMorosos: boolean = false;
  ordenarPor: string = 'fecha';
  ordenDireccion: string = 'DESC';
  agruparPorMunicipio: boolean = true;
  agruparPorMes: boolean = false;
  tipoArchivo: string = 'excel';
  tipoFuente: string = 'extra';

  municipiosDisponibles: string[] = [];
  estratosDisponibles: number[] = [];
  archivosExcel: any[] = [];
  archivoSeleccionado: any = null;

  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(
    private router: Router,
    private facturaService: FacturaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  async cargarDatosIniciales(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const [municipios, estratos, archivos] = await Promise.all([
        this.facturaService.getMunicipios().toPromise(),
        this.facturaService.getEstratos().toPromise(),
        this.facturaService.getArchivosExcel().toPromise()
      ]);
      
      this.municipiosDisponibles = municipios || [];
      this.estratosDisponibles = estratos || [];
      this.archivosExcel = archivos || [];
      
      if (this.municipiosDisponibles.length > 0) {
        this.municipiosSeleccionados = [...this.municipiosDisponibles];
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.error = 'Error al cargar datos iniciales. Verifica que el backend esté corriendo.';
    } finally {
      this.loading = false;
    }
  }

  toggleMunicipio(municipio: string): void {
    const index = this.municipiosSeleccionados.indexOf(municipio);
    if (index === -1) {
      this.municipiosSeleccionados.push(municipio);
    } else {
      this.municipiosSeleccionados.splice(index, 1);
    }
  }

  seleccionarTodosMunicipios(): void {
    this.municipiosSeleccionados = [...this.municipiosDisponibles];
  }

  limpiarMunicipios(): void {
    this.municipiosSeleccionados = [];
  }

  async generarReporte(): Promise<void> {
    this.error = '';
    this.success = '';

    if (!this.archivoSeleccionado) {
      this.error = 'Debe seleccionar un Excel';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    if (this.municipiosSeleccionados.length === 0) {
      this.error = 'Debe seleccionar al menos un municipio';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    if (this.fechaInicio && this.fechaFin && this.fechaInicio > this.fechaFin) {
      this.error = 'La fecha inicio no puede ser mayor a la fecha fin';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    const filtros: FiltroReporte = {
      municipios: this.municipiosSeleccionados,
      fechaInicio: this.fechaInicio || null,
      fechaFin: this.fechaFin || null,
      estrato: this.estrato,
      estratos: null,
      mesesReferencia: null,
      nombreArchivos: null,
      agruparPorEstrato: false,
      ambosFormatos: false,
      mostrarDetallePorVivienda: false,
      mostrarTotalesPorEstrato: false,
      mostrarTotalesPorMunicipio: false,
      barrio: null,
      estadoPago: this.soloMorosos ? 'MOROSO' : null,
      ordenarPor: this.ordenarPor,
      ordenDireccion: this.ordenDireccion,
      tiposReporte: null,
      incluirMora: true,
      agruparPorMunicipio: this.agruparPorMunicipio,
      agruparPorMes: this.agruparPorMes,
      soloMorosos: this.soloMorosos,
      valorMinimo: null,
      valorMaximo: null,
      tipoArchivo: this.tipoArchivo,
      nombreArchivo: this.archivoSeleccionado?.nombreArchivo || this.archivoSeleccionado?.name,
      tipoFuente: this.tipoFuente
    };

    this.loading = true;

    try {
      const blob = await this.facturaService.generarReporte(filtros).toPromise();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const extension = this.tipoArchivo === 'pdf' ? 'pdf' : 'xlsx';
      const fecha = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      a.download = `reporte_${this.municipiosSeleccionados[0]}_${fecha}.${extension}`;
      a.href = url;
      a.click();
      window.URL.revokeObjectURL(url);
      
      this.success = 'Reporte generado exitosamente';
      setTimeout(() => this.success = '', 3000);
    } catch (error: any) {
      console.error(error);
      this.error = error.error?.message || 'Error al generar el reporte';
      setTimeout(() => this.error = '', 5000);
    } finally {
      this.loading = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToExcel(): void {
    this.router.navigate(['/excel']);
  }

  goToUsuarios(): void {
    this.router.navigate(['/dashboard-user']);
  }

  getNombreArchivo(file: any): string {
    return file?.nombreArchivo || file?.name || 'Sin nombre';
  }
}