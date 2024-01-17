import MySQL from "../../utils/mysql.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const dbConfig = req.app.get("dbconfig");
  const mySql = new MySQL(dbConfig);

  let query = "delete from tenants where uid = ?";

  await mySql.Query(query, [res.locals.tenant.uid]);

  // Remove account from Auth0
  var requestOptions = {
    method: "DELETE",
    redirect: "follow",
  };

  fetch(
    `${AUTH0_API_BASE_URL}/users/${res.locals.tenant.auth0_uid}`,
    requestOptions
  )
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.log("error", error));

  return res.end();
}
