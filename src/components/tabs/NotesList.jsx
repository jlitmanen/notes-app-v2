import { useState } from "react";
import { useNotes } from "../../hooks/useNotes";
import { useGroups } from "../../hooks/useGroups";
import { SmartEditor } from "../SmartEditor";
import { deparseList, deparseMenu } from "../../utils/parser";
import {
  FileText,
  List,
  Utensils,
  Trash2,
  Edit2,
  Plus,
  Search,
  Users,
  X,
  Check,
} from "lucide-react";

export function NotesList() {
  const { items, loading, saveItem, deleteItem, updateSharing } = useNotes();
  const { groups } = useGroups();
  const [editingItem, setEditingItem] = useState(null);
  const [sharingItem, setSharingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type) => {
    switch (type) {
      case "note":
        return <FileText size={20} color="var(--dark-color)" />;
      case "list":
        return <List size={20} color="var(--primary-color)" />;
      case "menu":
        return <Utensils size={20} color="var(--accent-color)" />;
      default:
        return null;
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const onSaveEdit = async (data) => {
    await saveItem(data, editingItem.id);
    setEditingItem(null);
  };

  const toggleGroupSelection = (groupId) => {
    const currentGroups = sharingItem.groups || [];
    const newGroups = currentGroups.includes(groupId)
      ? currentGroups.filter((id) => id !== groupId)
      : [...currentGroups, groupId];

    setSharingItem({ ...sharingItem, groups: newGroups });
  };

  const handleSaveSharing = async () => {
    await updateSharing(sharingItem, sharingItem.groups);
    setSharingItem(null);
  };

  if (editingItem) {
    const getEditableData = (item) => {
      if (typeof item.data === "string") return item.data;
      if (item.type === "list") return deparseList(item.data);
      if (item.type === "menu") return deparseMenu(item.data);
      return "";
    };

    return (
      <div className="edit-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2>Editing {editingItem.type}</h2>
          <button className="secondary" onClick={() => setEditingItem(null)}>
            Cancel
          </button>
        </div>
        <SmartEditor
          onSave={onSaveEdit}
          initialData={{
            title: editingItem.title,
            data: getEditableData(editingItem),
            mode: editingItem.type,
          }}
        />
      </div>
    );
  }

  return (
    <div className="notes-list">
      <div className="flex flex-col gap-1" style={{ marginBottom: "2rem" }}>
        <div className="responsive-grid" style={{ gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <Search
              style={{
                position: "absolute",
                left: "10px",
                top: "12px",
                color: "#888",
              }}
              size={18}
            />
            <input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="note">Notes</option>
            <option value="list">Lists</option>
            <option value="menu">Menus</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading items...</p>
      ) : (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  minWidth: 0,
                }}
              >
                <div style={{ flexShrink: 0 }}>{getIcon(item.type)}</div>
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <h4
                    style={{
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </h4>
                  <small style={{ color: "#888" }}>
                    {new Date(item.created).toLocaleDateString()} •{" "}
                    {item.type.toUpperCase()}
                    {item.groups?.length > 0 && (
                      <span
                        style={{
                          color: "var(--primary-color)",
                          marginLeft: "0.5rem",
                        }}
                      >
                        • SHARED ({item.groups.length})
                      </span>
                    )}
                  </small>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  className="secondary"
                  onClick={() => setSharingItem(item)}
                  style={{
                    padding: "0.4rem",
                    color:
                      item.groups?.length > 0 ? "var(--primary-color)" : "#888",
                  }}
                  title="Share with groups"
                >
                  <Users size={16} />
                </button>
                <button
                  className="secondary"
                  onClick={() => handleEdit(item)}
                  style={{ padding: "0.4rem" }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="secondary"
                  onClick={() => deleteItem(item.type, item.id)}
                  style={{ padding: "0.4rem", color: "var(--accent-color)" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <p
              style={{
                textAlign: "center",
                fontStyle: "italic",
                color: "#666",
              }}
            >
              No items found.
            </p>
          )}
        </div>
      )}

      {sharingItem && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "400px", margin: 0 }}
          >
            <div
              className="flex justify-between items-center"
              style={{ marginBottom: "1.5rem" }}
            >
              <h3 style={{ margin: 0 }}>Share Item</h3>
              <button
                className="secondary"
                onClick={() => setSharingItem(null)}
                style={{ padding: "0.2rem" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
              Select groups to share this item with:
            </p>

            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                marginBottom: "1.5rem",
              }}
            >
              {groups.length > 0 ? (
                groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => toggleGroupSelection(group.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.8rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: sharingItem.groups?.includes(group.id)
                        ? "var(--bg-color)"
                        : "transparent",
                      marginBottom: "0.4rem",
                      border: "1px solid #eee",
                    }}
                  >
                    <span>{group.name}</span>
                    {sharingItem.groups?.includes(group.id) && (
                      <Check size={18} color="var(--primary-color)" />
                    )}
                  </div>
                ))
              ) : (
                <p
                  style={{
                    fontStyle: "italic",
                    color: "#888",
                    textAlign: "center",
                  }}
                >
                  No groups found.
                </p>
              )}
            </div>

            <button className="w-full" onClick={handleSaveSharing}>
              Update Sharing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
