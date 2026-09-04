import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// The access token lives in memory only. Keeping it out of localStorage means
// an XSS bug cannot read it, and the httpOnly refresh cookie restores the
// session after a page reload.
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // needed so the refresh cookie is sent
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// A bare client for /auth/refresh so a failed refresh cannot trigger the
// response interceptor again and loop forever.
const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const requestRefresh = async () => {
  const { data } = await refreshClient.post("/auth/refresh");
  setAccessToken(data.accessToken);
  return data.accessToken;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");

    // Retry once with a fresh access token when the old one expired.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshCall
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await requestRefresh();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        setAccessToken(null);
      }
    }

    return Promise.reject(error);
  }
);

// The backend always answers with { success, message }, so pull the message out
// instead of showing axios' generic "Request failed with status code 401".
export const getErrorMessage = (error) =>
  error.response?.data?.message || "Something went wrong. Please try again.";

export default api;
