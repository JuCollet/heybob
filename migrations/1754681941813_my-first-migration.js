exports.up = (pgm) => {
  pgm.createTable("users", {
    id: "id",
    phone_number: { type: "text", notNull: true, unique: true },
    age: "integer",
    sex: "text",
    weight: "float8",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("users");
};
