const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  createLog,
  getLogs,
  verifyLog,
} = require("../controllers/logController");

router.post("/log", authMiddleware, createLog);
router.get("/logs", authMiddleware, getLogs);
router.get("/verify/:id", authMiddleware, verifyLog);

module.exports = router;