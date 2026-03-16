import { HelpCircle, X, Info } from "lucide-react";

export function EditorGuide({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        padding: "1rem",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "500px",
          margin: 0,
          maxHeight: "85vh",
          overflowY: "auto",
          position: "relative",
          animation: "modalFadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "0.8rem",
          }}
        >
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <HelpCircle size={24} color="var(--primary-color)" /> Editor Guide
          </h2>
          <button
            className="secondary"
            onClick={onClose}
            style={{ padding: "0.2rem", borderRadius: "50%" }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <section>
            <h3 style={{ fontSize: "1rem", color: "var(--primary-color)", marginBottom: "0.5rem" }}>
              📝 Lists Shorthand
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Switch mode to <strong>List</strong> to enable interactive checkboxes.
            </p>
            <div
              style={{
                background: "var(--gray-light)",
                padding: "0.8rem",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "0.85rem",
                whiteSpace: "pre-wrap",
                border: "1px solid var(--border-color)",
              }}
            >
              {`Groceries:
- Milk
- Bread

To-do:
- Fix the leak`}
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: "1rem", color: "var(--primary-color)", marginBottom: "0.5rem" }}>
              🍳 Menus & Recipes
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Switch mode to <strong>Menu</strong> for meal planning.
            </p>
            <div
              style={{
                background: "var(--gray-light)",
                padding: "0.8rem",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "0.85rem",
                whiteSpace: "pre-wrap",
                border: "1px solid var(--border-color)",
                marginBottom: "0.5rem",
              }}
            >
              {`active
from 2026-03-16
Monday
 Lunch: @Salad
 Dinner: Pizza`}
            </div>
            <ul style={{ fontSize: "0.85rem", paddingLeft: "1.2rem", margin: 0 }}>
              <li><strong>active</strong>: Shows this menu on the dashboard.</li>
              <li><strong>@recipe</strong>: Links to a saved recipe (type @ to search).</li>
              <li><strong>Day names</strong>: Monday, Tuesday, etc. trigger daily slots.</li>
            </ul>
          </section>

          <section
            style={{
              padding: "0.8rem",
              background: "rgba(59, 130, 246, 0.1)",
              borderRadius: "8px",
              display: "flex",
              gap: "0.8rem",
              alignItems: "flex-start",
            }}
          >
            <Info size={18} color="var(--primary-color)" style={{ marginTop: "0.2rem" }} />
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              Use the <strong>Preview</strong> button anytime to see how your shorthand will look on the dashboard or list view.
            </p>
          </section>
        </div>

        <button
          onClick={onClose}
          style={{ width: "100%", marginTop: "1.5rem" }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
