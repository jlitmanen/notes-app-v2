import { useState, useEffect } from "react";
import pb from "../pocketbase";
import { SmartEditor } from "./SmartEditor";
import { useNotes } from "../hooks/useNotes";
import { useRecipes } from "../hooks/useRecipes";
import { parseList, parseMenu } from "../utils/parser";
import {
  Zap,
  ClipboardList,
  Utensils,
  CheckCircle2,
  Circle,
} from "lucide-react";

export function Dashboard() {
  const { saveItem } = useNotes();
  const { recipes } = useRecipes();
  const [activeMenu, setActiveMenu] = useState(null);
  const [incompleteLists, setIncompleteLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch active menu
      const menuResult = await pb.collection("menus").getList(1, 1, {
        sort: "-created",
      });
      if (menuResult.items.length > 0) setActiveMenu(menuResult.items[0]);

      // Fetch lists
      const listResult = await pb.collection("lists").getFullList({
        sort: "-created",
      });
      setIncompleteLists(listResult);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime changes
    pb.collection("menus").subscribe("*", (e) => {
      if (e.action === "create" || e.action === "update") {
        setActiveMenu(e.record);
      }
    });

    pb.collection("lists").subscribe("*", (e) => {
      if (e.action === "create" || e.action === "update") {
        setIncompleteLists((prev) => {
          const exists = prev.find((l) => l.id === e.record.id);
          if (exists) {
            return prev.map((l) => (l.id === e.record.id ? e.record : l));
          }
          return [e.record, ...prev];
        });
      } else if (e.action === "delete") {
        setIncompleteLists((prev) => prev.filter((l) => l.id !== e.record.id));
      }
    });

    return () => {
      pb.collection("menus").unsubscribe();
      pb.collection("lists").unsubscribe();
    };
  }, []);

  const handleQuickSave = async (data) => {
    await saveItem(data);
    alert("Note saved!");
  };

  const getParsedListData = (list) => {
    if (Array.isArray(list.data)) return list.data;
    if (typeof list.data === "string") return parseList(list.data);
    return [];
  };

  const getParsedMenuData = (menu) => {
    if (!menu) return null;
    if (menu.data && typeof menu.data === "object" && !Array.isArray(menu.data))
      return menu.data;
    if (typeof menu.data === "string") return parseMenu(menu.data);
    return null;
  };

  const toggleListItem = async (list, itemIndex, subIndex = null) => {
    const listItems = getParsedListData(list);
    const updatedData = JSON.parse(JSON.stringify(listItems)); // Deep clone

    if (subIndex !== null) {
      if (!updatedData[itemIndex].items) return;
      updatedData[itemIndex].items[subIndex].done =
        !updatedData[itemIndex].items[subIndex].done;
    } else {
      updatedData[itemIndex].done = !updatedData[itemIndex].done;
    }

    // Optimistic update
    setIncompleteLists((prev) =>
      prev.map((l) => (l.id === list.id ? { ...l, data: updatedData } : l)),
    );

    try {
      await pb.collection("lists").update(list.id, { data: updatedData });
    } catch (err) {
      console.error("Error updating list:", err);
      fetchData(); // Rollback on error
    }
  };

  // Filter lists to only show those with at least one incomplete item
  const visibleLists = incompleteLists.filter((list) => {
    const items = getParsedListData(list);
    return items.some((item) => {
      if (item.items) {
        return item.items.some((sub) => !sub.done);
      }
      return !item.done;
    });
  });

  const renderMeal = (meal) => {
    if (!meal) return null;
    const urlMatch = meal.recipe.match(/(https?:\/\/[^\s]+)/);
    const url = urlMatch ? urlMatch[0] : null;
    const label = url ? meal.recipe.replace(url, "").trim() : meal.recipe;

    // Check if it's an @recipe mention
    let finalLabel = label;
    let finalUrl = url;

    if (label.startsWith("@")) {
      const recipeName = label.slice(1).trim();
      const linkedRecipe = recipes.find(
        (r) => r.name.toLowerCase() === recipeName.toLowerCase(),
      );
      if (linkedRecipe) {
        finalLabel = linkedRecipe.name;
        finalUrl = linkedRecipe.link || finalUrl;
      }
    }

    return (
      <div
        key={meal.type}
        style={{ fontSize: "0.95rem", marginBottom: "0.2rem" }}
      >
        <strong style={{ textTransform: "capitalize", color: "#666" }}>
          {meal.type}:
        </strong>{" "}
        {finalUrl ? (
          <a
            href={finalUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "var(--primary-color)",
              textDecoration: "underline",
            }}
          >
            {finalLabel || finalUrl}
          </a>
        ) : (
          finalLabel
        )}
      </div>
    );
  };

  const getMenuDays = () => {
    const data = getParsedMenuData(activeMenu);
    if (!data) return { today: null, tomorrow: null };

    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const now = new Date();
    const todayName = dayNames[now.getDay()];
    const tomorrowName = dayNames[(now.getDay() + 1) % 7];

    return {
      today: { name: todayName, meals: data.days[todayName] || [] },
      tomorrow: { name: tomorrowName, meals: data.days[tomorrowName] || [] },
    };
  };

  const { today, tomorrow } = getMenuDays();

  return (
    <div className="dashboard">
      <div className="responsive-grid">
        <div className="left-column">
          <section style={{ marginBottom: "2rem" }} className="card">
            <h3
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Zap size={20} color="var(--primary-color)" /> .quick
            </h3>
            <SmartEditor onSave={handleQuickSave} />
          </section>
        </div>

        <div className="right-column">
          <section className="card" style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: 0,
              }}
            >
              <Utensils size={20} color="var(--primary-color)" /> .active
            </h3>
            {activeMenu ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    borderBottom: "1px solid #eee",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: "var(--primary-color)",
                    }}
                  >
                    Today ({today.name})
                  </h4>
                  {today.meals.length > 0 ? (
                    today.meals.map(renderMeal)
                  ) : (
                    <p
                      style={{ fontStyle: "italic", color: "#888", margin: 0 }}
                    >
                      No meals planned
                    </p>
                  )}
                </div>
                <div>
                  <h4 style={{ margin: "0 0 0.5rem 0", color: "#888" }}>
                    Tomorrow ({tomorrow.name})
                  </h4>
                  {tomorrow.meals.length > 0 ? (
                    tomorrow.meals.map(renderMeal)
                  ) : (
                    <p
                      style={{ fontStyle: "italic", color: "#888", margin: 0 }}
                    >
                      No meals planned
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ fontStyle: "italic", color: "#666" }}>
                No active menu
              </p>
            )}
          </section>

          <section className="card">
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: 0,
              }}
            >
              <ClipboardList size={20} color="var(--primary-color)" />{" "}
              .incomplete
            </h3>
            {visibleLists.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {visibleLists.map((list) => {
                  const listItems = getParsedListData(list);
                  return (
                    <div
                      key={list.id}
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "0.8rem",
                      }}
                    >
                      <strong
                        style={{ display: "block", marginBottom: "0.5rem" }}
                      >
                        {list.title || list.name}
                      </strong>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {listItems.map((item, idx) => {
                          if (item.items) {
                            // Only show sub-items that aren't done
                            const incompleteSubs = item.items
                              .map((sub, sIdx) => ({
                                ...sub,
                                originalIdx: sIdx,
                              }))
                              .filter((sub) => !sub.done);

                            if (incompleteSubs.length === 0) return null;

                            return (
                              <li
                                key={idx}
                                style={{
                                  marginLeft: "0.5rem",
                                  marginBottom: "0.3rem",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                    color: "#666",
                                  }}
                                >
                                  {item.category || item.name}
                                </div>
                                <ul
                                  style={{
                                    listStyle: "none",
                                    paddingLeft: "0.5rem",
                                  }}
                                >
                                  {incompleteSubs.map((sub) => (
                                    <li
                                      key={sub.originalIdx}
                                      onClick={() =>
                                        toggleListItem(
                                          list,
                                          idx,
                                          sub.originalIdx,
                                        )
                                      }
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        cursor: "pointer",
                                        padding: "0.2rem 0",
                                      }}
                                    >
                                      <Circle size={14} color="#888" />
                                      <span style={{ fontSize: "0.9rem" }}>
                                        {sub.item || sub.name}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            );
                          }

                          // Single item toggle
                          if (item.done) return null;

                          return (
                            <li
                              key={idx}
                              onClick={() => toggleListItem(list, idx)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                marginBottom: "0.2rem",
                                cursor: "pointer",
                                padding: "0.2rem 0",
                              }}
                            >
                              <Circle size={14} color="#888" />
                              <span style={{ fontSize: "0.9rem" }}>
                                {item.item || item.name}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontStyle: "italic", color: "#666" }}>
                No active lists
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
