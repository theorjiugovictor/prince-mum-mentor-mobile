import apiClient from "./apiClient";

const TASKS_ENDPOINT = "/api/v1/tasks";

// --- Fetch Tasks with Optional Query Params ---
export async function fetchTasks(params?: {
  page?: number;
  per_page?: number;
  task_status?: string;
}) {
  const query: Record<string, any> = {};

  if (params?.page) query.page = params.page;
  if (params?.per_page) query.per_page = params.per_page;
  if (params?.task_status) query.task_status = params.task_status;

  try {
    const response = await apiClient.get(TASKS_ENDPOINT, { params: query });
    return response.data;
  } catch (error) {
    console.debug("Error fetching tasks:", error);
    return null;
  }
}

// --- Delete Task by ID ---
export async function deleteTask(taskId: string) {
  try {
    const response = await apiClient.delete(`${TASKS_ENDPOINT}/${taskId}`);
    return response.data;
  } catch (error) {
    console.debug("Error deleting task:", error);
    return null;
  }
}
