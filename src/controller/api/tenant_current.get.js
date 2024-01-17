import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);

  let query = "select * from tenants where uid = ?";

  const data = await mySql.Query(query, [res.locals.tenant.uid]);

  return res.json(data.rows[0]);
}
