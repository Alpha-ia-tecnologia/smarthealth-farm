// Coordenadas [longitude, latitude] de municípios do Maranhão que têm unidades da rede EMSERH.
// Constantes geográficas (não são dado de negócio) — usadas para posicionar os marcadores no mapa.
const COORDS: Record<string, [number, number]> = {
  "sao luis": [-44.3028, -2.5297],
  imperatriz: [-47.4775, -5.5184],
  caxias: [-43.3561, -4.8581],
  bacabal: [-44.7822, -4.2236],
  balsas: [-46.0419, -7.5325],
  acailandia: [-47.5006, -4.9472],
  chapadinha: [-43.3603, -3.7333],
}

/** Remove acentos e normaliza para casar o nome do município vindo da API. */
function normalizar(municipio: string): string {
  return municipio
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
}

/** Coordenadas [long, lat] do município, ou `undefined` se não mapeado. */
export function coordenadasMunicipio(municipio: string): [number, number] | undefined {
  return COORDS[normalizar(municipio)]
}
