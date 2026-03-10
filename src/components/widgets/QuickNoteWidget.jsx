import { Zap } from "lucide-react";
import { SmartEditor } from "./../SmartEditor";

export function QuickNoteWidget({ onSave }) {
  return (
    <section style={{ marginBottom: "2rem" }} className="card">
      <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Zap size={20} color="var(--primary-color)" /> Quick Save
      </h3>
      <SmartEditor onSave={onSave} />
    </section>
  );
}
