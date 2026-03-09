import { useState } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { Utensils, Trash2, Edit2, Plus, Search, ExternalLink, ChevronLeft, Save } from 'lucide-react';

export function RecipesManager() {
  const { recipes, loading, saveRecipe, deleteRecipe } = useRecipes();
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [link, setLink] = useState('');

  const resetForm = () => {
    setName('');
    setIngredients('');
    setInstructions('');
    setLink('');
    setEditingRecipe(null);
    setIsAdding(false);
  };

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
    setName(recipe.name);
    setIngredients(recipe.ingredients || '');
    setInstructions(recipe.instructions || '');
    setLink(recipe.link || '');
    setIsAdding(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name) return alert('Recipe name is required');
    
    await saveRecipe({ name, ingredients, instructions, link }, editingRecipe?.id);
    resetForm();
  };

  const filteredRecipes = recipes.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAdding) {
    return (
      <div className="recipe-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button className="secondary" onClick={resetForm}>
            <ChevronLeft size={18} /> Back to Library
          </button>
          <h2>{editingRecipe ? 'Edit Recipe' : 'New Recipe'}</h2>
        </div>
        
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Recipe Name</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g., Pancakes"
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Link / URL (Optional)</label>
            <input 
              value={link} 
              onChange={e => setLink(e.target.value)} 
              placeholder="https://..."
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Ingredients</label>
            <textarea 
              value={ingredients} 
              onChange={e => setIngredients(e.target.value)} 
              placeholder="Enter ingredients..."
              style={{ minHeight: '100px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Instructions</label>
            <textarea 
              value={instructions} 
              onChange={e => setInstructions(e.target.value)} 
              placeholder="How to make it..."
              style={{ minHeight: '150px' }}
            />
          </div>
          
          <button type="submit" style={{ marginTop: '1rem' }}>
            <Save size={18} /> {editingRecipe ? 'Update Recipe' : 'Save Recipe'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="recipes-manager">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: '10px', top: '12px', color: '#888' }} size={18} />
          <input 
            placeholder="Search recipes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <button onClick={() => setIsAdding(true)}>
          <Plus size={18} /> <span className="hide-mobile">New Recipe</span>
        </button>
      </div>

      {loading ? (
        <p>Loading recipes...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {filteredRecipes.map(recipe => (
            <div key={recipe.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                <Utensils size={20} color="var(--primary-color)" />
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <h4 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {recipe.name}
                  </h4>
                  {recipe.link && (
                    <small style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ExternalLink size={12} /> {new URL(recipe.link).hostname}
                    </small>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button 
                  className="secondary" 
                  onClick={() => handleEdit(recipe)}
                  style={{ padding: '0.4rem' }}
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  className="secondary" 
                  onClick={() => {
                    if (confirm('Delete recipe?')) deleteRecipe(recipe.id);
                  }}
                  style={{ padding: '0.4rem', color: 'var(--accent-color)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredRecipes.length === 0 && <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#666' }}>No recipes found.</p>}
        </div>
      )}
    </div>
  );
}
