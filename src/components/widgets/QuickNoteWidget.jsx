import { useState } from "react";
import { Zap, ChevronDown, ChevronUp } from "lucide-react";
import { SmartEditor } from "../SmartEditor";

export function QuickNoteWidget({ onSave }) {
  const [isExpanded, setIsExpanded] = useState(window.innerWidth > 768);

  const handleSave = (data) => {
    onSave(data);
    setIsExpanded(false);
  };

  return (
    <section style={{ marginBottom: "2rem" }} className="card">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          cursor: "pointer"
        }}
      >
        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
          <Zap size={20} color="var(--primary-color)" /> Quick Save
        </h3>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      
      {isExpanded && (
        <div style={{ marginTop: '1.5rem' }}>
          <SmartEditor onSave={handleSave} />
        </div>
      )}
    </section>
  );
}
