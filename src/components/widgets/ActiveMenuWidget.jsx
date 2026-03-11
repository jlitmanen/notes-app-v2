import { useState } from "react";
import { Utensils, BookOpen, X, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { parseMenu } from "../../utils/parser";

export function ActiveMenuWidget({ activeMenu, recipes }) {
  const [isExpanded, setIsExpanded] = useState(window.innerWidth > 768);
  const [viewingRecipe, setViewingRecipe] = useState(null);

  const getParsedMenuData = (menu) => {
    if (!menu) return null;
    if (menu.data && typeof menu.data === "object" && !Array.isArray(menu.data))
      return menu.data;
    if (typeof menu.data === "string") return parseMenu(menu.data);
    return null;
  };

  const renderMeal = (meal) => {
    if (!meal) return null;
    const urlMatch = meal.recipe.match(/(https?:\/\/[^\s]+)/);
    const url = urlMatch ? urlMatch[0] : null;
    const label = url ? meal.recipe.replace(url, "").trim() : meal.recipe;

    let finalLabel = label;
    let finalUrl = url;
    let linkedRecipe = null;

    if (label.startsWith("@")) {
      const recipeName = label.slice(1).trim();
      linkedRecipe = recipes.find(
        (r) => r.name.toLowerCase() === recipeName.toLowerCase(),
      );
      if (linkedRecipe) {
        finalLabel = linkedRecipe.name;
        finalUrl = linkedRecipe.link || finalUrl;
      }
    }

    const hasExtraContent = linkedRecipe 
      ? !!(linkedRecipe.instructions || linkedRecipe.ingredients || linkedRecipe.link)
      : (!!finalUrl && !!finalLabel);

    const handleMealClick = (e) => {
      if (hasExtraContent) {
        e.preventDefault();
        setViewingRecipe(linkedRecipe || { name: finalLabel, link: finalUrl });
      }
    };

    return (
      <div key={meal.type} style={{ fontSize: "0.95rem", marginBottom: "0.2rem" }}>
        <strong style={{ textTransform: "capitalize", color: "var(--text-muted)" }}>{meal.type}:</strong>{" "}
        {finalUrl && !hasExtraContent ? (
          <a
            href={finalUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--primary-color)", textDecoration: "underline" }}
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
            {hasExtraContent && <BookOpen size={12} style={{ marginLeft: "0.3rem", display: "inline" }} />}
          </span>
        )}
      </div>
    );
  };

  const renderIngredients = (ingredients) => {
    if (!ingredients) return "";
    let items = [];
    if (Array.isArray(ingredients)) {
      items = ingredients.map(ig => (typeof ig === 'string' ? ig : ig.item || ig.name || JSON.stringify(ig)));
    } else if (typeof ingredients === 'string') {
      items = ingredients.split(/,|\n/).map(item => item.trim()).filter(Boolean);
    } else {
      items = [String(ingredients)];
    }
    return items.join('<br/>');
  };

  const menuData = getParsedMenuData(activeMenu);
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
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

  const todayMeals = sortMeals(menuData?.days?.[todayName]);
  const tomorrowMeals = sortMeals(menuData?.days?.[tomorrowName]);

  return (
    <section className="card" style={{ marginBottom: "2rem" }}>
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
          <Utensils size={20} color="var(--primary-color)" /> Active Menu
        </h3>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isExpanded && (
        <div style={{ marginTop: '1.5rem' }}>
          {activeMenu ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--primary-color)" }}>Today ({todayName})</h4>
                {todayMeals.length > 0 ? todayMeals.map(renderMeal) : <p style={{ fontStyle: "italic", color: "var(--text-muted)", margin: 0 }}>No meals planned</p>}
              </div>
              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--text-muted)" }}>Tomorrow ({tomorrowName})</h4>
                {tomorrowMeals.length > 0 ? tomorrowMeals.map(renderMeal) : <p style={{ fontStyle: "italic", color: "var(--text-muted)", margin: 0 }}>No meals planned</p>}
              </div>
            </div>
          ) : (
            <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>No active menu</p>
          )}
        </div>
      )}

      {viewingRecipe && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h2 style={{ margin: 0 }}>{viewingRecipe.name}</h2>
              <button className="secondary" onClick={() => setViewingRecipe(null)} style={{ padding: '0.2rem' }}><X size={20} /></button>
            </div>
            {viewingRecipe.link && (
              <div style={{ marginBottom: '1.5rem' }}>
                <a href={viewingRecipe.link} target="_blank" rel="noreferrer" className="flex items-center gap-2" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                  <ExternalLink size={18} /> View Original Source
                </a>
              </div>
            )}
            {viewingRecipe.ingredients && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4>Ingredients</h4>
                <div style={{ whiteSpace: 'pre-wrap', padding: '1rem', background: 'var(--gray-light)', borderRadius: '8px' }} dangerouslySetInnerHTML={{ __html: renderIngredients(viewingRecipe.ingredients) }} />
              </div>
            )}
            {viewingRecipe.instructions && (
              <div style={{ marginBottom: '1rem' }}>
                <h4>Instructions</h4>
                <div style={{ whiteSpace: 'pre-wrap', padding: '1rem', background: 'var(--gray-light)', borderRadius: '8px' }} dangerouslySetInnerHTML={{ __html: typeof viewingRecipe.instructions === 'string' ? viewingRecipe.instructions : JSON.stringify(viewingRecipe.instructions) }} />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
