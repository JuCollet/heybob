exports.up = (pgm) => {
  pgm.addColumns("users", {
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("users", ["created_at"]);
};
