import axios from "axios";

const API_URL = "http://localhost:8000/api/courriers/";

const token = localStorage.getItem("token");
const config = { headers: { Authorization: `Bearer ${token}` } };

export const fetchCourriers = async () => {
  const response = await axios.get(API_URL, config);
  return response.data;
};

export const createCourrier = async (data) => {
  const response = await axios.post(API_URL, data, config);
  return response.data;
};

export const updateCourrier = async (id, data) => {
  const response = await axios.put(`${API_URL}${id}/`, data, config);
  return response.data;
};
