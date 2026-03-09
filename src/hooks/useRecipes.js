import { useState, useEffect, useCallback } from 'react';
import pb from '../pocketbase';

export function useRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all recipes (free for all)
      const records = await pb.collection('recipes').getFullList({
        sort: 'name',
      });
      setRecipes(records);
    } catch (err) {
      console.error('Error fetching recipes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveRecipe = async (data, id = null) => {
    try {
      const formattedData = {
        name: data.name,
        instructions: data.instructions || '',
        ingredients: data.ingredients || '',
        link: data.link || '',
        // Recipes are global, but we can still track the creator
        user: pb.authStore.model.id
      };

      let record;
      if (id) {
        record = await pb.collection('recipes').update(id, formattedData);
      } else {
        record = await pb.collection('recipes').create(formattedData);
      }
      
      fetchRecipes();
      return record;
    } catch (err) {
      console.error('Error saving recipe:', err);
      throw err;
    }
  };

  const deleteRecipe = async (id) => {
    try {
      await pb.collection('recipes').delete(id);
      fetchRecipes();
    } catch (err) {
      console.error('Error deleting recipe:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return { recipes, loading, saveRecipe, deleteRecipe, refresh: fetchRecipes };
}
