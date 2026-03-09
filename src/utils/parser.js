/**
 * Parser utility for converting shorthand note text into structured data.
 */

export const parseList = (text) => {
  const lines = text.split('\n');
  const result = [];
  let currentCategory = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.endsWith(':')) {
      // Category header
      currentCategory = {
        category: trimmed.slice(0, -1),
        items: []
      };
      result.push(currentCategory);
    } else if (trimmed.startsWith('-')) {
      // List item
      const itemName = trimmed.slice(1).trim();
      if (currentCategory) {
        currentCategory.items.push({ item: itemName, done: false });
      } else {
        // Flat item if no category
        result.push({ item: itemName, done: false });
      }
    }
  });

  return result;
};

export const parseMenu = (text) => {
  const lines = text.split('\n');
  const menuData = {
    active: false,
    start: null,
    end: null,
    days: {}
  };

  let currentDay = null;

  lines.forEach(line => {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) return;

    if (trimmed === 'active') {
      menuData.active = true;
    } else if (trimmed.startsWith('from ')) {
      menuData.start = trimmed.replace('from ', '').trim();
    } else if (trimmed.startsWith('to ')) {
      menuData.end = trimmed.replace('to ', '').trim();
    } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(trimmed)) {
      currentDay = trimmed;
      menuData.days[currentDay] = [];
    } else if (currentDay && trimmed.includes(':')) {
      const parts = line.split(':');
      const type = parts[0].trim();
      const recipe = parts.slice(1).join(':').trim();
      menuData.days[currentDay].push({ type, recipe });
    }
  });

  return menuData;
};

export const deparseList = (data) => {
  if (typeof data === 'string') return data;
  if (!Array.isArray(data)) return '';
  
  let text = '';
  data.forEach(item => {
    const categoryName = item.category || item.name;
    if (item.items) {
      if (categoryName) text += `${categoryName}:\n`;
      item.items.forEach(sub => {
        const itemName = sub.item || sub.name;
        if (itemName) text += ` - ${itemName}\n`;
      });
    } else {
      const itemName = item.item || item.name;
      if (itemName) text += ` - ${itemName}\n`;
    }
  });
  return text;
};

export const deparseMenu = (data) => {
  if (typeof data === 'string') return data;
  if (!data || typeof data !== 'object') return '';
  
  let text = '';

  // Migration path for external JSON format (dates as keys, nested name/recipeId)
  if (data.days && !Array.isArray(Object.values(data.days)[0])) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const sortedDates = Object.keys(data.days).sort();
    
    if (sortedDates.length > 0) {
      text += `from ${sortedDates[0]}\n`;
      text += `to ${sortedDates[sortedDates.length - 1]}\n\n`;
    }

    sortedDates.forEach(dateStr => {
      const parts = dateStr.split('-').map(Number);
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      const dayName = dayNames[date.getDay()];
      const dayData = data.days[dateStr];
      
      text += `${dayName}\n`;
      Object.entries(dayData).forEach(([type, info]) => {
        if (info && info.name) {
          const prefix = info.recipeId ? '@' : '';
          text += ` ${type}: ${prefix}${info.name}\n`;
        }
      });
      text += '\n';
    });
    return text.trim();
  }
  
  if (data.active) text += 'active\n';
  if (data.start) text += `from ${data.start}\n`;
  if (data.end) text += `to ${data.end}\n`;
  
  Object.entries(data.days || {}).forEach(([day, meals]) => {
    text += `${day}\n`;
    meals.forEach(meal => {
      text += ` ${meal.type}: ${meal.recipe}\n`;
    });
  });
  return text;
};
