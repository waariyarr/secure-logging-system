const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const helmet = require("helmet");
const morgan = require("morgan");
const { ensureDefaultAdmin } = require("./services/defaultAdminService");

dotenv.config();

async function bootstrap() {
  await connectDB();
  await ensureDefaultAdmin();

  const app = express();
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(morgan("dev"));

  const corsOrigin = process.env.CORS_ORIGIN;
  app.use(
    cors(
      corsOrigin
        ? {
            origin: corsOrigin.split(",").map((s) => s.trim()),
            credentials: true,
          }
        : {}
    )
  );
  app.use(express.json());

  app.use("/api", require("./routes/logRoutes"));
  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/admin", require("./routes/adminRoutes"));

  app.get("/", (req, res) => {
    res.type("text").send(
      "Secure Logging API is running.\n\n" +
        "The React app is NOT on this port. Open the UI at:\n" +
        "  http://localhost:3000\n\n" +
        "Start the UI from project root (second terminal):\n" +
        "  npm run client\n\n" +
        "MongoDB: connected (this server only starts after a successful DB ping).\n"
    );
  });

  app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    const message =
      status === 500 ? "Internal server error" : err.message || "Error";
    res.status(status).json({ error: message });
  });

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
