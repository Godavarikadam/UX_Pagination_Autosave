export const compareValues = (oldData, newData) => {
  const changes = {};
  Object.keys(newData).forEach(key => {
    if (oldData[key] !== newData[key]) {
      changes[key] = newData[key];
    }
  });
  return changes;
};
