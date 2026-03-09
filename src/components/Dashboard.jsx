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
  X,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export function Dashboard() {
  const { saveItem } = useNotes();
  const { recipes } = useRecipes();
  const [activeMenu, setActiveMenu] = useState(null);
  const [incompleteLists, setIncompleteLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingRecipe, setViewingRecipe] = useState(null);

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
    let hasExtraContent = !!url && !!label; // If it has both name and URL, it's viewable
    let linkedRecipe = null;

    if (label.startsWith("@")) {
      const recipeName = label.slice(1).trim();
      linkedRecipe = recipes.find(
        (r) => r.name.toLowerCase() === recipeName.toLowerCase(),
      );
      if (linkedRecipe) {
        finalLabel = linkedRecipe.name;
        finalUrl = linkedRecipe.link || finalUrl;
        // It has extra content if it has instructions, ingredients, or a link with a name
        hasExtraContent = !!(
          linkedRecipe.instructions ||
          linkedRecipe.ingredients ||
          (linkedRecipe.link && linkedRecipe.name)
        );
      }
    }

    const handleMealClick = (e) => {
      if (hasExtraContent) {
        e.preventDefault();
        setViewingRecipe(linkedRecipe || { name: finalLabel, link: finalUrl });
      }
    };

    return (
      <div
        key={meal.type}
        style={{ fontSize: "0.95rem", marginBottom: "0.2rem" }}
      >
        <strong
          style={{ textTransform: "capitalize", color: "var(--text-muted)" }}
        >
          {meal.type}:
        </strong>{" "}
        {finalUrl && !hasExtraContent ? (
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
          <span
            onClick={handleMealClick}
            style={{
              cursor: hasExtraContent ? "pointer" : "default",
              color: hasExtraContent ? "var(--primary-color)" : "inherit",
              textDecoration: hasExtraContent ? "underline" : "none",
            }}
          >
            {finalLabel}
            {hasExtraContent && (
              <BookOpen
                size={12}
                style={{ marginLeft: "0.3rem", display: "inline" }}
              />
            )}
          </span>
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

    const sortMeals = (meals) => {
      return [...(meals || [])].sort((a, b) => {
        if (a.type.toLowerCase() === "lunch") return -1;
        if (b.type.toLowerCase() === "lunch") return 1;
        return 0;
      });
    };

    return {
      today: { name: todayName, meals: sortMeals(data.days[todayName]) },
      tomorrow: {
        name: tomorrowName,
        meals: sortMeals(data.days[tomorrowName]),
      },
    };
  };

  const renderIngredients = (ingredients) => {
    if (!ingredients) return "";
    
    let items = [];
    if (Array.isArray(ingredients)) {
      items = ingredients.map(ig => {
        if (typeof ig === 'string') return ig;
        return ig.item || ig.name || JSON.stringify(ig);
      });
    } else if (typeof ingredients === 'string') {
      items = ingredients.split(/,|\n/).map(item => item.trim()).filter(Boolean);
    } else {
      items = [String(ingredients)];
    }
    
    return items.join('<br/>');
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
              <Zap size={20} color="var(--primary-color)" /> Quick Save
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
              <Utensils size={20} color="var(--primary-color)" /> Active Menu
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
                    borderBottom: "1px solid var(--border-color)",
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
                      style={{
                        fontStyle: "italic",
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      No meals planned
                    </p>
                  )}
                </div>
                <div>
                  <h4
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: "var(--text-muted)",
                    }}
                  >
                    Tomorrow ({tomorrow.name})
                  </h4>
                  {tomorrow.meals.length > 0 ? (
                    tomorrow.meals.map(renderMeal)
                  ) : (
                    <p
                      style={{
                        fontStyle: "italic",
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      No meals planned
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>
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
              Incomplete Lists
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
                        borderBottom: "1px solid var(--border-color)",
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
                                    color: "var(--text-muted)",
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
                                      <Circle
                                        size={14}
                                        color="var(--text-muted)"
                                      />
                                      <span style={{ fontSize: "0.9rem" }}>
                                        {sub.item || sub.name}
                                      </span>
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
                              <Circle size={14} color="var(--text-muted)" />
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
              <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>
                No active lists
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Recipe Viewer Modal */}
      {viewingRecipe && (
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
            style={{
              width: "100%",
              maxWidth: "600px",
              margin: 0,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              className="flex justify-between items-center"
              style={{
                marginBottom: "1.5rem",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: "0.5rem",
              }}
            >
              <h2 style={{ margin: 0 }}>{viewingRecipe.name}</h2>
              <button
                className="secondary"
                onClick={() => setViewingRecipe(null)}
                style={{ padding: "0.2rem" }}
              >
                <X size={20} />
              </button>
            </div>

            {viewingRecipe.link && (
              <div style={{ marginBottom: "1.5rem" }}>
                <a
                  href={viewingRecipe.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2"
                  style={{ color: "var(--primary-color)", fontWeight: 600 }}
                >
                  <ExternalLink size={18} /> View Original Source
                </a>
              </div>
            )}

            {viewingRecipe.ingredients && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.5rem" }}>Ingredients</h4>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    padding: "1rem",
                    background: "var(--gray-light)",
                    borderRadius: "8px",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderIngredients(viewingRecipe.ingredients)
                  }}
                />
              </div>
            )}

            {viewingRecipe.instructions && (
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{ marginBottom: "0.5rem" }}>Instructions</h4>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    padding: "1rem",
                    background: "var(--gray-light)",
                    borderRadius: "8px",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: typeof viewingRecipe.instructions === 'string' 
                      ? viewingRecipe.instructions 
                      : JSON.stringify(viewingRecipe.instructions),
                  }}
                />
              </div>
            )}

            {!viewingRecipe.ingredients && !viewingRecipe.instructions && (
              <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>
                No additional details available for this recipe.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
