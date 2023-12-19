/**
 *
 * @param {import("express").Request} req The request object
 * @param {import("express").Response} res The response object
 * @returns
 */
const RequestHandler = (req, res) => {
  return res.render("calendar", { title: "Calendar" });
};

export default RequestHandler;
