import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token,  setToken]=useState(null);
  const [role,setRole]=useState(null);
  useEffect(() => {
    const id = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token) setToken(token);
    if(role) setRole(role);
    if(id)setUser(id);
  }, []);

  return <UserContext.Provider value={{ user, setUser ,token,  setToken,role,setRole}}>{children}</UserContext.Provider>;
}