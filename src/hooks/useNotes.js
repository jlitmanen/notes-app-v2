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

      // In PocketBase, a multi-relation 'groups' is an array of IDs.
      // We check if item's groups contains any of our groups.
      const userGroups = user.groups || [];
      const filterParts = [`user = "${user.id}"`];

      if (userGroups.length > 0) {
        userGroups.forEach((gId) => {
          filterParts.push(`groups ~ "${gId}"`);
        });
      }

      const filter = filterParts.join(" || ");

      // Fetch from all three collections
      const [notesRes, listsRes, menusRes] = await Promise.allSettled([
        pb
          .collection("notes")
          .getFullList({ filter, sort: "-created", requestKey: "notes" }),
        pb
          .collection("lists")
          .getFullList({ filter, sort: "-created", requestKey: "lists" }),
        pb
          .collection("menus")
          .getFullList({ filter, sort: "-created", requestKey: "menus" }),
      ]);

      const notes = notesRes.status === "fulfilled" ? notesRes.value : [];
      const lists = listsRes.status === "fulfilled" ? listsRes.value : [];
      const menus = menusRes.status === "fulfilled" ? menusRes.value : [];

      // Tag them with their type for the UI
      const combined = [
        ...notes.map((n) => ({
          ...n,
          type: "note",
          title: n.title || n.name || "Untitled Note",
          data: n.data,
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
      let collectionName = "notes";
      let formattedData = {
        title: data.title,
        data: data.content || data.data,
        user: pb.authStore.record.id,
      };

      if (data.mode === "list") {
        collectionName = "lists";
        formattedData = {
          title: data.title,
          data: data.parsedData || data.data,
          user: pb.authStore.record.id,
        };
      } else if (data.mode === "menu") {
        collectionName = "menus";
        formattedData = {
          title: data.title,
          start: data.parsedData?.start
            ? new Date(data.parsedData.start)
            : null,
          end: data.parsedData?.end ? new Date(data.parsedData.end) : null,
          data: data.parsedData || data.data,
          user: pb.authStore.record.id,
        };
      }

      let record;
      if (id) {
        record = await pb.collection(collectionName).update(id, formattedData);
      } else {
        record = await pb.collection(collectionName).create(formattedData);
      }

      fetchAll();
      return record;
    } catch (err) {
      console.error("Error saving item:", err);
      throw err;
    }
  };

  const updateSharing = async (item, groupIds) => {
    try {
      const collectionName =
        item.type === "note"
          ? "notes"
          : item.type === "list"
            ? "lists"
            : "menus";

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
      const collectionName =
        type === "note" ? "notes" : type === "list" ? "lists" : "menus";
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
