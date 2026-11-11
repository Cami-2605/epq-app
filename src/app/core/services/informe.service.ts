import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FiltroInforme } from '../models/informe';

/**
 * Servicio para los informes analíticos del sistema EPQ.
 * Mapea los endpoints de InformeController (/api/informes/*).
 */
@Injectable({ providedIn: 'root' })
export class InformeService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  /**
   * Genera el informe de deudores morosos.
   * POST /informes/deudores-morosos
   */
  deudoresMorosos(filtros: FiltroInforme): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/informes/deudores-morosos`, filtros, {
      responseType: 'blob'
    });
  }

  /**
   * Genera el informe de totales por municipio.
   * POST /informes/totales-municipio
   */
  totalesMunicipio(filtros: FiltroInforme): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/informes/totales-municipio`, filtros, {
      responseType: 'blob'
    });
  }

  /**
   * Genera el informe de totales por estrato.
   * POST /informes/totales-estrato
   */
  totalesEstrato(filtros: FiltroInforme): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/informes/totales-estrato`, filtros, {
      responseType: 'blob'
    });
  }

  /**
   * Genera el informe de cartera morosa acumulada.
   * POST /informes/cartera-acumulada
   */
  carteraAcumulada(filtros: FiltroInforme): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/informes/cartera-acumulada`, filtros, {
      responseType: 'blob'
    });
  }

  /**
   * Genera el informe de recaudo separado por tipo de servicio.
   * POST /informes/recaudo-servicio
   */
  recaudoServicio(filtros: FiltroInforme): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/informes/recaudo-servicio`, filtros, {
      responseType: 'blob'
    });
  }

  /**
   * Genera el informe de proyección de recaudo.
   * POST /informes/proyeccion
   */
  proyeccion(filtros: FiltroInforme): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/informes/proyeccion`, filtros, {
      responseType: 'blob'
    });
  }

  /**
   * Endpoint genérico: el tipoInforme va dentro del body.
   * POST /informes/generar
   */
  generar(filtros: FiltroInforme): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/informes/generar`, filtros, {
      responseType: 'blob'
    });
  }
}
