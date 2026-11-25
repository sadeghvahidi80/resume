/**
 * Tiny in-memory stand-in for the D1 statements used by src/index.js.
 * It keeps the tests honest about the SQL shapes without a network binding.
 */
export class FakeDB {
  constructor() {
    this.rows = new Map();
  }

  prepare(sql) {
    return new FakeStatement(this, sql.replace(/\s+/g, " ").trim());
  }
}

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async run() {
    const sql = this.sql;
    if (sql.startsWith("INSERT INTO orders")) {
      const [id, productId, amountRial, name, contact, note, locale, createdAt] = this.args;
      this.db.rows.set(id, {
        id,
        product_id: productId,
        amount_rial: amountRial,
        status: "pending",
        authority: null,
        ref_id: null,
        name,
        contact,
        note,
        locale,
        created_at: createdAt,
        paid_at: null,
      });
      return { success: true };
    }

    if (sql.startsWith("UPDATE orders SET status = 'failed'")) {
      this.#patch(this.args[0], { status: "failed" });
      return { success: true };
    }

    if (sql.startsWith("UPDATE orders SET status = 'canceled'")) {
      this.#patch(this.args[0], { status: "canceled" });
      return { success: true };
    }

    if (sql.startsWith("UPDATE orders SET status = 'paid'")) {
      const [refId, paidAt, id] = this.args;
      this.#patch(id, { status: "paid", ref_id: refId, paid_at: paidAt });
      return { success: true };
    }

    if (sql.startsWith("UPDATE orders SET authority = ?")) {
      const [authority, id] = this.args;
      this.#patch(id, { authority });
      return { success: true };
    }

    throw new Error(`FakeDB: unsupported statement: ${sql}`);
  }

  async first() {
    const sql = this.sql;
    if (sql.startsWith("SELECT * FROM orders WHERE authority = ?")) {
      const authority = this.args[0];
      for (const row of this.db.rows.values()) {
        if (row.authority === authority) return { ...row };
      }
      return null;
    }

    if (sql.startsWith("SELECT id, product_id")) {
      const row = this.db.rows.get(this.args[0]);
      if (!row) return null;
      return {
        id: row.id,
        product_id: row.product_id,
        amount_rial: row.amount_rial,
        status: row.status,
        ref_id: row.ref_id,
        created_at: row.created_at,
        paid_at: row.paid_at,
      };
    }

    throw new Error(`FakeDB: unsupported query: ${sql}`);
  }

  #patch(id, fields) {
    const row = this.db.rows.get(id);
    if (!row) throw new Error(`FakeDB: order not found: ${id}`);
    Object.assign(row, fields);
  }
}
