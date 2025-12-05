import axios from "axios";

const API_URL = "http://localhost:8000/api/workflow/";
const token = localStorage.getItem("token");
const config = { headers: { Authorization: `Bearer ${token}` } };

export const fetchWorkflows = async () => {
  const response = await axios.get(API_URL, config);
  return response.data;
};

export const actionWorkflow = async (stepId, action, commentaire = "") => {
  const response = await axios.post(`${API_URL}${stepId}/action/`, { action, commentaire }, config);
  return response.data;
};
