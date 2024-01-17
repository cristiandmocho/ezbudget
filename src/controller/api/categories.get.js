import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);

  let query =
    "select * from categories where tenant_uid = ? order by sort_order, name";

  const data = await mySql.Query(query, [res.locals.tenant.uid]);

  return res.json(data.rows);
}
