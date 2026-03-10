import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import pb from "../../pocketbase";
import { User, Save, Settings, Users } from "lucide-react";

export function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pb.collection("users").update(user.id, { name });
      alert("Profile updated!");
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-settings">
      <h2 className="flex items-center gap-2">
        <Settings size={24} /> User Settings
      </h2>

      <div className="responsive-grid">
        <div className="card">
          <h3>Personal Information</h3>
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-2">
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontWeight: 600,
                }}
              >
                Email (Read-only)
              </label>
              <input value={user?.email} disabled style={{ opacity: 0.7 }} />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontWeight: 600,
                }}
              >
                Display Name
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={18}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "14px",
                    color: "#888",
                  }}
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name..."
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: "1rem" }}
            >
              <Save size={18} /> {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Group Membership</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Your notes, lists, and menus can be shared with these groups.
          </p>
          <div
            className="flex items-center gap-2"
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "var(--gray-light)",
              borderRadius: "8px",
            }}
          >
            <Users size={20} color="var(--primary-color)" />
            <div>
              <strong>Current Groups:</strong>
              <div style={{ fontSize: "0.9rem", marginTop: "0.2rem" }}>
                {user?.group?.length > 0 ? (
                  <ul style={{ paddingLeft: "1.2rem", margin: "0.5rem 0" }}>
                    {/* Note: We'd ideally expand these IDs to names, but for now showing status */}
                    <li>Member of {user.group.length} group(s)</li>
                  </ul>
                ) : (
                  <span style={{ fontStyle: "italic" }}>
                    Not a member of any group.
                  </span>
                )}
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: "0.8rem",
              marginTop: "1rem",
              fontStyle: "italic",
            }}
          >
            To join a new group, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
