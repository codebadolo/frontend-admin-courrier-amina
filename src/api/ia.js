import axios from "axios";

const API_URL = "http://localhost:8000/api/ia/";
const token = localStorage.getItem("token");
const config = { headers: { Authorization: `Bearer ${token}` } };

export const fetchIAResults = async () => {
  const response = await axios.get(API_URL, config);
  return response.data;
};

export const processCourrierIA = async (courrierId) => {
  const response = await axios.post(`${API_URL}${courrierId}/process/`, {}, config);
  return response.data;
};
