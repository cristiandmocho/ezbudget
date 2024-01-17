import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const body = req.body;

  delete body.uid;
  body.tenant_uid = res.locals.tenant.uid;

  let query = "insert into movements set ?";

  await mySql.Query(query, body);

  return res.end();
}
