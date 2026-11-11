/**
 * Mapea FiltroInformeDto del backend.
 * Todos los campos de tipo lista con valor null = "sin filtro" (todos).
 */
export interface FiltroInforme {
  /** Municipios a incluir. null = todos. */
  municipios?: string[] | null;

  /** Estratos a incluir. null = todos. */
  estratos?: number[] | null;

  /** Servicios a incluir (gas, agua, etc.). null = todos. */
  servicios?: string[] | null;

  /** Nombres de archivos fuente. null = todos. */
  nombreArchivos?: string[] | null;

  /** Fecha de inicio del filtro por período (ISO date string "YYYY-MM-DD"). */
  fechaInicio?: string | null;

  /** Fecha de fin del filtro por período (ISO date string "YYYY-MM-DD"). */
  fechaFin?: string | null;

  /** Tipo de informe: DEUDORES_MOROSOS, TOTALES_MUNICIPIO, TOTALES_ESTRATO,
   *  CARTERA_ACUMULADA, RECAUDO_SERVICIO, PROYECCION. */
  tipoInforme?: string | null;

  /**
   * Para informe de morosos: cuántos registros devolver.
   * Default backend: 40.
   */
  topN?: number;

  /**
   * Para proyección: base de 1 o 2 meses.
   * Default backend: 2.
   */
  mesesBase?: number;

  /**
   * Para proyección: cuántos meses futuros proyectar.
   * Default backend: 3.
   */
  mesesFuturos?: number;

  /**
   * Formato de salida: "xlsx" o "pdf".
   * Default backend: "xlsx".
   */
  formato?: 'xlsx' | 'pdf';
}

/** Tipos de informe disponibles. */
export type TipoInforme =
  | 'DEUDORES_MOROSOS'
  | 'TOTALES_MUNICIPIO'
  | 'TOTALES_ESTRATO'
  | 'CARTERA_ACUMULADA'
  | 'RECAUDO_SERVICIO'
  | 'PROYECCION';

/** Respuesta de error estándar de la API (ApiErrorDto). */
export interface ApiError {
  codigo: string;
  mensaje: string;
  detalle?: string;
  timestamp?: string;
  path?: string;
}
