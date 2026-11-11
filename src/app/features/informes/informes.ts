import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InformeService } from '../../core/services/informe.service';
import { FacturaService } from '../../core/services/factura.service';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { FiltroInforme, TipoInforme } from '../../core/models/informe';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informes.html',
  styleUrls: ['./informes.css']
})
export class InformesComponent implements OnInit {

  // Tipo de informe a generar
  tipoInforme: TipoInforme = 'DEUDORES_MOROSOS';

  // Filtros comunes
  fechaInicio = '';
  fechaFin = '';
  municipiosSeleccionados: string[] = [];
  estratosSeleccionados: number[] = [];

  // Opciones específicas
  topN = 40;
  mesesBase = 2;
  mesesFuturos = 3;
  formato: 'xlsx' | 'pdf' = 'xlsx';

  // Datos de combos
  municipiosDisponibles: string[] = [];
  archivosNombres: string[] = [];
  archivosSeleccionados: string[] = [];
  usuarioFoto = '';

  // Estados
  loading = false;
  error = '';
  success = '';

  tiposInforme: { valor: TipoInforme; etiqueta: string }[] = [
    { valor: 'DEUDORES_MOROSOS',  etiqueta: 'Deudores Morosos' },
    { valor: 'TOTALES_MUNICIPIO', etiqueta: 'Totales por Municipio' },
    { valor: 'TOTALES_ESTRATO',   etiqueta: 'Totales por Estrato' },
    { valor: 'CARTERA_ACUMULADA', etiqueta: 'Cartera Morosa Acumulada' },
    { valor: 'RECAUDO_SERVICIO',  etiqueta: 'Recaudo por Servicio' },
    { valor: 'PROYECCION',        etiqueta: 'Proyección de Recaudo' },
  ];

  constructor(
    private router: Router,
    private informeService: InformeService,
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
      next: (user) => this.usuarioFoto = user.fotoPerfil ?? '',
      error: () => {}
    });
  }

  async cargarDatosIniciales(): Promise<void> {
    try {
      const [municipios, archivos] = await Promise.all([
        firstValueFrom(this.facturaService.getMunicipios()),
        firstValueFrom(this.facturaService.getArchivosExcel())
      ]);
      this.municipiosDisponibles = municipios || [];
      this.archivosNombres = (archivos || []).map((a: any) => a.nombreArchivo);
      if (this.municipiosDisponibles.length) {
        this.municipiosSeleccionados = [...this.municipiosDisponibles];
      }
    } catch {
      // No mostrar error si los combos fallan
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

  toggleArchivo(nombre: string): void {
    const idx = this.archivosSeleccionados.indexOf(nombre);
    if (idx === -1) this.archivosSeleccionados.push(nombre);
    else this.archivosSeleccionados.splice(idx, 1);
  }

  async generarInforme(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.success = '';

    const filtros: FiltroInforme = {
      tipoInforme: this.tipoInforme,
      municipios: this.municipiosSeleccionados.length > 0 ? this.municipiosSeleccionados : null,
      estratos: this.estratosSeleccionados.length > 0 ? this.estratosSeleccionados : null,
      nombreArchivos: this.archivosSeleccionados.length > 0 ? this.archivosSeleccionados : null,
      fechaInicio: this.fechaInicio || null,
      fechaFin: this.fechaFin || null,
      topN: this.topN,
      mesesBase: this.mesesBase,
      mesesFuturos: this.mesesFuturos,
      formato: this.formato
    };

    try {
      const blob = await firstValueFrom(this.informeService.generar(filtros));

      if (!blob) throw new Error('No se recibió el archivo');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = this.formato === 'pdf' ? 'pdf' : 'xlsx';
      const tipo = this.tipoInforme.toLowerCase().replace(/_/g, '-');
      a.download = `informe_epq_${tipo}_${Date.now()}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.success = 'Informe generado exitosamente';
      setTimeout(() => this.success = '', 4000);
    } catch (err: any) {
      console.error('Error generando informe:', err);

      if (err.error instanceof Blob) {
        try {
          const text = await err.error.text();
          const jsonError = JSON.parse(text);
          // Usar ApiErrorDto: codigo, mensaje, detalle
          this.error = jsonError.mensaje || jsonError.message || text;
          if (jsonError.detalle) {
            console.error('Detalle error [' + (jsonError.codigo || '') + ']:', jsonError.detalle);
          }
        } catch {
          this.error = err.message || 'Error al generar el informe';
        }
      } else if (err.error?.mensaje) {
        this.error = err.error.mensaje;
      } else {
        this.error = err.message || 'Error al generar el informe';
      }

      setTimeout(() => this.error = '', 8000);
    } finally {
      this.loading = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToExcel(): void { this.router.navigate(['/excel']); }
  goToGenerador(): void { this.router.navigate(['/dashboard-admin']); }
  goToUsuarios(): void { this.router.navigate(['/dashboard-user']); }
  goToPerfil(): void { this.router.navigate(['/perfil']); }
}
