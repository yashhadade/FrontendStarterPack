export function authHeader() {
  // return authorization header with jwt token
  const token = localStorage.getItem('access');
  if (token) {
    return `Bearer ${token}`;
  }
}
