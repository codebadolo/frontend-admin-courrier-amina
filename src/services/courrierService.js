import axios from "axios";
const BASE = "http://localhost:8000/api/courriers/"; // adapte

export const getCourriers = async (params = {}) => {
  const res = await axios.get(`${BASE}courriers/`, { params });
  return res.data;
};

export const getCourrier = async (id) => {
  const res = await axios.get(`${BASE}courriers/${id}/`);
  return res.data;
};

export const createCourrier = async (payload) => {
  const res = await axios.post(`${BASE}courriers/`, payload);
  return res.data;
};

export const updateCourrier = async (id, payload) => {
  const res = await axios.put(`${BASE}courriers/${id}/`, payload);
  return res.data;
};

export const deleteCourrier = async (id) => {
  const res = await axios.delete(`${BASE}courriers/${id}/`);
  return res.data;
};

export const uploadPieceJointe = async (formData) => {
  const res = await axios.post(`${BASE}pieces/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
