import axios from "axios";
const BASE = "http://localhost:8000/api/workflow/";

export const getWorkflows = async () => {
  const res = await axios.get(BASE);
  return res.data;
};

export const getWorkflowByCourrier = async (courrierId) => {
  const res = await axios.get(`${BASE}${courrierId}/`);
  return res.data;
};

export const postWorkflowAction = async (stepId, payload) => {
  const res = await axios.post(`${BASE}${stepId}/action/`, payload);
  return res.data;
};
