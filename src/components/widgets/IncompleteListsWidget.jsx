import { useState } from "react";
import { ClipboardList, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { parseList } from "../../utils/parser";

export function IncompleteListsWidget({ incompleteLists, onToggle }) {
  const [isExpanded, setIsExpanded] = useState(window.innerWidth > 768);

  const getParsedListData = (list) => {
    if (Array.isArray(list.data)) return list.data;
    if (typeof list.data === "string") return parseList(list.data);
    return [];
  };

  const visibleLists = incompleteLists.filter((list) => {
    const items = getParsedListData(list);
    return items.some((item) => {
      if (item.items) {
        return item.items.some((sub) => !sub.done);
      }
      return !item.done;
    });
  });

  return (
    <section className="card">
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
          <ClipboardList size={20} color="var(--primary-color)" /> Incomplete Lists
        </h3>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isExpanded && (
        <div style={{ marginTop: '1.5rem' }}>
          {visibleLists.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {visibleLists.map((list) => {
                const listItems = getParsedListData(list);
                return (
                  <div key={list.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem' }}>{list.title || list.name}</strong>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {listItems.map((item, idx) => {
                        if (item.items) {
                          const incompleteSubs = item.items
                            .map((sub, sIdx) => ({ ...sub, originalIdx: sIdx }))
                            .filter((sub) => !sub.done);

                          if (incompleteSubs.length === 0) return null;

                          return (
                            <li key={idx} style={{ marginLeft: "0.5rem", marginBottom: "0.3rem" }}>
                              <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-muted)" }}>
                                {item.category || item.name}
                              </div>
                              <ul style={{ listStyle: "none", paddingLeft: "0.5rem" }}>
                                {incompleteSubs.map((sub) => (
                                  <li
                                    key={sub.originalIdx}
                                    onClick={() => onToggle(list, idx, sub.originalIdx)}
                                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.2rem 0" }}
                                  >
                                    <Circle size={14} color="var(--text-muted)" />
                                    <span style={{ fontSize: "0.9rem" }}>{sub.item || sub.name}</span>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          );
                        }

                        if (item.done) return null;

                        return (
                          <li
                            key={idx}
                            onClick={() => onToggle(list, idx)}
                            style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem", cursor: "pointer", padding: "0.2rem 0" }}
                          >
                            <Circle size={14} color="var(--text-muted)" />
                            <span style={{ fontSize: "0.9rem" }}>{item.item || item.name}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>No active lists</p>
          )}
        </div>
      )}
    </section>
  );
}
