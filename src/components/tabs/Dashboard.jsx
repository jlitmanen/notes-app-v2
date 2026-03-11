import { useState, useEffect } from "react";
import pb from "../../pocketbase";
import { useNotes } from "../../hooks/useNotes";
import { useRecipes } from "../../hooks/useRecipes";
import { parseList } from "../../utils/parser";
import {
  QuickNoteWidget,
  ActiveMenuWidget,
  IncompleteListsWidget,
} from "../widgets";

export function Dashboard() {
  const { saveItem } = useNotes();
  const { recipes } = useRecipes();
  const [activeMenu, setActiveMenu] = useState(null);
  const [incompleteLists, setIncompleteLists] = useState([]);

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
  };

  const getParsedListData = (list) => {
    if (Array.isArray(list.data)) return list.data;
    if (typeof list.data === "string") return parseList(list.data);
    return [];
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

  return (
    <div className="dashboard">
      <div className="responsive-grid">
        <div className="left-column">
          <QuickNoteWidget onSave={handleQuickSave} />
        </div>

        <div className="right-column">
          <ActiveMenuWidget activeMenu={activeMenu} recipes={recipes} />
          <IncompleteListsWidget
            incompleteLists={incompleteLists}
            onToggle={toggleListItem}
          />
        </div>
      </div>
    </div>
  );
}
