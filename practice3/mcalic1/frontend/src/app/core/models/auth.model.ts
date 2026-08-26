export interface User {
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'User';
}

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'User';
}