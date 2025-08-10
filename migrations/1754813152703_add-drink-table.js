exports.up = (pgm) => {
  pgm.createTable("user_drinks_logs", {
    id: "id",
    user_id: {
      type: "integer",
      notNull: true,
      references: '"users"',
      onDelete: "cascade",
    },
    drink_type: {
      type: "varchar(50)",
      notNull: true,
    },
    volume_ml: {
      type: "integer",
      notNull: false,
    },
    alcohol_percentage: {
      type: "numeric(5,2)",
      notNull: false,
    },
    consumed_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("user_alcohol_logs");
};
