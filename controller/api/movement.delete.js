import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const { uid } = req.params;

  let query = "delete from movements where tenant_uid = ? and uid = ?";

  await mySql.Query(query, [res.locals.tenant.uid, uid]);

  return res.end();
}
