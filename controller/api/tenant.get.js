import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const params = req.params;
  const { uid } = params;

  let query = "select * from tenants where uid = ?";

  const data = await mySql.Query(query, [uid]);

  return res.json(data.rows[0]);
}
