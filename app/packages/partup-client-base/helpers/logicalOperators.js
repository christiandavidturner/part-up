Template.registerHelper('partupAnd', (...args) => {
  args.pop(); // Remove hash param automatically given by Blaze
  return args.filter((arg) => !!arg).length === args.length;
});

Template.registerHelper('partupOr', (...args) => {
  args.pop(); // Remove hash param automatically given by Blaze
  return !!args.filter((arg) => !!arg).length;
});