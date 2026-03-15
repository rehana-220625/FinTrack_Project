import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";

export async function login(username: string, password: string) {
  const res = await apiRequest("POST", "/api/auth/login", { username, password });
  const user = await res.json();
  queryClient.setQueryData(["/api/auth/me"], user);
  return user;
}

export async function register(data: { username: string; password: string; name: string; email: string; country: string }) {
  const res = await apiRequest("POST", "/api/auth/register", data);
  const user = await res.json();
  queryClient.setQueryData(["/api/auth/me"], user);
  return user;
}

export async function logout() {
  await apiRequest("POST", "/api/auth/logout", {});
  queryClient.clear();
}
