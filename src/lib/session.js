const USER_KEY = "@FinalizaTCC:user";
const TOKEN_KEY = "@FinalizaTCC:token";

export function getStoredUser() {
  try {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Erro ao restaurar sessao:", error);
    clearStoredUser();
    return null;
  }
}

export function storeUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token) {
  if (!token) throw new Error("Token de autenticacao ausente");
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredUser() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
