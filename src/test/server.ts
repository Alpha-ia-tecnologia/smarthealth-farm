import { setupServer } from "msw/node"
import { handlers } from "./handlers"

/** Servidor MSW que intercepta o fetch nos testes. Ciclo de vida em `setup.ts`. */
export const server = setupServer(...handlers)
