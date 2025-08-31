exports.up = (pgm) => {
  pgm.createType("reminder_type", ["can_drive"]);
  pgm.createTable("user_reminders", {
    id: "id",
    user_id: {
      type: "integer",
      notNull: true,
      references: '"users"',
      onDelete: "cascade",
    },
    reminder_type: {
      type: "reminder_type",
      notNull: true,
      default: "can_drive",
    },
    reminder_date: {
      type: "timestamp",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("user_reminders");
};
