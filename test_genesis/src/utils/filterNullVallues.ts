export const filterNullValues = (input) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});
};
