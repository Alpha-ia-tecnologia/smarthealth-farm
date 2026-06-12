import { lerToken, limparToken, salvarToken } from "@/lib/auth-storage"

const CHAVE = "sh-auth-token"

describe("auth-storage", () => {
  it("salva no localStorage quando lembrar=true", () => {
    salvarToken("abc", true)
    expect(localStorage.getItem(CHAVE)).toBe("abc")
    expect(sessionStorage.getItem(CHAVE)).toBeNull()
    expect(lerToken()).toBe("abc")
  })

  it("salva no sessionStorage quando lembrar=false", () => {
    salvarToken("xyz", false)
    expect(sessionStorage.getItem(CHAVE)).toBe("xyz")
    expect(localStorage.getItem(CHAVE)).toBeNull()
    expect(lerToken()).toBe("xyz")
  })

  it("troca de storage ao mudar a opção lembrar", () => {
    salvarToken("a", false)
    salvarToken("a", true)
    expect(sessionStorage.getItem(CHAVE)).toBeNull()
    expect(localStorage.getItem(CHAVE)).toBe("a")
  })

  it("prefere o localStorage na leitura", () => {
    localStorage.setItem(CHAVE, "persistente")
    sessionStorage.setItem(CHAVE, "sessao")
    expect(lerToken()).toBe("persistente")
  })

  it("limpa os dois storages no logout", () => {
    salvarToken("a", true)
    limparToken()
    expect(lerToken()).toBeNull()
    expect(localStorage.getItem(CHAVE)).toBeNull()
    expect(sessionStorage.getItem(CHAVE)).toBeNull()
  })

  it("devolve null quando não há token", () => {
    expect(lerToken()).toBeNull()
  })
})
