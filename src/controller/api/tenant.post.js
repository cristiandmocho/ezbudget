import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const body = req.body;

  let query = "call sp_add_tenant(?, ?, ?, ?)";

  const data = await mySql.Query(query, [
    ...Object.keys(body).map((key) => body[key]),
  ]);

  return res.json({ uid: data.rows[0][0]["@uid"] });
}
