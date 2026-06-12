// Persistência do token JWT no cliente.
//
// "Lembrar-me" decide o storage: localStorage (persiste entre sessões do navegador)
// quando marcado, sessionStorage (some ao fechar a aba) quando não. Lemos sempre dos
// dois para que a restauração de sessão funcione independentemente da escolha anterior.

const TOKEN_KEY = "sh-auth-token"

/** Lê o token salvo, preferindo a sessão persistente (localStorage). */
export function lerToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  } catch {
    // Modo privado/cookies bloqueados — degrada para sem sessão persistida.
    return null
  }
}

/** Salva o token no storage escolhido por "lembrar-me" e limpa o outro. */
export function salvarToken(token: string, lembrar: boolean): void {
  try {
    const alvo = lembrar ? localStorage : sessionStorage
    const outro = lembrar ? sessionStorage : localStorage
    alvo.setItem(TOKEN_KEY, token)
    outro.removeItem(TOKEN_KEY)
  } catch {
    // Sem storage disponível: a sessão vale só enquanto a página estiver aberta.
  }
}

/** Remove o token de ambos os storages (logout). */
export function limparToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* nada a fazer */
  }
}
