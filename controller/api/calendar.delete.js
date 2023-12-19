import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);
  const body = req.body;
  const { day, customer, uid } = body;

  let query = "delete from calendar_info where ";
  const params = [];

  if (uid) {
    query += "uid = ?";
    params.push(uid);
  } else if (day && customer) {
    query += "work_date = ? and customer_uid = ?";
    params.push(day, customer);
  } else {
    return res
      .status(400)
      .json({ error: "uid or day and customer is required" });
  }

  await mySql.Query(query, params);

  return res.end();
}
