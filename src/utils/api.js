import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

// Auto inject access token before each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Unified endpoint fetching helpers
export const fetchDataFromApi = async (url) => {
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("API GET Error:", error);
    return error.response?.data || { error: true, message: error.message };
  }
};

export const postData = async (url, body) => {
  try {
    const response = await api.post(url, body);
    return response.data;
  } catch (error) {
    console.error("API POST Error:", error);
    return error.response?.data || { error: true, message: error.message };
  }
};

export const putData = async (url, body) => {
  try {
    const response = await api.put(url, body);
    return response.data;
  } catch (error) {
    console.error("API PUT Error:", error);
    return error.response?.data || { error: true, message: error.message };
  }
};

export const deleteData = async (url) => {
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error) {
    console.error("API DELETE Error:", error);
    return error.response?.data || { error: true, message: error.message };
  }
};

export default api;
