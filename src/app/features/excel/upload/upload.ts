import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FacturaService } from '../../../core/services/factura.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';

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
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.css']
})
export class UploadComponent implements OnInit {

  selectedFiles: File[] = [];
  archivos: ArchivoExcel[] = [];
  loading = false;
  uploading = false;
  tipoFuente: string = 'extra';
  mensajeError: string = '';
  mensajeExito: string = '';
  usuarioFoto = '';

  constructor(
    private router: Router,
    private facturaService: FacturaService,
    public authService: AuthService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarArchivos();
    this.cargarFotoUsuario();
  }

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

      if (validos.length > 0) {
        console.log(`Archivos seleccionados: ${validos.map(f => f.name).join(', ')}`);
      }
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

    console.log('Subiendo archivos:', this.selectedFiles.map(f => f.name).join(', '));

    try {
      let respuesta: any;

      if (this.selectedFiles.length === 1) {
        respuesta = await firstValueFrom(
          this.facturaService.cargarExcel(this.selectedFiles[0], this.tipoFuente)
        );
        this.mensajeExito = '' + (respuesta || 'Archivo cargado y procesado correctamente');
      } else {
        respuesta = await firstValueFrom(
          this.facturaService.cargarMultiplesArchivos(this.selectedFiles, this.tipoFuente)
        );
        // Handle HTTP 207 Multi-Status: show partial results summary
        if (respuesta && typeof respuesta === 'object') {
          const procesados = respuesta.procesados ?? respuesta.exitosos ?? 0;
          const fallidos = respuesta.fallidos ?? respuesta.errores ?? 0;
          this.mensajeExito = `${procesados} archivo(s) procesado(s), ${fallidos} fallido(s)`;
        } else {
          this.mensajeExito = '' + (respuesta || 'Archivos cargados correctamente');
        }
      }

      console.log('Respuesta del servidor:', respuesta);

      this.selectedFiles = [];

      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      await this.cargarArchivos();

      setTimeout(() => this.mensajeExito = '', 5000);

    } catch (error: any) {
      console.error('Error al subir archivo(s):', error);

      if (error.status === 0) {
        this.mensajeError = 'No se puede conectar al servidor. ¿El backend está corriendo en http://localhost:8080?';
      } else if (error.status === 400) {
        const errorMsg = typeof error.error === 'string' ? error.error : 'Error al procesar el archivo. Verifica las columnas obligatorias: municipio, fecha, valor';
        this.mensajeError = `${errorMsg}`;
      } else if (error.status === 413) {
        this.mensajeError = 'El archivo es demasiado grande. Máximo 50MB.';
      } else if (error.status === 500) {
        this.mensajeError = 'Error interno del servidor. Revisa los logs del backend.';
      } else {
        this.mensajeError = 'Error al cargar el archivo. Intenta nuevamente.';
      }

      setTimeout(() => this.mensajeError = '', 8000);

    } finally {
      this.uploading = false;
      console.log('Proceso de subida finalizado');
    }
  }

  async cargarArchivos(): Promise<void> {
    this.loading = true;
    try {
      this.archivos = await firstValueFrom(this.facturaService.getArchivosExcel()) || [];
      console.log(`📋 Archivos cargados: ${this.archivos.length}`);
    } catch (error) {
      console.error('Error cargando archivos:', error);
      this.mensajeError = 'Error al cargar la lista de archivos';
      setTimeout(() => this.mensajeError = '', 3000);
    } finally {
      this.loading = false;
    }
  }

  async eliminarArchivo(archivo: ArchivoExcel): Promise<void> {
    if (!confirm(`¿Eliminar "${archivo.nombreArchivo}"?`)) return;

    try {
      await firstValueFrom(this.facturaService.eliminarArchivoExcel(archivo.nombreArchivo));
      this.mensajeExito = 'Excel eliminado correctamente';
      await this.cargarArchivos();
      setTimeout(() => this.mensajeExito = '', 3000);
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      this.mensajeError = 'Error al eliminar el archivo';
      setTimeout(() => this.mensajeError = '', 3000);
    }
  }

  verDetalle(archivo: ArchivoExcel): void {
    const detalles = `
    Archivo: ${archivo.nombreArchivo}
    Registros procesados: ${archivo.registrosProcesados || 0}
    Registros fallidos: ${archivo.registrosFallidos || 0}
    Estado: ${archivo.estado || 'PROCESADO'}
    Fecha carga: ${this.formatFecha(archivo.fechaCarga)}
    Peso: ${this.formatPeso(archivo.peso || 0)}
    `;
    alert(detalles);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToUsuarios(): void {
    this.router.navigate(['/dashboard-user']);
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

  goToGenerador(): void {
    this.router.navigate(['/dashboard-admin']);
  }

  goToExcel() {
    this.router.navigate(['/excel']);
  }

  cargarFotoUsuario(): void {
    this.usuarioService.getPerfil().subscribe({
      next: (user) => this.usuarioFoto = user.fotoPerfil,
      error: () => {}
    });
  }

  goToPerfil(): void {
    this.router.navigate(['/perfil']);
  }
}
