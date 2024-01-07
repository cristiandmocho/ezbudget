import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const { pageNum, pageSize } = req.query;

  let query1 =
    "select count(uid) as qty from vw_movements where tenant_uid = ?";
  let query2 = "select * from vw_movements where tenant_uid = ?";

  const count = await mySql.Query(query1, [res.locals.tenant.uid]);
  const data = await mySql.Query(query2, [res.locals.tenant.uid]);

  return res.json({ totalRecord: count.rows[0].qty, data: data.rows });
}
