import { pool } from "../db/index.js";

export interface DrinkLog {
  id?: number;
  user_id: number;
  drink_type: string;
  volume_ml: number;
  alcohol_percentage: string;
  consumed_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

export async function addDrinkLog(log: DrinkLog): Promise<DrinkLog> {
  const query = `
    INSERT INTO user_drinks_logs (
      user_id, drink_type, volume_ml, alcohol_percentage, consumed_at
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [
    log.user_id,
    log.drink_type,
    log.volume_ml ?? null,
    log.alcohol_percentage ?? null,
    log.consumed_at ?? new Date(),
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getDrinksLogsLast24h(
  userId: number
): Promise<DrinkLog[]> {
  const query = `
    SELECT *
    FROM user_drinks_logs
    WHERE user_id = $1
      AND consumed_at >= NOW() - INTERVAL '24 hours'
    ORDER BY consumed_at DESC;
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
}
