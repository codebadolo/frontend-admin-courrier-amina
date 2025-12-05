import axios from "axios";
const BASE = "http://localhost:8000/api/ia/";

export const getIAResults = async () => {
  const res = await axios.get(`${BASE}`);
  return res.data;
};

export const processCourrier = async (courrierId) => {
  const res = await axios.post(`${BASE}${courrierId}/process/`);
  return res.data;
};
