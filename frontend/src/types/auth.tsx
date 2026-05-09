// Matches the shape of the "user" object returned by both
// POST /api/auth/login and POST /api/auth/register
export interface User {
  id: number;
  email: string;
  name: string;
  role: "patient" | "physician";
}

// What the login/register API endpoints return
export interface AuthResponse {
  token: string;
  user: User;
}

// Everything AuthContext exposes to the rest of the app
export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
}