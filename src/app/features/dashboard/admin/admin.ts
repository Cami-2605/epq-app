import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FacturaService } from '../../../core/services/factura.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { FiltroReporte } from '../../../core/models/filtro-reporte';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {
  // Filtros básicos
  municipiosSeleccionados: string[] = [];
  fechaInicio = '';
  fechaFin = '';
  estrato: number | null = null;
  soloMorosos = false;
  ordenarPor = 'fecha';
  ordenDireccion = 'DESC';
  agruparPorMunicipio = false;
  agruparPorMes = false;
  tipoArchivo = 'excel';
  tipoFuente = 'extra';

  // Nuevos filtros avanzados
  estratosSeleccionados: number[] = [];
  mesesSeleccionados: string[] = [];
  archivosSeleccionados: string[] = [];
  agruparPorEstrato = false;
  ambosFormatos = false;

  // Reportes avanzados
  mostrarDetallePorVivienda = false;
  mostrarTotalesPorEstrato = false;
  mostrarTotalesPorMunicipio = false;

  // Datos
  municipiosDisponibles: string[] = [];
  estratosDisponibles: number[] = [1, 2, 3, 4, 5, 6];
  mesesDisponibles: string[] = [];
  archivosExcel: any[] = [];
  archivoSeleccionado: any = null;
  usuarioFoto = '';

  // Estados
  loading = false;
  error = '';
  success = '';

  constructor(
    private router: Router,
    private facturaService: FacturaService,
    public authService: AuthService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.cargarFotoUsuario();
  }

  cargarFotoUsuario(): void {
    this.usuarioService.getPerfil().subscribe({
      next: (user) => this.usuarioFoto = user.fotoPerfil,
      error: () => {}
    });
  }

  async cargarDatosIniciales(): Promise<void> {
    this.loading = true;
    try {
      const [municipios, archivos, meses] = await Promise.all([
        firstValueFrom(this.facturaService.getMunicipios()),
        firstValueFrom(this.facturaService.getArchivosExcel()),
        firstValueFrom(this.facturaService.getMeses())
      ]);
      this.municipiosDisponibles = municipios || [];
      this.archivosExcel = archivos || [];
      this.mesesDisponibles = meses || [];
      if (this.municipiosDisponibles.length) {
        this.municipiosSeleccionados = [...this.municipiosDisponibles];
      }
    } catch (error) {
      this.error = 'Error al cargar datos';
      setTimeout(() => this.error = '', 5000);
    } finally {
      this.loading = false;
    }
  }

  toggleMunicipio(municipio: string): void {
    const idx = this.municipiosSeleccionados.indexOf(municipio);
    if (idx === -1) this.municipiosSeleccionados.push(municipio);
    else this.municipiosSeleccionados.splice(idx, 1);
  }

  seleccionarTodosMunicipios(): void {
    this.municipiosSeleccionados = [...this.municipiosDisponibles];
  }

  limpiarMunicipios(): void {
    this.municipiosSeleccionados = [];
  }

  toggleEstrato(e: number): void {
    const idx = this.estratosSeleccionados.indexOf(e);
    if (idx === -1) this.estratosSeleccionados.push(e);
    else this.estratosSeleccionados.splice(idx, 1);
  }

  toggleMes(mes: string): void {
    const idx = this.mesesSeleccionados.indexOf(mes);
    if (idx === -1) this.mesesSeleccionados.push(mes);
    else this.mesesSeleccionados.splice(idx, 1);
  }

  toggleArchivoFiltro(archivo: any): void {
    const nombre = archivo?.nombreArchivo || archivo?.name;
    const idx = this.archivosSeleccionados.indexOf(nombre);
    if (idx === -1) this.archivosSeleccionados.push(nombre);
    else this.archivosSeleccionados.splice(idx, 1);
  }

  seleccionarArchivo(file: any): void {
    this.archivoSeleccionado = file;
    if (file && file.tipo) {
      this.tipoFuente = file.tipo;
    }
  }

  async generarReporte(): Promise<void> {
    if (!this.archivoSeleccionado && this.archivosSeleccionados.length === 0) {
      this.error = 'Seleccione al menos un archivo fuente';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    if (this.municipiosSeleccionados.length === 0) {
      this.error = 'Seleccione al menos un municipio';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    if (this.fechaInicio && this.fechaFin && this.fechaInicio > this.fechaFin) {
      this.error = 'La fecha inicio no puede ser mayor a la fecha fin';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    // Determinar nombre de archivo único (compatibilidad hacia atrás)
    const nombreArchivoUnico = this.archivoSeleccionado
      ? (this.archivoSeleccionado?.nombreArchivo || this.archivoSeleccionado?.name)
      : null;

    // Determinar lista de archivos para filtro múltiple
    const nombreArchivos = this.archivosSeleccionados.length > 0
      ? this.archivosSeleccionados
      : (nombreArchivoUnico ? [nombreArchivoUnico] : null);

    const filtros: FiltroReporte = {
      municipios: this.municipiosSeleccionados.filter(m => m && m.trim()),
      fechaInicio: this.fechaInicio || null,
      fechaFin: this.fechaFin || null,
      estrato: this.estrato,
      estratos: this.estratosSeleccionados.length > 0 ? this.estratosSeleccionados : null,
      mesesReferencia: this.mesesSeleccionados.length > 0 ? this.mesesSeleccionados : null,
      nombreArchivos,
      agruparPorEstrato: this.agruparPorEstrato,
      ambosFormatos: this.ambosFormatos,
      barrio: null,
      estadoPago: null,
      soloMorosos: this.soloMorosos,
      ordenarPor: this.ordenarPor,
      ordenDireccion: this.ordenDireccion,
      agruparPorMunicipio: this.agruparPorMunicipio,
      agruparPorMes: this.agruparPorMes,
      mostrarDetallePorVivienda: this.mostrarDetallePorVivienda,
      mostrarTotalesPorEstrato: this.mostrarTotalesPorEstrato,
      mostrarTotalesPorMunicipio: this.mostrarTotalesPorMunicipio,
      valorMinimo: null,
      valorMaximo: null,
      tipoArchivo: this.tipoArchivo,
      nombreArchivo: nombreArchivoUnico,
      tiposReporte: null,
      incluirMora: false,
      tipoFuente: this.tipoFuente,
    };

    console.log('Enviando filtros:', JSON.stringify(filtros, null, 2));

    this.loading = true;
    this.error = '';
    this.success = '';

    try {
      // Bifurcación: si ambosFormatos, llamar al endpoint ZIP
      const blob = this.ambosFormatos
        ? await firstValueFrom(this.facturaService.generarReporteAmbos(filtros))
        : await firstValueFrom(this.facturaService.generarReporte(filtros));

      if (!blob) throw new Error('No se recibió el archivo');

      if (blob.type === 'application/json' || blob.size < 100) {
        const text = await blob.text();
        if (text && (text.includes('error') || text.includes('Error'))) {
          throw new Error(text);
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = this.ambosFormatos ? 'zip' : (this.tipoArchivo === 'pdf' ? 'pdf' : 'xlsx');
      const base = this.municipiosSeleccionados[0] || 'reporte';
      a.download = `reporte_${base}_${Date.now()}.${extension}`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.success = this.ambosFormatos
        ? 'ZIP con ambos formatos generado exitosamente'
        : 'Reporte generado exitosamente';
      setTimeout(() => this.success = '', 3000);
    } catch (err: any) {
      console.error('Error completo:', err);

      let errorMessage = 'Error al generar el reporte';

      if (err.error instanceof Blob) {
        try {
          const text = await err.error.text();
          console.error('Mensaje del servidor:', text);
          try {
            const jsonError = JSON.parse(text);
            errorMessage = jsonError.message || jsonError.error || text;
          } catch {
            errorMessage = text || 'Error desconocido del servidor';
          }
        } catch (e) {
          errorMessage = err.message || 'Error desconocido';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      this.error = errorMessage;
      setTimeout(() => this.error = '', 8000);
    } finally {
      this.loading = false;
    }
  }

  getNombreArchivo(file: any): string {
    return file?.nombreArchivo || file?.name || 'Sin nombre';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToExcel(): void {
    this.router.navigate(['/excel']);
  }

  goToGenerador(): void {
    this.router.navigate(['/dashboard-admin']);
  }

  goToUsuarios(): void {
    this.router.navigate(['/dashboard-user']);
  }

  goToPerfil(): void {
    this.router.navigate(['/perfil']);
  }
}