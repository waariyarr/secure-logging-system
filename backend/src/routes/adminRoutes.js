const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const {
  listUsers,
  listLoginAttempts,
  listThreats,
  listAllLogs,
} = require("../controllers/adminController");

router.get("/users", authMiddleware, requireAdmin, listUsers);
router.get("/login-attempts", authMiddleware, requireAdmin, listLoginAttempts);
router.get("/threats", authMiddleware, requireAdmin, listThreats);
router.get("/logs", authMiddleware, requireAdmin, listAllLogs);

module.exports = router;
