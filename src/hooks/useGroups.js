import { useState, useEffect, useCallback } from 'react';
import pb from '../pocketbase';

export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!pb.authStore.record) return;
    setLoading(true);
    try {
      // In PocketBase, if 'users' has a multiple relation to 'groups' called 'groups'
      // we can fetch the groups records.
      // Or if 'groups' has a multiple relation to 'users'.
      // Assuming 'groups' collection exists and user can see groups they are in.
      const records = await pb.collection('groups').getFullList({
        sort: 'name',
      });
      setGroups(records);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, refresh: fetchGroups };
}
