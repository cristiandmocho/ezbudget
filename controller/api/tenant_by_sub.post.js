import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const { sub } = req.body;

  let query = "select * from tenants where auth0_uid = ?";

  const data = await mySql.Query(query, [sub]);

  return res.json(data.rows[0] || null);
}
