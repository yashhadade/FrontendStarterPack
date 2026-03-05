import { authHeader } from '@/helpers/authHeader';
import axios from 'axios';
export const server = axios.create({

  baseURL:import.meta.env.VITE_SERVER_URL || 'http://localhost:5003/', 

  responseType: 'json',
  headers: {
    // "Access-Control-Allow-Origin": "*",
    // "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
    // Authorization: authHeader(),
  },
});
server.interceptors.request.use( (config)=> {
    const token = authHeader();
    config.headers.Authorization =  token;
    return config;
  }, null, { synchronous: true });