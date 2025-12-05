import axios from "axios";

const API_URL = "http://localhost:8000/api/dashboard/";
const token = localStorage.getItem("token");
const config = { headers: { Authorization: `Bearer ${token}` } };

export const fetchReports = async () => {
  const response = await axios.get(`${API_URL}reports/`, config);
  return response.data;
};

export const fetchStats = async () => {
  const response = await axios.get(`${API_URL}stats/`, config);
  return response.data;
};
