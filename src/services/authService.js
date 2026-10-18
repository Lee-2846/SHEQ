import { apiRequest } from "./api";

export async function login(credentials) {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: credentials.identifier || credentials.email || credentials.emailOrPhone,
      password: credentials.password
    })
  });

  return {
    ...result.user,
    token: result.token
  };
}

export async function signup(data) {
  const identifier = data.email || data.emailOrPhone || data.identifier;
  const method = data.method || (identifier?.includes("@") ? "email" : "phone");

  const result = await apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      ...(method === "email" ? { email: identifier } : { phone: identifier }),
      password: data.password
    })
  });

  return {
    ...result.user,
    token: result.token,
    notice: result.notice
  };
}
