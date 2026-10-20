export interface Factura {
  id: number;
  municipio: string;
  fechaFactura: string;
  fechaVencimiento: string;
  valorFactura: number;
  valorMora: number;
  totalPagar: number;
  estrato: number;
  nombreServicio: string;
  direccionServicio: string;
  barrio: string;
  numeroContrato: string;
  estadoPago: string;
  mesReferencia: string;
  tipoFuente: string;
  nombreArchivoOrigen: string;
  fechaCarga: string;
  saldoMora: number;
  tipoArchivoOrigen: string;
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