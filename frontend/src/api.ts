import axios from 'axios';

// Configure Axios to point to the Laravel API
// If your Laravel API is running on a different port, update it here.
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default api;
