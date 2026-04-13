const { Web3 } = require("web3");
const crypto = require("crypto");
require("dotenv").config();

const web3 = new Web3(process.env.RPC_URL);

// ABI must match contracts/ForensicLogRegistry.sol (compile in Remix or solc).
const contractABI = [
  {
    inputs: [{ internalType: "string", name: "_hash", type: "string" }],
    name: "storeLog",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "logCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "getHash",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "getSubmitter",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "logIndex", type: "uint256" },
      { indexed: true, internalType: "address", name: "submitter", type: "address" },
      { indexed: false, internalType: "string", name: "hash", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "LogHashCommitted",
    type: "event",
  },
];

const contract = new web3.eth.Contract(
  contractABI,
  process.env.CONTRACT_ADDRESS
);

/**
 * Accepts 64 hex chars with or without 0x; trims whitespace.
 * @returns {string|null} 0x-prefixed 32-byte key for web3.js
 */
function normalizePrivateKeyHex(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  if (s.startsWith("0x") || s.startsWith("0X")) s = s.slice(2);
  if (!/^[0-9a-fA-F]{64}$/.test(s)) return null;
  return "0x" + s.toLowerCase();
}

exports.getHashFromChain = async (index) => {
  try {
    if (
      index == null ||
      !process.env.CONTRACT_ADDRESS ||
      !process.env.RPC_URL
    ) {
      return null;
    }
    return await contract.methods.getHash(index).call();
  } catch (error) {
    console.error("getHashFromChain:", error.message);
    return null;
  }
};

exports.storeHashOnBlockchain = async (hash) => {
  try {
    const pkHex = normalizePrivateKeyHex(process.env.PRIVATE_KEY || "");
    if (!pkHex) {
      console.error(
        "Blockchain Error: PRIVATE_KEY must be 64 hex characters (32 bytes), optional 0x prefix, no spaces."
      );
      return null;
    }

    const account = web3.eth.accounts.privateKeyToAccount(pkHex);

    web3.eth.accounts.wallet.add(account);

    const tx = contract.methods.storeLog(hash);

    const gas = await tx.estimateGas({
      from: account.address,
    });

    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(account.address);

    const txData = {
      from: account.address,
      to: process.env.CONTRACT_ADDRESS,
      data: tx.encodeABI(),
      gas,
      gasPrice,
      nonce,
    };

    const receipt = await web3.eth.sendTransaction(txData);

    const countBn = await contract.methods.logCount().call();
    const chainLogIndex = Number(countBn) - 1;

    return { receipt, chainLogIndex };
  } catch (error) {
    console.error("Blockchain Error:", error.message);
    return null;
  }
};

exports.storeUserLoginOnBlockchain = async (loginData) => {
  const payload =
    typeof loginData === "string" ? loginData : JSON.stringify(loginData);
  const hex = crypto.createHash("sha256").update(payload).digest("hex");
  return exports.storeHashOnBlockchain(hex);
};

/**
 * Deterministic anchor for a successful login: SHA-256 of { userId, ip, timestamp }.
 */
exports.anchorLoginAttemptPayload = async ({ userId, ip, timestamp }) => {
  const payload = {
    userId: String(userId),
    ip: String(ip),
    timestamp: new Date(timestamp).toISOString(),
  };
  const hex = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  return exports.storeHashOnBlockchain(hex);
};