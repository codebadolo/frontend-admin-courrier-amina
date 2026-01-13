// import axios from "axios";
// const BASE = "http://localhost:8000/api/dashboard/";

// export const getStats = async () => {
//   const res = await axios.get(`${BASE}stats/`);
//   return res.data;
// };

// export const getReports = async (params) => {
//   const res = await axios.get(`${BASE}reports/`, { params });
//   return res.data;
// };
// services/dashboardService.js
import axios from "axios";

const BASE = "http://localhost:8000/api/dashboard/";

const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
  return token ? { Authorization: `Token ${token}` } : {};
};

export const getStats = async (filters = {}) => {
  try {
    const res = await axios.get(`${BASE}stats/`, {
      params: {
        period: filters.period,
        start_date: filters.startDate?.format('YYYY-MM-DD'),
        end_date: filters.endDate?.format('YYYY-MM-DD'),
        service: filters.service
      },
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Erreur getStats:", error);
    throw error;
  }
};

export const getCourrierTrends = async (filters = {}) => {
  try {
    const res = await axios.get(`${BASE}trends/`, {
      params: {
        period: filters.period,
        start_date: filters.startDate?.format('YYYY-MM-DD'),
        end_date: filters.endDate?.format('YYYY-MM-DD')
      },
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Erreur getCourrierTrends:", error);
    throw error;
  }
};

export const getServicePerformance = async (filters = {}) => {
  try {
    const res = await axios.get(`${BASE}performance/`, {
      params: {
        period: filters.period,
        start_date: filters.startDate?.format('YYYY-MM-DD'),
        end_date: filters.endDate?.format('YYYY-MM-DD')
      },
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Erreur getServicePerformance:", error);
    throw error;
  }
};

export const getReports = async (params) => {
  const res = await axios.get(`${BASE}reports/`, { params });
  return res.data;
};
