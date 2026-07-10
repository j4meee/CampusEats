const AUTH_TOKEN_KEY = "campusEatsToken";
const AUTH_USER_KEY = "campusEatsUser";

export const saveAuthSession = ({ user, token }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const updateStoredUser = (user) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const getStoredUser = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!token || !storedUser) {
    clearAuthSession();
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    clearAuthSession();
    return null;
  }
};

export const fetchJson = async (url, options) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = new Headers(options?.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }

    const message = data?.error
      ? `${data.message}: ${data.error}`
      : data?.message || text || `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
};
