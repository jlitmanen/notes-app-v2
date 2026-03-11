import { useState, useEffect, useCallback } from "react";
import pb from "../pocketbase";

export function useNotes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const user = pb.authStore.record;
      if (!user) return;

      const userGroup = user.group;
      const filterParts = [`user = "${user.id}"`];

      if (userGroup) {
        // Handle both single string and array for group filtering
        if (Array.isArray(userGroup)) {
          userGroup.forEach((gId) => {
            filterParts.push(`group ~ "${gId}"`);
          });
        } else {
          filterParts.push(`group = "${userGroup}"`);
        }
      }

      const filter = filterParts.join(" || ");

      const [notesRes, listsRes, menusRes] = await Promise.allSettled([
        pb.collection("notes").getFullList({ filter, sort: "-created", requestKey: "notes" }),
        pb.collection("lists").getFullList({ filter, sort: "-created", requestKey: "lists" }),
        pb.collection("menus").getFullList({ filter, sort: "-created", requestKey: "menus" }),
      ]);

      const notes = notesRes.status === "fulfilled" ? notesRes.value : [];
      const lists = listsRes.status === "fulfilled" ? listsRes.value : [];
      const menus = menusRes.status === "fulfilled" ? menusRes.value : [];

      const combined = [
        ...notes.map((n) => ({
          ...n,
          type: "note",
          title: n.title || n.name || "Untitled Note",
          data: n.data || n.content,
        })),
        ...lists.map((l) => ({
          ...l,
          type: "list",
          title: l.title || l.name || "Untitled List",
          data: l.data || l.list,
        })),
        ...menus.map((m) => ({
          ...m,
          type: "menu",
          title: m.title || m.name || "Untitled Menu",
          data: m.data,
        })),
      ].sort((a, b) => new Date(b.created) - new Date(a.created));

      setItems(combined);
    } catch (err) {
      if (err.isAbort) return;
      console.error("Error fetching items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const saveItem = async (data, id = null) => {
    try {
      const user = pb.authStore.record;
      let collectionName = "notes";
      
      // Basic structure
      let formattedData = {
        title: data.title || "Untitled",
        user: user.id,
        group: user.group || "", // Include group by default for new items
      };

      // Handle content field based on collection
      const contentValue = data.content || data.data || "";
      
      if (data.mode === "list") {
        collectionName = "lists";
        formattedData.data = data.parsedData || data.data;
      } else if (data.mode === "menu") {
        collectionName = "menus";
        formattedData.data = data.parsedData || data.data;
        formattedData.start = data.parsedData?.start ? new Date(data.parsedData.start) : null;
        formattedData.end = data.parsedData?.end ? new Date(data.parsedData.end) : null;
      } else {
        // For notes, provide both 'data' and 'content' just in case
        formattedData.data = contentValue;
        formattedData.content = contentValue;
      }

      console.log(`Saving to ${collectionName}:`, formattedData);

      let record;
      if (id) {
        record = await pb.collection(collectionName).update(id, formattedData);
      } else {
        record = await pb.collection(collectionName).create(formattedData);
      }

      fetchAll();
      return record;
    } catch (err) {
      console.error("Error saving item detailed:", err.response || err);
      throw err;
    }
  };

  const updateSharing = async (item, groupIds) => {
    try {
      const collectionName = item.type === "note" ? "notes" : (item.type === "list" ? "lists" : "menus");
      await pb.collection(collectionName).update(item.id, {
        group: groupIds,
      });
      fetchAll();
    } catch (err) {
      console.error("Error updating sharing:", err);
      throw err;
    }
  };

  const deleteItem = async (type, id) => {
    try {
      const collectionName = type === "note" ? "notes" : (type === "list" ? "lists" : "menus");
      await pb.collection(collectionName).delete(id);
      fetchAll();
    } catch (err) {
      console.error("Error deleting item:", err);
      throw err;
    }
  };

  return {
    items,
    loading,
    saveItem,
    deleteItem,
    updateSharing,
    refresh: fetchAll,
  };
}
