export const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error
      ? `${data.message}: ${data.error}`
      : data?.message || text || `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
};
