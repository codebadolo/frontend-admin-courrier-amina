import axios from "axios";

const API_URL = "http://localhost:8000/api/archives/";
const token = localStorage.getItem("token");
const config = { headers: { Authorization: `Bearer ${token}` } };

export const fetchArchives = async () => {
  const response = await axios.get(API_URL, config);
  return response.data;
};

export const downloadArchive = async (id) => {
  const response = await axios.get(`${API_URL}${id}/download/`, { ...config, responseType: "blob" });
  return response.data;
};
