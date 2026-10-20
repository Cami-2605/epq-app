import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FiltroReporte } from '../models/filtro-reporte';
import { ArchivoExcel } from '../models/factura';

/** Resultado devuelto por el backend al cargar uno o varios archivos */
export interface ResultadoArchivo {
  nombreArchivo: string;
  tipoArchivo: string;       // 'EXCEL' | 'PDF'
  registrosProcesados: number;
  registrosFallidos: number;
  estado: string;            // 'PROCESADO' | 'PARCIAL' | 'ERROR'
  errores: string[];
}

export interface ResultadoCarga {
  archivos: ResultadoArchivo[];
  totalRegistrosProcesados: number;
  totalRegistrosFallidos: number;
  archivosConError: number;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ── Carga de archivos ──────────────────────────────────────────────────────

  /** Sube un único archivo (Excel o PDF). Devuelve ResultadoCarga. */
  cargarExcel(archivo: File, tipo: string = 'extra'): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<any>(`${this.apiUrl}/facturas/cargar`, formData, {
      params: new HttpParams().set('tipo', tipo)
    });
  }

  /** Sube múltiples archivos. Puede devolver HTTP 207 con ResultadoCarga parcial. */
  cargarMultiplesArchivos(archivos: File[], tipo: string = 'extra'): Observable<any> {
    const formData = new FormData();
    archivos.forEach(archivo => formData.append('archivos', archivo));
    return this.http.post<any>(`${this.apiUrl}/facturas/cargar-multiple`, formData, {
      params: new HttpParams().set('tipo', tipo)
    });
  }

  // ── Archivos Excel guardados ───────────────────────────────────────────────

  /** Lista los archivos subidos. Filtra por tipo si se indica. */
  getArchivosExcel(tipo?: string): Observable<ArchivoExcel[]> {
    let params = new HttpParams();
    if (tipo) params = params.set('tipo', tipo);
    return this.http.get<ArchivoExcel[]>(`${this.apiUrl}/excel`, { params });
  }

  /** Detalle de un archivo: municipios, estratos y meses disponibles. */
  getDetalleArchivo(nombre: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/excel/${encodeURIComponent(nombre)}`);
  }

  /** Elimina un archivo y sus facturas asociadas. */
  eliminarArchivoExcel(nombre: string, tipoFuente?: string): Observable<any> {
    let params = new HttpParams();
    if (tipoFuente) params = params.set('tipoFuente', tipoFuente);
    return this.http.delete(`${this.apiUrl}/excel/${encodeURIComponent(nombre)}`, { params });
  }

  // ── Combos / filtros disponibles ───────────────────────────────────────────

  getMunicipios(tipoFuente?: string, archivo?: string): Observable<string[]> {
    let params = new HttpParams();
    if (tipoFuente) params = params.set('tipoFuente', tipoFuente);
    if (archivo)    params = params.set('archivo', archivo);
    return this.http.get<string[]>(`${this.apiUrl}/facturas/municipios`, { params });
  }

  getEstratos(tipoFuente?: string, archivo?: string): Observable<number[]> {
    let params = new HttpParams();
    if (tipoFuente) params = params.set('tipoFuente', tipoFuente);
    if (archivo)    params = params.set('archivo', archivo);
    return this.http.get<number[]>(`${this.apiUrl}/facturas/estratos`, { params });
  }

  getMeses(tipoFuente?: string, archivo?: string): Observable<string[]> {
    let params = new HttpParams();
    if (tipoFuente) params = params.set('tipoFuente', tipoFuente);
    if (archivo)    params = params.set('archivo', archivo);
    return this.http.get<string[]>(`${this.apiUrl}/facturas/meses`, { params });
  }

  // ── Reportes ───────────────────────────────────────────────────────────────

  /** Resumen estadístico sin generar archivo. */
  getResumen(filtros: FiltroReporte): Observable<any> {
    return this.http.post(`${this.apiUrl}/facturas/resumen`, filtros);
  }

  /** Genera Excel o PDF según filtros.tipoArchivo. Devuelve Blob para descarga. */
  generarReporte(filtros: FiltroReporte): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/facturas/reporte`, filtros, {
      responseType: 'blob'
    });
  }

  /** Genera Excel + PDF en un ZIP. */
  generarReporteAmbos(filtros: FiltroReporte): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/facturas/reporte-ambos`, filtros, {
      responseType: 'blob'
    });
  }

  // ── Endpoints de totales (JSON, sin archivo) ───────────────────────────────

  getTotalesPorEstrato(filtros: FiltroReporte): Observable<any> {
    return this.http.post(`${this.apiUrl}/facturas/totales-estrato`, filtros);
  }

  getTotalesPorMunicipio(filtros: FiltroReporte): Observable<any> {
    return this.http.post(`${this.apiUrl}/facturas/totales-municipio`, filtros);
  }

  getDetallePorVivienda(filtros: FiltroReporte): Observable<any> {
    return this.http.post(`${this.apiUrl}/facturas/detalle-vivienda`, filtros);
  }

  // ── Alias de conveniencia ──────────────────────────────────────────────────

  getTotalesEstrato(filtros: FiltroReporte): Observable<any> {
    return this.getTotalesPorEstrato(filtros);
  }

  getTotalesMunicipio(filtros: FiltroReporte): Observable<any> {
    return this.getTotalesPorMunicipio(filtros);
  }
}
