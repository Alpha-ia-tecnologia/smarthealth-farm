// Configuração de runtime do front (URL da API).
//
// Em PRODUÇÃO este arquivo é REGERADO pelo container a cada start, a partir da variável de
// ambiente VITE_API_URL (ver docker/app-config.sh). Trocar a env no EasyPanel + reimplantar
// atualiza a URL sem reconstruir o bundle.
//
// Em DESENVOLVIMENTO fica vazio: o app cai no fallback import.meta.env (.env do Vite).
window.__APP_CONFIG__ = { VITE_API_URL: "" };
