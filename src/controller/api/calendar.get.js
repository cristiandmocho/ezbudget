import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const urlQuery = req.query;
  const { month, year } = urlQuery;

  let query = "select * from calendar_info";
  if (month && year)
    query +=
      " where month(event_date) between ? and ? and year(event_date)=? and tenant_uid=? order by event_date asc";

  const data = await mySql.Query(query, [
    month,
    Number(month) + 2,
    year,
    res.locals.tenant.uid,
  ]);

  return res.json(data.rows);
}
