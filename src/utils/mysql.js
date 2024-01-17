import { createConnection } from "mysql2/promise";

export default class MySQL {
  /**
   *
   * @param {Object} config The database connection configuration
   */
  constructor(config) {
    if (!config) throw new Error("Missing parameter: config");
    this.config = config;
  }

  /**
   *
   * @param {String} query The SQL query to run
   * @param {Array|Object} values An array with the parameter values
   * @returns {Object} The result of the query
   */
  async Query(query, values = null) {
    const conn = await createConnection(this.config);
    const [rows, fields] = await conn.query(query, values);
    await conn.end();

    return { rows, fields };
  }

  async BeginTransaction() {
    const conn = await createConnection(this.config);
    await conn.beginTransaction();

    return conn;
  }

  async QueryTransaction(conn, query, values = null) {
    const [rows, fields] = await conn.query(query, values);
    return { rows, fields };
  }

  async Commit(conn) {
    await conn.commit();
    await conn.end();
  }

  async Rollback(conn) {
    await conn.rollback();
    await conn.end();
  }
}
