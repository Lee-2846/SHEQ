const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function login(credentials) {
  await wait(500);
  return {
    id: 101,
    name: credentials.email.split("@")[0] || "Member",
    email: credentials.email
  };
}

export async function signup(data) {
  await wait(650);
  return { id: Date.now(), name: data.name, email: data.email };
}
