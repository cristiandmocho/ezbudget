/**
 *
 * @param {import("express").Request} req The request object
 * @param {import("express").Response} res The response object
 * @returns
 */
const RequestHandler = async (req, res) => {
  return res.render("profile", {
    title: "Tenant Profile",
    locals: res.locals,
    version: res.app.get("version"),
  });
};

export default RequestHandler;
