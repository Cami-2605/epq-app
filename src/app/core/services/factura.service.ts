import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  cargarExcel(archivo: File, tipo: string = 'extra'): Observable<string> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('tipo', tipo);
    return this.http.post(`${this.apiUrl}/facturas/cargar`, formData, {
      responseType: 'text'
    });
  }

  cargarMultiplesArchivos(archivos: File[], tipo: string = 'extra'): Observable<any> {
    const formData = new FormData();
    archivos.forEach(archivo => formData.append('archivos', archivo));
    formData.append('tipo', tipo);
    return this.http.post(`${this.apiUrl}/facturas/cargar-multiple`, formData);
  }

  getArchivosExcel(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/excel`);
  }

  eliminarArchivoExcel(nombre: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/excel/${encodeURIComponent(nombre)}`);
  }

  generarReporte(filtros: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/facturas/reporte`, filtros, {
      responseType: 'blob'
    });
  }

  getMunicipios(tipoFuente?: string, archivo?: string): Observable<string[]> {
    let params = new HttpParams();
    if (tipoFuente) params = params.set('tipoFuente', tipoFuente);
    if (archivo) params = params.set('archivo', archivo);
    return this.http.get<string[]>(`${this.apiUrl}/facturas/municipios`, { params });
  }

  getEstratos(tipoFuente?: string, archivo?: string): Observable<number[]> {
    let params = new HttpParams();
    if (tipoFuente) params = params.set('tipoFuente', tipoFuente);
    if (archivo) params = params.set('archivo', archivo);
    return this.http.get<number[]>(`${this.apiUrl}/facturas/estratos`, { params });
  }

  getMeses(tipoFuente?: string, archivo?: string): Observable<string[]> {
    let params = new HttpParams();
    if (tipoFuente) params = params.set('tipoFuente', tipoFuente);
    if (archivo) params = params.set('archivo', archivo);
    return this.http.get<string[]>(`${this.apiUrl}/facturas/meses`, { params });
  }

  getResumen(filtros: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/facturas/resumen`, filtros);
  }

  generarReporteAmbos(filtros: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/facturas/reporte-ambos`, filtros, { responseType: 'blob' });
  }

  getTotalesPorEstrato(filtros: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/facturas/totales-estrato`, filtros);
  }

  getTotalesPorMunicipio(filtros: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/facturas/totales-municipio`, filtros);
  }

  getDetallePorVivienda(filtros: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/facturas/detalle-vivienda`, filtros);
  }
}
