export interface FiltroReporte {
  municipios: string[] | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  estrato: number | null;
  barrio: string | null;
  estadoPago: string | null;
  ordenarPor: string;
  ordenDireccion: string;
  tiposReporte: string[] | null;
  incluirMora: boolean;
  agruparPorMunicipio: boolean;
  agruparPorMes: boolean;
  soloMorosos: boolean;
  mostrarDetallePorVivienda: boolean;
  mostrarTotalesPorEstrato: boolean;
  mostrarTotalesPorMunicipio: boolean;
  valorMinimo: number | null;
  valorMaximo: number | null;
  tipoArchivo: string;
  nombreArchivo: string | null;
  tipoFuente: string;
  estratos: number[] | null;
  mesesReferencia: string[] | null;
  nombreArchivos: string[] | null;
  agruparPorEstrato: boolean;
  ambosFormatos: boolean;
}