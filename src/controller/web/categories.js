/**
 *
 * @param {import("express").Request} req The request object
 * @param {import("express").Response} res The response object
 * @returns
 */
const RequestHandler = async (req, res) => {
  return res.render("categories", {
    title: "Categories",
    version: res.app.get("version"),
    locals: res.locals,
  });
};

export default RequestHandler;
