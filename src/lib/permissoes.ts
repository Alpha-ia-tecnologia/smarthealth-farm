// RBAC espelhado na UI (RF-ADM / RF-SEG). O backend é a barreira real; aqui só escondemos/mostramos.
//
// O perfil "Admin" é superusuário: acumula os poderes de Gestor e de TI. Centralizar as checagens
// aqui evita espalhar `perfil === "Gestor"` (que esqueceria o Admin) pelas telas.
import type { PerfilUsuario } from "@/types"

/** Pode tomar decisões de gestão: aprovar/executar recomendações, recalibrar previsão, editar limiares. */
export function podeGerir(perfil: PerfilUsuario | null): boolean {
  return perfil === "Gestor" || perfil === "Admin"
}

/** Pode administrar o sistema: usuários, catálogo, parâmetros (área de TI). */
export function podeAdministrar(perfil: PerfilUsuario | null): boolean {
  return perfil === "TI" || perfil === "Admin"
}

/** Admin enxerga e acessa tudo — usado nos guards de rota e na navegação. */
export function ehAdmin(perfil: PerfilUsuario | null): boolean {
  return perfil === "Admin"
}
