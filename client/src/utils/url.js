const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3020";

export function buildFileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return API_BASE_URL + path;
}