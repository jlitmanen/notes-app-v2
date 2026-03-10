import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { Auth, Tabs } from "./components";
const { Dashboard, NotesList, RecipesManager, Profile } = Tabs;
import {
  LogOut,
  LayoutDashboard,
  FileText,
  Utensils,
  User,
  Sun,
  Moon,
} from "lucide-react";

function App() {
  const { user, logout, isValid } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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
        </div>
        <div className="header-actions">
          <nav className="flex items-center justify-between flex-wrap bg-teal-500 p-6">
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
            <button
              className={activeTab === "profile" ? "" : "secondary"}
              onClick={() => setActiveTab("profile")}
            >
              <User size={18} /> <span className="hide-mobile">Profile</span>
            </button>
          </nav>
          <div className="user-info">
            <button
              className="secondary"
              onClick={toggleTheme}
              style={{ padding: "0.4rem", borderRadius: "50%" }}
              title={
                theme === "light"
                  ? "Switch to Dark Mode"
                  : "Switch to Light Mode"
              }
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <span style={{ fontWeight: 600 }}>{user?.email}</span>
            <button
              onClick={logout}
              className="secondary"
              style={{ padding: "0.4rem 0.8rem" }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
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
