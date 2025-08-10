exports.up = (pgm) => {
  pgm.createTable("users", {
    id: "id",
    phone_number: { type: "text", notNull: true, unique: true },
    gender: "text",
    weight: "float8",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("users");
};
