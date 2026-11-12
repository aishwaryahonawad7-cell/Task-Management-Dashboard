import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,

  timeout: 10000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Read token from your existing authentication mechanism.
    const token = sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 400:
          console.error("Bad Request");
          break;

        case 401:
          console.error("Unauthorized - Please login again");
          break;

        case 403:
          console.error("Forbidden - Access denied");
          break;

        case 404:
          console.error("Resource not found");
          break;

        case 500:
          console.error("Internal Server Error");
          break;

        default:
          console.error("Something went wrong");
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
    } else if (error.request) {
      console.error("Network error - Server not responding");
    } else {
      console.error(error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;