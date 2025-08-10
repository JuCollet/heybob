import { pool } from "../db/index.js";

export interface User {
  id?: number;
  phone_number: string;
  age?: number;
  sex?: string;
  weight?: number;
}

export async function addUserIfNotExists(user: User): Promise<User | null> {
  const query = `
      INSERT INTO users (phone_number, age, sex, weight)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (phone_number) DO UPDATE
        SET age = EXCLUDED.age,
            sex = EXCLUDED.sex,
            weight = EXCLUDED.weight
      RETURNING *;
    `;

  const values = [
    user.phone_number,
    user.age ?? null,
    user.sex ?? null,
    user.weight ?? null,
  ];

  const { rows } = await pool.query<User>(query, values);
  return rows[0] || null;
}

export async function getUserByPhone(
  phoneNumber: string
): Promise<User | null> {
  const res = await pool.query<User>(
    `SELECT id, phone_number, age, sex, weight FROM users WHERE phone_number = $1 LIMIT 1`,
    [phoneNumber]
  );
  return res.rows[0] || null;
}

export async function updateUserInfo(phoneNumber: string, info: Partial<User>) {
  const fields = [];
  const values = [];
  let i = 1;
  for (const [key, value] of Object.entries(info)) {
    fields.push(`${key} = $${i}`);
    values.push(value);
    i++;
  }
  values.push(phoneNumber);
  const query = `UPDATE users SET ${fields.join(", ")} WHERE phone_number = $${i}`;
  await pool.query(query, values);
}
