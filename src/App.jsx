import { useState, useEffect, useRef } from "react";
import { useAuth } from "./hooks/useAuth";
import {
  Auth,
  Dashboard,
  NotesList,
  RecipesManager,
  Profile,
} from "./components";
import {
  LogOut,
  LayoutDashboard,
  FileText,
  Utensils,
  User,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";

function App() {
  const { user, logout, isValid } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (!isValid) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <h1 style={{ margin: 0 }}>.notes</h1>
          
          <div className="user-menu-container" style={{ position: "relative" }} ref={menuRef}>
            <button
              className="secondary"
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <User size={18} />
              <span className="hide-mobile">{user?.email}</span>
              <ChevronDown
                size={14}
                style={{
                  transform: isUserMenuOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {isUserMenuOpen && (
              <div
                className="card"
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "0.5rem",
                  width: "200px",
                  zIndex: 100,
                  padding: "0.5rem",
                  boxShadow: "0 4px 12px var(--card-shadow)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <button
                  className="secondary"
                  style={{ justifyContent: "flex-start", border: "none", width: "100%" }}
                  onClick={() => {
                    setActiveTab("profile");
                    setIsUserMenuOpen(false);
                  }}
                >
                  <User size={16} /> Profile
                </button>
                <button
                  className="secondary"
                  style={{ justifyContent: "flex-start", border: "none", width: "100%" }}
                  onClick={toggleTheme}
                >
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </button>
                <div style={{ borderTop: "1px solid var(--border-color)", margin: "0.25rem 0" }}></div>
                <button
                  className="secondary"
                  style={{
                    justifyContent: "flex-start",
                    border: "none",
                    width: "100%",
                    color: "var(--accent-color)",
                  }}
                  onClick={logout}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="header-actions">
          <nav className="nav-tabs">
            <button
              className={activeTab === "dashboard" ? "" : "secondary"}
              onClick={() => setActiveTab("dashboard")}
            >
              <LayoutDashboard size={18} />{" "}
              <span className="hide-mobile">Dashboard</span>
            </button>
            <button
              className={activeTab === "notes" ? "" : "secondary"}
              onClick={() => setActiveTab("notes")}
            >
              <FileText size={18} /> <span className="hide-mobile">Notes</span>
            </button>
            <button
              className={activeTab === "recipes" ? "" : "secondary"}
              onClick={() => setActiveTab("recipes")}
            >
              <Utensils size={18} />{" "}
              <span className="hide-mobile">Recipes</span>
            </button>
          </nav>
        </div>
      </header>

      <main>
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "notes" && <NotesList />}
        {activeTab === "recipes" && <RecipesManager />}
        {activeTab === "profile" && <Profile />}
      </main>
    </div>
  );
}

export default App;
