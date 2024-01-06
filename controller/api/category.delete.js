import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const { uid } = req.params;

  let query =
    "select count(uid) as qty from movements where tenant_uid = ? and category_uid = ?";
  const result = await mySql.Query(query, [res.locals.tenant.uid, uid]);

  if (result.rows[0].qty > 0) {
    return res
      .status(400)
      .json({ error: "Cannot delete category with movements" });
  }

  query = "delete from categories where tenant_uid = ? and uid = ?";
  await mySql.Query(query, [res.locals.tenant.uid, uid]);

  return res.end();
}
