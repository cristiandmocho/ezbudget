/**
 *
 * @param {import("express").Request} req The request object
 * @param {import("express").Response} res The response object
 * @returns
 */
const RequestHandler = async (req, res) => {
  return res.render("dashboard", { title: "Dashboard", locals: res.locals });
};

export default RequestHandler;
