import axios from "axios";
const BASE = "http://localhost:8000/api/dashboard/";

export const getStats = async () => {
  const res = await axios.get(`${BASE}stats/`);
  return res.data;
};

export const getReports = async (params) => {
  const res = await axios.get(`${BASE}reports/`, { params });
  return res.data;
};
