import express from "express";
import helmet from "helmet";
import cors from "cors";
import ejs from "ejs";
import expressLayouts from "express-ejs-layouts";
import { config } from "dotenv";
import { LRUCache } from "lru-cache";

import { PrivateRoutes, PublicRoutes, APIRoutes } from "./routes/index.js";
import registerErrorHandler from "./middleware/errorhandling.js";
import Package from "./package.json" assert { type: "json" };

import pkg from "express-openid-connect";
const { auth } = pkg;

class Server {
  constructor() {
    config();

    if (process.env.NODE_ENV !== "production") config({ path: ".env.local" });
    else config({ path: ".env.prod" });

    this.server = express();

    this.settings();
    this.middlewares();
    this.routes();

    this.port = process.env.PORT || 3010;
  }

  async settings() {
    ejs.cache = new LRUCache({ max: 100, maxAge: 1000 * 60 * 60 });

    this.server.set("version", Package.version);
    this.server.set("view engine", "ejs");
    this.server.set("views", "views");
    this.server.set("layout", "layouts/private.ejs");

    this.server.set("dbconfig", {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: "ezbudget",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
  }

  middlewares() {
    this.server.use(express.json({ limit: process.env.MAX_FILE_SIZE }));
    this.server.use(
      express.urlencoded({ extended: false, limit: process.env.MAX_FILE_SIZE })
    );

    this.server.use(
      helmet({
        contentSecurityPolicy: false,
      })
    );

    this.server.use(expressLayouts);
    this.server.use(registerErrorHandler);

    // Authentication
    this.server.use(
      auth({
        authRequired: false,
        auth0Logout: true,
        baseURL: process.env.BASE_URL,
        issuerBaseURL: process.env.ISSUER_BASE_URL,
        clientID: process.env.CLIENT_ID,
        secret: process.env.CLIENT_SECRET,
        routes: {
          callback: "/callback",
          postLogoutRedirect: "/",
          logout: "/signout",
        },
      })
    );

    this.server.use(async function (req, res, next) {
      if (req.oidc.isAuthenticated()) {
        let tenant = await fetch(`${process.env.BASE_URL}/api/tenant/bysub`, {
          method: "POST",
          body: JSON.stringify({ sub: req.oidc.user.sub }),
          headers: { "Content-Type": "application/json" },
        }).then((data) => data.json());

        if (!tenant) {
          // The tenant does not exist, so we need to create it
          tenant = {
            auth0_uid: req.oidc.user.sub,
            name: req.oidc.user.name,
            email: req.oidc.user.email,
            preferences: {
              currency: "EUR",
              language: "en-gb",
              theme: "dark",
            },
          };

          const data = await fetch(`${process.env.BASE_URL}/api/tenant`, {
            method: "POST",
            body: JSON.stringify({
              ...tenant,
              preferences: JSON.stringify(tenant.preferences),
            }),
            headers: { "Content-Type": "application/json" },
          }).then((data) => data.json());

          tenant.uid = data.uid;
        } else {
          tenant.preferences = JSON.parse(tenant.preferences);
        }

        res.locals.user = req.oidc.user;
        res.locals.tenant = tenant;
      }

      next();
    });

    this.server.use(
      cors({
        origin: process.env.CORS_ORIGINS,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      })
    );
  }

  routes() {
    // Static routes
    this.server.use("/scripts", express.static("public/scripts"));
    this.server.use("/scripts/utils", express.static("utils"));
    this.server.use("/css", express.static("public/css"));
    this.server.use("/assets", express.static("assets"));

    // App routes
    this.server.use("/api", APIRoutes);
    this.server.use(PublicRoutes);
    this.server.use(PrivateRoutes);

    // 404
    this.server.use("*", (req, res) => {
      res.sendError(404, `"${req.baseUrl}" does not exists on this server.`);
    });
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Server is up at http://localhost:${this.port}`);
    });
  }
}

const server = new Server();
server.start();
