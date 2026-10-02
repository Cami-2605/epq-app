import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  generarReporte(filtros: any): Observable<Blob> {
    if (filtros.ambosFormatos === true) {
      return this.generarReporteAmbos(filtros);
    }
    return this.http.post(`${this.apiUrl}/facturas/reporte`, filtros, {
      responseType: 'blob'
    });
  }

  generarReporteAmbos(filtros: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/facturas/reporte-ambos`, filtros, {
      responseType: 'blob'
    });
  }
}
