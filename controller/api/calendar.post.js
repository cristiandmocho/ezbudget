import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const body = req.body;
  const { day, customer } = body;

  let query = "call sp_add_calendar_info(?, ?);";

  await mySql.Query(query, [day, customer]);

  return res.end();
}
