import { pool } from "./index.js";

export interface User {
  id: number;
  phone_number: string;
  gender: string;
  weight: number;
  created_at?: Date;
}

export async function addUserIfNotExists(
  user: Omit<User, "id">
): Promise<User | null> {
  const query = `
    INSERT INTO users (phone_number, gender, weight, created_at)
    VALUES (
      $1,
      $2,
      $3,
      CURRENT_TIMESTAMP
    )
    RETURNING *;
  `;

  const values = [user.phone_number, user.gender ?? null, user.weight ?? null];

  const { rows } = await pool.query<User>(query, values);
  return rows[0] || null;
}

export async function getUserByPhone(
  phoneNumber: string
): Promise<User | null> {
  const res = await pool.query<User>(
    `SELECT id, phone_number, gender, weight FROM users WHERE phone_number = $1 LIMIT 1`,
    [phoneNumber]
  );
  return res.rows[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const res = await pool.query<User>(
    `SELECT id, phone_number, gender, weight, created_at 
     FROM users 
     WHERE id = $1 
     LIMIT 1`,
    [id]
  );
  return res.rows[0] || null;
}

export async function updateUserInfo(id: number, info: Partial<User>) {
  const fields = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(info)) {
    fields.push(`${key} = $${i}`);
    values.push(value);
    i++;
  }

  values.push(id);
  const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${i}`;
  await pool.query(query, values);
}
