const getPagination = (page, limit) => {
  const offset = (page - 1) * limit;
  return { limit, offset };
};

module.exports = getPagination;
