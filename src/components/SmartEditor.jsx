import { useState, useRef, useMemo } from "react";
import { parseList, parseMenu } from "../utils/parser";
import { useRecipes } from "../hooks/useRecipes";
import {
  FileText,
  List,
  Utensils,
  Eye,
  Save,
  AtSign,
  Loader2,
} from "lucide-react";

export function SmartEditor({ onSave, initialData = null }) {
  const [content, setContent] = useState(initialData?.data || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [mode, setMode] = useState(initialData?.mode || "note");
  const [preview, setPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const parsedData = useMemo(() => {
    if (mode === "list") {
      return parseList(content);
    } else if (mode === "menu") {
      return parseMenu(content);
    }
    return null;
  }, [content, mode]);

  // Recipe Picker State
  const { recipes } = useRecipes();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerFilter, setPickerFilter] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef(null);

  const handleTextChange = (e) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);
    setCursorPos(pos);

    // Check for @ trigger
    const lastAtIdx = val.lastIndexOf("@", pos - 1);
    if (lastAtIdx !== -1 && !val.slice(lastAtIdx, pos).includes(" ")) {
      setShowPicker(true);
      setPickerFilter(val.slice(lastAtIdx + 1, pos));
    } else {
      setShowPicker(false);
    }
  };

  const insertRecipe = (recipeName) => {
    const lastAtIdx = content.lastIndexOf("@", cursorPos - 1);
    const newContent =
      content.slice(0, lastAtIdx) +
      `@${recipeName} ` +
      content.slice(cursorPos);
    setContent(newContent);
    setShowPicker(false);
    textareaRef.current.focus();
  };

  const handleSave = async () => {
    if (!content.trim() && !title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({ title, content, mode, parsedData });
      // Only clear if it was a "new" note (not editing)
      if (!initialData) {
        setContent("");
        setTitle("");
        setPreview(false);
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(pickerFilter.toLowerCase()),
  );

  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        position: "relative",
        padding: "1rem",
      }}
    >
      <input
        placeholder="Title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ fontSize: "1.2rem", fontWeight: "bold" }}
      />

      <div
        className="toolbar"
        style={{
          display: "flex",
          gap: "0.25rem",
          background: "var(--gray-light)",
          padding: "0.25rem",
          borderRadius: "8px",
        }}
      >
        <button
          onClick={() => setMode("note")}
          className={mode === "note" ? "" : "secondary"}
          style={{ flex: 1, padding: "0.5rem 0.25rem", fontSize: "0.85rem" }}
        >
          <FileText size={16} /> <span className="hide-mobile">Note</span>
        </button>
        <button
          onClick={() => setMode("list")}
          className={mode === "list" ? "" : "secondary"}
          style={{ flex: 1, padding: "0.5rem 0.25rem", fontSize: "0.85rem" }}
        >
          <List size={16} /> <span className="hide-mobile">List</span>
        </button>
        <button
          onClick={() => setMode("menu")}
          className={mode === "menu" ? "" : "secondary"}
          style={{ flex: 1, padding: "0.5rem 0.25rem", fontSize: "0.85rem" }}
        >
          <Utensils size={16} /> <span className="hide-mobile">Menu</span>
        </button>
      </div>

      <div style={{ position: "relative" }}>
        {!preview ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyUp={(e) => setCursorPos(e.target.selectionStart)}
            onMouseUp={(e) => setCursorPos(e.target.selectionStart)}
            placeholder={`Enter your ${mode}... Use @ to link recipes.`}
            style={{ minHeight: "200px", resize: "vertical" }}
          />
        ) : (
          <div
            className="preview-container"
            style={{
              minHeight: "200px",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "1rem",
              overflowY: "auto",
              background: "var(--white)",
            }}
          >
            {mode === "note" && (
              <div
                dangerouslySetInnerHTML={{
                  __html: content.replace(/\n/g, "<br/>"),
                }}
              />
            )}
            {mode === "list" && (
              <div>
                {parsedData?.map((item, idx) =>
                  item.items ? (
                    <div key={idx} style={{ marginBottom: "1rem" }}>
                      <strong>{item.category || item.name}</strong>
                      <ul style={{ listStyle: "none", paddingLeft: "1rem" }}>
                        {item.items.map((sub, i) => (
                          <li key={i}>
                            <input
                              type="checkbox"
                              readOnly
                              checked={sub.done}
                            />{" "}
                            {sub.item || sub.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div key={idx}>
                      <input type="checkbox" readOnly />{" "}
                      {item.item || item.name}
                    </div>
                  ),
                )}
              </div>
            )}
            {mode === "menu" && (
              <div>
                {parsedData?.active && (
                  <span
                    style={{
                      background: "var(--primary-color)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                  >
                    ACTIVE
                  </span>
                )}
                <p>
                  {parsedData?.start} - {parsedData?.end}
                </p>
                {(Array.isArray(parsedData?.days)
                  ? parsedData.days
                  : Object.entries(parsedData?.days || {}).map(
                      ([day, meals]) => ({ day, meals }),
                    )
                ).map(({ day, meals }) => (
                  <div key={day} style={{ marginBottom: "1rem" }}>
                    <h4
                      style={{
                        margin: "0.5rem 0",
                        textTransform: "capitalize",
                      }}
                    >
                      {day}
                    </h4>
                    {meals.map((meal, i) => (
                      <div
                        key={i}
                        style={{
                          paddingLeft: "1rem",
                          borderLeft: "2px solid var(--primary-color)",
                        }}
                      >
                        <strong>{meal.type}:</strong> {meal.recipe}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showPicker && (
          <div
            className="recipe-picker"
            style={{
              position: "absolute",
              bottom: "100%",
              left: "0",
              width: "100%",
              maxHeight: "200px",
              overflowY: "auto",
              background: "var(--white)",
              border: "2px solid var(--primary-color)",
              borderRadius: "8px",
              zIndex: 10,
              boxShadow: "0 -4px 12px var(--card-shadow)",
            }}
          >
            <div
              style={{
                padding: "0.5rem",
                borderBottom: "1px solid var(--border-color)",
                background: "var(--gray-light)",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <AtSign size={14} /> Linking Recipe...
            </div>
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => insertRecipe(r.name)}
                  style={{
                    padding: "0.8rem",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "var(--gray-light)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "transparent")
                  }
                >
                  {r.name}
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "1rem",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                }}
              >
                No recipes found
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => setPreview(!preview)}
          className="secondary"
          style={{ flex: 1 }}
        >
          <Eye size={18} /> {preview ? "Edit" : "Preview"}
        </button>
        <button onClick={handleSave} disabled={isSaving} style={{ flex: 1 }}>
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
