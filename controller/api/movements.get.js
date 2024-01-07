import { query } from "express";
import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const { pageNum, pageSize, month, year } = req.query;

  let params = [res.locals.tenant.uid];
  let query1 =
    "select count(uid) as qty from vw_movements where tenant_uid = ?";

  let query2 = "select * from vw_movements where tenant_uid = ?";

  if (month && year) {
    query1 += " and month(due_date) = ? and year(due_date) = ?";
    query2 += " and month(due_date) = ? and year(due_date) = ?";

    params.push(month);
    params.push(year);
  }

  query2 += " order by direction desc, created_on desc";

  if (pageNum && pageSize) {
    query2 += " limit ?,?";
  }

  const count = await mySql.Query(query1, params);
  const data = await mySql.Query(
    query2,
    pageNum && pageSize ? [...params, pageNum, pageSize] : params
  );

  return res.json({ totalRecords: count.rows[0].qty, data: data.rows });
}
