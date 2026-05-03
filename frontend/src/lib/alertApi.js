import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

export const endpoints = {
  health: () => api.get("/health").then((r) => r.data),
  marketStatus: () => api.get("/market-status").then((r) => r.data),
  search: (q) => api.get("/search", { params: { q } }).then((r) => r.data),
  quote: (symbol) => api.get("/quote", { params: { symbol } }).then((r) => r.data),
  listWatchlist: () => api.get("/watchlist").then((r) => r.data),
  addWatchlist: (payload) => api.post("/watchlist", payload).then((r) => r.data),
  updateWatchlist: (id, payload) => api.patch(`/watchlist/${id}`, payload).then((r) => r.data),
  deleteWatchlist: (id) => api.delete(`/watchlist/${id}`).then((r) => r.data),
  refreshWatchlist: () => api.post("/watchlist/refresh").then((r) => r.data),
  listAlerts: (limit = 50) => api.get("/alerts", { params: { limit } }).then((r) => r.data),
  getSettings: () => api.get("/settings").then((r) => r.data),
  updateSettings: (payload) => api.put("/settings", payload).then((r) => r.data),
  updateTelegram: (payload) => api.put("/settings/telegram", payload).then((r) => r.data),
  clearTelegram: () => api.delete("/settings/telegram").then((r) => r.data),
  testTelegram: () => api.post("/settings/telegram/test").then((r) => r.data),
};
