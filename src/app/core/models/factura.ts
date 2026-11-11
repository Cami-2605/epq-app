export interface Factura {
  id: number;
  // Identificación del cliente
  codigoCliente?: string;
  nombreCliente?: string;
  numeroMedidor?: string;
  mesesMora?: number;
  // Ubicación
  municipio: string;
  barrio?: string;
  direccionServicio?: string;
  numeroContrato?: string;
  // Servicio
  nombreServicio?: string;
  estrato?: number;
  // Fechas
  fechaFactura: string;
  fechaVencimiento?: string;
  mesReferencia?: string;
  // Valores monetarios
  valorFactura: number;
  valorMora?: number;
  saldoMora?: number;
  totalPagar?: number;
  // Estado
  /** PENDIENTE | VENCIDO (mora real existe) | PAGADO */
  estadoPago: string;
  // Trazabilidad
  tipoFuente?: string;
  nombreArchivoOrigen?: string;
  fechaCarga?: string;
  tipoArchivoOrigen?: string;
}

export interface ArchivoExcel {
  id: number;
  nombreArchivo: string;
  peso: number;
  fechaCarga: string;
  tipo: string;
  registrosProcesados: number;
  registrosFallidos: number;
  errores: string;
  estado: string;
}

export interface ResultadoCargaItem {
  nombreArchivo: string;
  tipoArchivo: string;
  registrosProcesados: number;
  registrosFallidos: number;
  estado: string;
  errores: string[];
}

export interface ResultadoCarga {
  archivos: ResultadoCargaItem[];
  totalRegistrosProcesados: number;
  totalRegistrosFallidos: number;
  archivosConError: number;
  mensaje: string;
}

/** Respuesta de error estándar de la API (ApiErrorDto del backend). */
export interface ApiError {
  codigo: string;
  mensaje: string;
  detalle?: string;
  timestamp?: string;
  path?: string;
  erroresCampos?: { campo: string; mensaje: string }[];
  erroresParciales?: string[];
}