import { useEffect, useState } from "react"

/** Devolve o valor após `atrasoMs` sem mudanças. Útil para busca server-side (evita 1 req/tecla). */
export function useDebounce<T>(valor: T, atrasoMs = 350): T {
  const [debounced, setDebounced] = useState(valor)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(valor), atrasoMs)
    return () => clearTimeout(id)
  }, [valor, atrasoMs])

  return debounced
}
