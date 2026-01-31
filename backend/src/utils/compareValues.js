const compareValues = (original, updates) => {
  const changed = {};

  for (const key in updates) {
    
    if (updates[key] !== undefined && updates[key] !== original[key]) {
      changed[key] = updates[key];
    }
  }

  return changed;
};

module.exports = compareValues;
