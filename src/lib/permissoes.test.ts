import { ehAdmin, podeAdministrar, podeGerir } from "@/lib/permissoes"

describe("permissoes (RBAC espelhado na UI)", () => {
  it("podeGerir vale para Gestor e Admin", () => {
    expect(podeGerir("Gestor")).toBe(true)
    expect(podeGerir("Admin")).toBe(true)
    expect(podeGerir("TI")).toBe(false)
    expect(podeGerir("Operador")).toBe(false)
    expect(podeGerir(null)).toBe(false)
  })

  it("podeAdministrar vale para TI e Admin", () => {
    expect(podeAdministrar("TI")).toBe(true)
    expect(podeAdministrar("Admin")).toBe(true)
    expect(podeAdministrar("Gestor")).toBe(false)
    expect(podeAdministrar("Operador")).toBe(false)
    expect(podeAdministrar(null)).toBe(false)
  })

  it("ehAdmin só vale para Admin", () => {
    expect(ehAdmin("Admin")).toBe(true)
    expect(ehAdmin("TI")).toBe(false)
    expect(ehAdmin(null)).toBe(false)
  })
})
