import axios from "axios";
const BASE = "http://localhost:8000/api/archives/";

export const getArchives = async (params = {}) => {
  const res = await axios.get(BASE, { params });
  return res.data;
};

export const downloadArchive = async (id) => {
  const res = await axios.get(`${BASE}${id}/download/`, { responseType: "blob" });
  return res.data;
};
