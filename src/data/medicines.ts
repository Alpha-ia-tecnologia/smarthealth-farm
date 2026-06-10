import type { Medicamento } from "@/types"

// Catálogo de medicamentos e insumos essenciais (fictício, porém plausível).
export const medicamentos: Medicamento[] = [
  { id: "m-001", codigo: "MED-001", nome: "Amoxicilina + Clavulanato 500mg", apresentacao: "Comprimido", familia: "Antibióticos", unidadeMedida: "cp", criticidade: "Alta", essencial: true, ativo: true },
  { id: "m-002", codigo: "MED-002", nome: "Ceftriaxona 1g", apresentacao: "Frasco-ampola", familia: "Antibióticos", unidadeMedida: "fa", criticidade: "Alta", essencial: true, ativo: true },
  { id: "m-003", codigo: "MED-003", nome: "Azitromicina 500mg", apresentacao: "Comprimido", familia: "Antibióticos", unidadeMedida: "cp", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-004", codigo: "MED-004", nome: "Vancomicina 500mg", apresentacao: "Frasco-ampola", familia: "Antibióticos", unidadeMedida: "fa", criticidade: "Alta", essencial: true, ativo: true },
  { id: "m-005", codigo: "MED-005", nome: "Dipirona 500mg/mL", apresentacao: "Ampola 2mL", familia: "Analgésicos", unidadeMedida: "amp", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-006", codigo: "MED-006", nome: "Paracetamol 500mg", apresentacao: "Comprimido", familia: "Analgésicos", unidadeMedida: "cp", criticidade: "Baixa", essencial: true, ativo: true },
  { id: "m-007", codigo: "MED-007", nome: "Morfina 10mg/mL", apresentacao: "Ampola 1mL", familia: "Analgésicos", unidadeMedida: "amp", criticidade: "Alta", essencial: true, ativo: true },
  { id: "m-008", codigo: "MED-008", nome: "Tramadol 50mg/mL", apresentacao: "Ampola 2mL", familia: "Analgésicos", unidadeMedida: "amp", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-009", codigo: "MED-009", nome: "Oseltamivir 75mg", apresentacao: "Cápsula", familia: "Antivirais", unidadeMedida: "cap", criticidade: "Alta", essencial: true, ativo: true },
  { id: "m-010", codigo: "MED-010", nome: "Aciclovir 250mg", apresentacao: "Frasco-ampola", familia: "Antivirais", unidadeMedida: "fa", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-011", codigo: "MED-011", nome: "Enalapril 10mg", apresentacao: "Comprimido", familia: "Cardiovascular", unidadeMedida: "cp", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-012", codigo: "MED-012", nome: "Losartana 50mg", apresentacao: "Comprimido", familia: "Cardiovascular", unidadeMedida: "cp", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-013", codigo: "MED-013", nome: "Furosemida 10mg/mL", apresentacao: "Ampola 2mL", familia: "Cardiovascular", unidadeMedida: "amp", criticidade: "Alta", essencial: true, ativo: true },
  { id: "m-014", codigo: "MED-014", nome: "Noradrenalina 2mg/mL", apresentacao: "Ampola 4mL", familia: "Cardiovascular", unidadeMedida: "amp", criticidade: "Alta", essencial: true, ativo: true },
  { id: "m-015", codigo: "MED-015", nome: "Heparina 5000UI/mL", apresentacao: "Frasco 5mL", familia: "Cardiovascular", unidadeMedida: "fr", criticidade: "Alta", essencial: true, ativo: true },
  { id: "m-016", codigo: "MED-016", nome: "Soro Fisiológico 0,9% 500mL", apresentacao: "Bolsa", familia: "Soros e Vacinas", unidadeMedida: "bolsa", criticidade: "Alta", essencial: true, ativo: true },
  { id: "m-017", codigo: "MED-017", nome: "Ringer Lactato 500mL", apresentacao: "Bolsa", familia: "Soros e Vacinas", unidadeMedida: "bolsa", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-018", codigo: "MED-018", nome: "Vacina Influenza", apresentacao: "Dose", familia: "Soros e Vacinas", unidadeMedida: "dose", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-019", codigo: "MED-019", nome: "Soro Antiofídico Polivalente", apresentacao: "Ampola", familia: "Soros e Vacinas", unidadeMedida: "amp", criticidade: "Alta", essencial: true, ativo: true },
  { id: "m-020", codigo: "MED-020", nome: "Luva de Procedimento M", apresentacao: "Caixa 100un", familia: "Insumos Médicos", unidadeMedida: "cx", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-021", codigo: "MED-021", nome: "Seringa 10mL", apresentacao: "Unidade", familia: "Insumos Médicos", unidadeMedida: "un", criticidade: "Baixa", essencial: true, ativo: true },
  { id: "m-022", codigo: "MED-022", nome: "Cateter Venoso 20G", apresentacao: "Unidade", familia: "Insumos Médicos", unidadeMedida: "un", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-023", codigo: "MED-023", nome: "Máscara Cirúrgica", apresentacao: "Caixa 50un", familia: "Insumos Médicos", unidadeMedida: "cx", criticidade: "Baixa", essencial: true, ativo: true },
  { id: "m-024", codigo: "MED-024", nome: "Haloperidol 5mg/mL", apresentacao: "Ampola 1mL", familia: "Saúde Mental", unidadeMedida: "amp", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-025", codigo: "MED-025", nome: "Diazepam 5mg/mL", apresentacao: "Ampola 2mL", familia: "Saúde Mental", unidadeMedida: "amp", criticidade: "Média", essencial: true, ativo: true },
  { id: "m-026", codigo: "MED-026", nome: "Clorpromazina 25mg", apresentacao: "Comprimido", familia: "Saúde Mental", unidadeMedida: "cp", criticidade: "Baixa", essencial: false, ativo: true },
  { id: "m-027", codigo: "MED-027", nome: "Artesunato + Mefloquina", apresentacao: "Comprimido", familia: "Antiparasitários", unidadeMedida: "cp", criticidade: "Alta", essencial: true, ativo: true },
  { id: "m-028", codigo: "MED-028", nome: "Albendazol 400mg", apresentacao: "Comprimido", familia: "Antiparasitários", unidadeMedida: "cp", criticidade: "Baixa", essencial: false, ativo: true },
  { id: "m-029", codigo: "MED-029", nome: "Ivermectina 6mg", apresentacao: "Comprimido", familia: "Antiparasitários", unidadeMedida: "cp", criticidade: "Baixa", essencial: false, ativo: true },
  { id: "m-030", codigo: "MED-030", nome: "Doxiciclina 100mg", apresentacao: "Comprimido", familia: "Antibióticos", unidadeMedida: "cp", criticidade: "Média", essencial: true, ativo: true },
]

export const familiasTerapeuticas = Array.from(
  new Set(medicamentos.map((m) => m.familia)),
)
