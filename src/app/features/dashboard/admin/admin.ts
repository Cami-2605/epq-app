import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FacturaService, ResultadoCarga } from '../../../core/services/factura.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { InformeService } from '../../../core/services/informe.service';
import { FiltroReporte } from '../../../core/models/filtro-reporte';
import { FiltroInforme, TipoInforme } from '../../../core/models/informe';
import { Usuario } from '../../../core/models/usuario';

interface ArchivoExcel {
  id: number;
  nombreArchivo: string;
  peso: number;
  fechaCarga: string;
  tipo: string;
  registrosProcesados: number;
  registrosFallidos: number;
  estado: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {

  // ── Tab state ──────────────────────────────────────────────────────────────
  activeTab: string = 'upload';

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  // ── Shared / layout ────────────────────────────────────────────────────────
  usuarioFoto = '';

  // ── Reporte tab — filtros básicos ──────────────────────────────────────────
  municipiosSeleccionados: string[] = [];
  fechaInicio = '';
  fechaFin = '';
  estrato: number | null = null;
  soloMorosos = false;
  ordenarPor = 'fecha';
  ordenDireccion = 'DESC';
  agruparPorMunicipio = false;
  agruparPorMes = false;
  tipoArchivo = 'xlsx';
  tipoFuente = 'extra';

  // Reporte tab — filtros avanzados
  estratosSeleccionados: number[] = [];
  mesesSeleccionados: string[] = [];
  archivosSeleccionados: string[] = [];
  agruparPorEstrato = false;
  ambosFormatos = false;

  // Reporte tab — secciones avanzadas
  mostrarDetallePorVivienda = false;
  mostrarTotalesPorEstrato = false;
  mostrarTotalesPorMunicipio = false;

  // Reporte tab — datos
  municipiosDisponibles: string[] = [];
  estratosDisponibles: number[] = [1, 2, 3, 4, 5, 6];
  mesesDisponibles: string[] = [];
  archivosExcel: ArchivoExcel[] = [];
  archivoSeleccionado: any = null;

  // Reporte tab — estados
  loading = false;
  error = '';
  success = '';

  // ── Upload tab ─────────────────────────────────────────────────────────────
  selectedFiles: File[] = [];
  uploading = false;
  tipoFuente_upload: string = 'extra';
  mensajeError = '';
  mensajeExito = '';

  // ── Informes tab ───────────────────────────────────────────────────────────
  tipoInforme: TipoInforme = 'DEUDORES_MOROSOS';
  archivosNombres: string[] = [];
  archivosSeleccionados_informes: string[] = [];
  topN = 40;
  mesesBase = 2;
  mesesFuturos = 3;
  formato: 'xlsx' | 'pdf' = 'xlsx';

  tiposInforme: { valor: TipoInforme; etiqueta: string }[] = [
    { valor: 'DEUDORES_MOROSOS',  etiqueta: 'Deudores Morosos' },
    { valor: 'TOTALES_MUNICIPIO', etiqueta: 'Totales por Municipio' },
    { valor: 'TOTALES_ESTRATO',   etiqueta: 'Totales por Estrato' },
    { valor: 'CARTERA_ACUMULADA', etiqueta: 'Cartera Morosa Acumulada' },
    { valor: 'RECAUDO_SERVICIO',  etiqueta: 'Recaudo por Servicio' },
    { valor: 'PROYECCION',        etiqueta: 'Proyeccion de Recaudo' },
  ];

  // Informes tab — estados
  informes_loading = false;
  informes_error = '';
  informes_success = '';

  // Informes tab — shared filters (re-use municipiosDisponibles from reporte)
  informes_municipiosSeleccionados: string[] = [];
  informes_estratosSeleccionados: number[] = [];
  informes_fechaInicio = '';
  informes_fechaFin = '';

  // ── Usuarios tab ───────────────────────────────────────────────────────────
  users: Usuario[] = [];
  usuarios_loading = false;
  usuarios_error = '';
  usuarios_success = '';
  showCrearUsuario = false;
  nuevoUsuario = { nombreCompleto: '', username: '', correo: '', telefono: '', cedula: '', password: '', rol: 'user' };

  constructor(
    private router: Router,
    private facturaService: FacturaService,
    public authService: AuthService,
    private usuarioService: UsuarioService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.cargarFotoUsuario();
    this.cargarUsuarios();
  }

  cargarFotoUsuario(): void {
    this.usuarioService.getPerfil().subscribe({
      next: (user) => this.usuarioFoto = user.fotoPerfil ?? '',
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
      this.archivosNombres = (archivos || []).map((a: any) => a.nombreArchivo);
      if (this.municipiosDisponibles.length) {
        this.municipiosSeleccionados = [...this.municipiosDisponibles];
        this.informes_municipiosSeleccionados = [...this.municipiosDisponibles];
      }
    } catch {
      this.error = 'Error al cargar datos';
      setTimeout(() => this.error = '', 5000);
    } finally {
      this.loading = false;
    }
  }

  // ── Reporte tab methods ────────────────────────────────────────────────────

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

    const nombreArchivoUnico = this.archivoSeleccionado
      ? (this.archivoSeleccionado?.nombreArchivo || this.archivoSeleccionado?.name)
      : null;

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

    this.loading = true;
    this.error = '';
    this.success = '';

    try {
      const blob = this.ambosFormatos
        ? await firstValueFrom(this.facturaService.generarReporteAmbos(filtros))
        : await firstValueFrom(this.facturaService.generarReporte(filtros));

      if (!blob) throw new Error('No se recibio el archivo');

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
          try {
            const jsonError = JSON.parse(text);
            errorMessage = jsonError.mensaje || jsonError.message || jsonError.error || text;
            if (jsonError.detalle) {
              console.error('Detalle error [' + (jsonError.codigo || '') + ']:', jsonError.detalle);
            }
          } catch {
            errorMessage = text || 'Error desconocido del servidor';
          }
        } catch {
          errorMessage = err.message || 'Error desconocido';
        }
      } else if (err.error?.mensaje) {
        errorMessage = err.error.mensaje;
        if (err.error.detalle) {
          console.error('Detalle error [' + (err.error.codigo || '') + ']:', err.error.detalle);
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

  // ── Upload tab methods ─────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const validos: File[] = [];
      const invalidos: string[] = [];

      Array.from(input.files).forEach(file => {
        const fileName = file.name.toLowerCase();
        const isValid = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.pdf');
        if (isValid) {
          validos.push(file);
        } else {
          invalidos.push(file.name);
        }
      });

      if (invalidos.length > 0) {
        this.mensajeError = `Archivos no permitidos: ${invalidos.join(', ')}. Solo se permiten .pdf, .xlsx, .xls`;
        setTimeout(() => this.mensajeError = '', 5000);
      } else {
        this.mensajeError = '';
      }

      this.selectedFiles = validos;
    }
  }

  async uploadFile(): Promise<void> {
    if (!this.selectedFiles.length) {
      this.mensajeError = 'Selecciona al menos un archivo primero';
      return;
    }

    this.uploading = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    try {
      let respuesta: ResultadoCarga | undefined;

      if (this.selectedFiles.length === 1) {
        respuesta = await firstValueFrom(
          this.facturaService.cargarExcel(this.selectedFiles[0], this.tipoFuente_upload)
        ) as ResultadoCarga;
        const r = respuesta as ResultadoCarga;
        this.mensajeExito = r?.mensaje || `${r?.totalRegistrosProcesados ?? 0} registros procesados correctamente`;
      } else {
        respuesta = await firstValueFrom(
          this.facturaService.cargarMultiplesArchivos(this.selectedFiles, this.tipoFuente_upload)
        ) as ResultadoCarga;
        const r = respuesta as ResultadoCarga;
        this.mensajeExito = r?.mensaje || `${r?.totalRegistrosProcesados ?? 0} registros procesados`;
      }

      this.selectedFiles = [];

      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      await this.cargarArchivos();

      setTimeout(() => this.mensajeExito = '', 5000);

    } catch (error: any) {
      if (error.status === 0) {
        this.mensajeError = 'No se puede conectar al servidor.';
      } else if (error.status === 400) {
        const body = error.error;
        const detail = typeof body === 'string'
          ? body
          : body?.detalle || body?.mensaje || 'Error al procesar el archivo.';
        this.mensajeError = detail;
      } else if (error.status === 413) {
        this.mensajeError = 'El archivo es demasiado grande. Maximo 50MB.';
      } else if (error.status === 500) {
        const body = error.error;
        const detail = typeof body === 'string'
          ? body
          : body?.mensaje || 'Error interno del servidor.';
        this.mensajeError = detail;
      } else {
        const body = error.error;
        const detail = body?.mensaje || body?.detalle || 'Error al cargar el archivo.';
        this.mensajeError = detail;
      }

      setTimeout(() => this.mensajeError = '', 8000);
    } finally {
      this.uploading = false;
    }
  }

  async cargarArchivos(): Promise<void> {
    try {
      this.archivosExcel = await firstValueFrom(this.facturaService.getArchivosExcel()) || [];
      this.archivosNombres = this.archivosExcel.map((a: any) => a.nombreArchivo);
    } catch {
      this.mensajeError = 'Error al cargar la lista de archivos';
      setTimeout(() => this.mensajeError = '', 3000);
    }
  }

  async eliminarArchivoExcel(archivo: ArchivoExcel): Promise<void> {
    if (!confirm(`Eliminar "${archivo.nombreArchivo}"?`)) return;

    try {
      await firstValueFrom(this.facturaService.eliminarArchivoExcel(archivo.nombreArchivo));
      this.mensajeExito = 'Excel eliminado correctamente';
      await this.cargarArchivos();
      setTimeout(() => this.mensajeExito = '', 3000);
    } catch {
      this.mensajeError = 'Error al eliminar el archivo';
      setTimeout(() => this.mensajeError = '', 3000);
    }
  }

  verDetalle(archivo: ArchivoExcel): void {
    const detalles = `Archivo: ${archivo.nombreArchivo}\nRegistros procesados: ${archivo.registrosProcesados || 0}\nRegistros fallidos: ${archivo.registrosFallidos || 0}\nEstado: ${archivo.estado || 'PROCESADO'}\nFecha carga: ${this.formatFecha(archivo.fechaCarga)}\nPeso: ${this.formatPeso(archivo.peso || 0)}`;
    alert(detalles);
  }

  formatPeso(bytes: number): string {
    if (!bytes || bytes === 0) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  formatFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  // ── Informes tab methods ───────────────────────────────────────────────────

  toggleArchivo(nombre: string): void {
    const idx = this.archivosSeleccionados_informes.indexOf(nombre);
    if (idx === -1) this.archivosSeleccionados_informes.push(nombre);
    else this.archivosSeleccionados_informes.splice(idx, 1);
  }

  informes_toggleMunicipio(municipio: string): void {
    const idx = this.informes_municipiosSeleccionados.indexOf(municipio);
    if (idx === -1) this.informes_municipiosSeleccionados.push(municipio);
    else this.informes_municipiosSeleccionados.splice(idx, 1);
  }

  informes_seleccionarTodos(): void {
    this.informes_municipiosSeleccionados = [...this.municipiosDisponibles];
  }

  informes_limpiarMunicipios(): void {
    this.informes_municipiosSeleccionados = [];
  }

  informes_toggleEstrato(e: number): void {
    const idx = this.informes_estratosSeleccionados.indexOf(e);
    if (idx === -1) this.informes_estratosSeleccionados.push(e);
    else this.informes_estratosSeleccionados.splice(idx, 1);
  }

  async generarInforme(): Promise<void> {
    this.informes_loading = true;
    this.informes_error = '';
    this.informes_success = '';

    const filtros: FiltroInforme = {
      tipoInforme: this.tipoInforme,
      municipios: this.informes_municipiosSeleccionados.length > 0 ? this.informes_municipiosSeleccionados : null,
      estratos: this.informes_estratosSeleccionados.length > 0 ? this.informes_estratosSeleccionados : null,
      nombreArchivos: this.archivosSeleccionados_informes.length > 0 ? this.archivosSeleccionados_informes : null,
      fechaInicio: this.informes_fechaInicio || null,
      fechaFin: this.informes_fechaFin || null,
      topN: this.topN,
      mesesBase: this.mesesBase,
      mesesFuturos: this.mesesFuturos,
      formato: this.formato
    };

    try {
      const blob = await firstValueFrom(this.informeService.generar(filtros));

      if (!blob) throw new Error('No se recibio el archivo');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = this.formato === 'pdf' ? 'pdf' : 'xlsx';
      const tipo = this.tipoInforme.toLowerCase().replace(/_/g, '-');
      a.download = `informe_epq_${tipo}_${Date.now()}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.informes_success = 'Informe generado exitosamente';
      setTimeout(() => this.informes_success = '', 4000);
    } catch (err: any) {
      if (err.error instanceof Blob) {
        try {
          const text = await err.error.text();
          const jsonError = JSON.parse(text);
          this.informes_error = jsonError.mensaje || jsonError.message || text;
        } catch {
          this.informes_error = err.message || 'Error al generar el informe';
        }
      } else if (err.error?.mensaje) {
        this.informes_error = err.error.mensaje;
      } else {
        this.informes_error = err.message || 'Error al generar el informe';
      }

      setTimeout(() => this.informes_error = '', 8000);
    } finally {
      this.informes_loading = false;
    }
  }

  // ── Usuarios tab methods ───────────────────────────────────────────────────

  cargarUsuarios(): void {
    this.usuarios_loading = true;
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        this.users = data;
        this.usuarios_loading = false;
      },
      error: (err) => {
        const body = err?.error;
        this.usuarios_error = body?.mensaje || 'Error al cargar usuarios';
        this.usuarios_loading = false;
      }
    });
  }

  eliminarUsuario(user: Usuario): void {
    if (!confirm(`Eliminar al usuario "${user.username}"?`)) return;
    this.usuarioService.eliminarUsuario(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
      },
      error: (err) => {
        const body = err?.error;
        this.usuarios_error = body?.mensaje || 'Error al eliminar usuario';
        setTimeout(() => this.usuarios_error = '', 4000);
      }
    });
  }

  async crearUsuario(): Promise<void> {
    try {
      await firstValueFrom(this.authService.register(this.nuevoUsuario));
      this.usuarios_success = 'Usuario creado correctamente';
      this.nuevoUsuario = { nombreCompleto: '', username: '', correo: '', telefono: '', cedula: '', password: '', rol: 'user' };
      this.showCrearUsuario = false;
      this.cargarUsuarios();
      setTimeout(() => this.usuarios_success = '', 4000);
    } catch (err: any) {
      const body = err?.error;
      this.usuarios_error = body?.mensaje || body?.message || 'Error al crear usuario';
      setTimeout(() => this.usuarios_error = '', 4000);
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goToPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
