import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const body = req.body;

  let query = "update categories set ? where uid = ?";

  await mySql.Query(query, [body, body.uid]);

  return res.end();
}
