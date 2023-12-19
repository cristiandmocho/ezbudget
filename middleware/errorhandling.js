/**
 * Middleware to handle errors
 * @param {import("express").Request} req The request object
 * @param {import("express").Response} res The response object
 * @param {import("express").NextFunction} next The handler to pass the request to the next middleware
 */
export default function registerErrorHandler(req, res, next) {
  res.sendError = (code, message) => {
    res.status(code).render("errors/" + code, {
      layout: false,
      title: "Error page",
      error: { code, message },
    });
  };

  res.sendAPIError = (code, message) => {
    res.status(code).json({ error: { code, message } });
  };

  next();
}
