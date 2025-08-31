import { pool } from "./index.js";

type ReminderType = "can_drive";

export type Reminder = {
  id: number;
  user_id: number;
  reminder_type: ReminderType;
  reminder_date: Date;
  created_at: Date;
};

export async function getUserReminders(userId: number): Promise<Reminder[]> {
  const query = `
    SELECT id, user_id, reminder_type, reminder_date, created_at
    FROM user_reminders
    WHERE user_id = $1
    ORDER BY reminder_date ASC
  `;

  const { rows } = await pool.query<Reminder>(query, [userId]);
  return rows;
}

export async function deleteReminder(reminderId: number): Promise<boolean> {
  const query = `DELETE FROM user_reminders WHERE id = $1 RETURNING id`;

  const { rowCount } = await pool.query(query, [reminderId]);
  return !Boolean(rowCount);
}

export async function createReminder(
  userId: number,
  reminderType: ReminderType,
  reminderDate: Date
): Promise<Reminder> {
  const query = `
    INSERT INTO user_reminders (user_id, reminder_type, reminder_date)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, reminder_type, reminder_date, created_at
  `;

  const { rows } = await pool.query<Reminder>(query, [
    userId,
    reminderType,
    reminderDate,
  ]);

  return rows[0];
}

export async function getDueReminders(): Promise<Reminder[]> {
  const query = `
    SELECT id, user_id, reminder_type, reminder_date, created_at
    FROM user_reminders
    WHERE reminder_date <= NOW()
    ORDER BY reminder_date ASC
  `;

  const { rows } = await pool.query<Reminder>(query);
  return rows;
}
