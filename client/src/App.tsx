import React, { useState, useEffect } from "react";
import TaskList from "./components/TaskList.tsx";
import axios from "axios";
import Dashboard from "./components/Dashboard.tsx";

interface User {
  id: string;
  email: string;
}
const BACKEND_URL = process.env.REACT_APP_SERVER_URL;
const NavHeader = ({ onSignOut }: { onSignOut: () => void }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const handleNavigation = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <button
              onClick={() => handleNavigation("/dashboard")}
              className={`inline-flex items-center px-4 h-16 text-lg ${
                currentPath === "/dashboard"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNavigation("/tasks")}
              className={`inline-flex items-center px-4 h-16 text-lg ${
                currentPath === "/tasks"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600"
              }`}
            >
              Task list
            </button>
          </div>
          <button
            onClick={onSignOut}
            className="inline-flex items-center px-4 py-2 my-auto text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
};

const LoginPage = ({
  onLoginSuccess,
}: {
  onLoginSuccess: (token: string, user: User) => void;
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${BACKEND_URL}api/auth/login`,
        formData,
        {
          withCredentials: true,
        }
      );

      const data = await response.data;

      localStorage.setItem("token", data.token);
      onLoginSuccess(data.token, data.user);

      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16">
            <div className="flex">
              <span className="inline-flex items-center px-4 h-16 text-lg text-gray-400">
                Dashboard
              </span>
              <span className="inline-flex items-center px-4 h-16 text-lg text-gray-400">
                Task list
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg mx-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to To-do app
            </h1>
            <p className="text-gray-600">Sign in to continue</p>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Email ID"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors 
                ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? "Signing in..." : "Sign in to continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || currentPath === "/") {
      setCurrentPath("/");
    }
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  const handleLoginSuccess = (token: string, user: User) => {
    setUser(user);
    setCurrentPath("/dashboard");
    window.history.pushState({}, "", "/dashboard");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPath("/");
    window.history.pushState({}, "", "/");
  };

  if (!isAuthenticated && currentPath !== "/") {
    setCurrentPath("/");
    window.history.pushState({}, "", "/");
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
      {isAuthenticated ? (
        <>
          <NavHeader onSignOut={handleLogout} />
          {currentPath === "/dashboard" && <Dashboard />}
          {currentPath === "/tasks" && <TaskList />}
        </>
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;
