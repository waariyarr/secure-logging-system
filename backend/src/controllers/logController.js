const mongoose = require("mongoose");
const Log = require("../models/LogModel");
const { generateHash } = require("../services/hashService");
const {
  storeHashOnBlockchain,
  getHashFromChain,
} = require("../services/blockchainService");
const { getThreatStateForUser } = require("../services/threatDetectionService");
const { getClientIp } = require("../utils/requestIp");

const MAX_MSG = 8000;
const MAX_IP = 128;

exports.createLog = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let { message } = req.body || {};
    let ip = getClientIp(req);
    const username = req.user?.username || null;

    if (message == null) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    message = String(message).trim();
    ip = String(ip).trim();

    if (!message || !ip) {
      return res.status(400).json({
        error: "Message cannot be empty",
      });
    }

    if (message.length > MAX_MSG || ip.length > MAX_IP) {
      return res.status(400).json({
        error: `Message max ${MAX_MSG} chars, detected IP max ${MAX_IP} chars`,
      });
    }

    const logData = {
      message,
      ip,
      timestamp: new Date(),
    };

    const hash = generateHash({
      ...logData,
      userId: ownerId,
    });

    const newLog = await Log.create({
      user: ownerId,
      username,
      eventType: "action",
      ...logData,
      hash,
    });

    const chainResult = await storeHashOnBlockchain(hash);
    const anchored = Boolean(chainResult?.receipt);
    if (anchored) {
      newLog.blockchainTxHash = chainResult.receipt.transactionHash;
      newLog.chainLogIndex = chainResult.chainLogIndex;
      await newLog.save();
    }

    const { threatAlerts, systemStatus } = await getThreatStateForUser(ownerId);

    res.json({
      success: true,
      log: newLog,
      blockchain: anchored ? "stored" : "failed",
      threat: {
        alert: threatAlerts.length > 0,
        threats: threatAlerts,
        systemStatus,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const logs = await Log.find({ user: ownerId })
      .sort({ timestamp: -1 })
      .populate("user", "username")
      .lean();
    const { threatAlerts, systemStatus } = await getThreatStateForUser(ownerId);
    res.json({
      logs,
      threatAlerts,
      systemStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyLog = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid log id" });
    }

    const log = await Log.findById(id);
    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }

    if (String(log.user) !== String(ownerId)) {
      return res.status(403).json({ error: "Not allowed to access this log" });
    }

    const hashInput = {
      message: log.message,
      ip: log.ip,
      timestamp: log.timestamp,
    };
    if (log.user) {
      hashInput.userId = log.user.toString();
    }

    let currentHash;
    try {
      currentHash = generateHash(hashInput);
    } catch (e) {
      return res.status(500).json({ error: `Hash recompute failed: ${e.message}` });
    }

    const localIntegrity = currentHash === log.hash;

    let chainMatch = null;
    let onChainHash = null;
    if (log.chainLogIndex != null) {
      onChainHash = await getHashFromChain(log.chainLogIndex);
      if (onChainHash != null && log.hash) {
        const a = String(onChainHash).trim().toLowerCase();
        const b = String(log.hash).trim().toLowerCase();
        chainMatch = a === b;
      }
    }

    if (localIntegrity !== log.verified) {
      log.verified = localIntegrity;
      await log.save();
    }

    const hasAnchor = log.chainLogIndex != null;
    const blockchainVerified =
      hasAnchor && chainMatch === true
        ? true
        : hasAnchor && chainMatch === false
          ? false
          : null;

    res.json({
      verified: localIntegrity,
      localIntegrity,
      chainMatch,
      chainLogIndex: log.chainLogIndex,
      onChainHash,
      storedHash: log.hash,
      blockchainTxHash: log.blockchainTxHash || null,
      blockchainVerified,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
