// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


contract ForensicLogRegistry {
    uint256 public logCount;

    mapping(uint256 => string) private _hashes;
    mapping(uint256 => address) private _submitters;

    event LogHashCommitted(
        uint256 indexed logIndex,
        address indexed submitter,
        string hash,
        uint256 timestamp
    );

    uint256 private constant EXPECTED_HEX_LEN = 64;

    error InvalidHashLength();

    /**
     * @notice Commit one SHA-256 hex hash (off-chain log integrity anchor).
     * @param _hash 64 lowercase/uppercase hex chars, no "0x" prefix (matches Node digest("hex")).
     */
    function storeLog(string calldata _hash) external {
        if (bytes(_hash).length != EXPECTED_HEX_LEN) revert InvalidHashLength();

        uint256 index = logCount;
        _hashes[index] = _hash;
        _submitters[index] = msg.sender;

        unchecked {
            logCount = index + 1;
        }

        emit LogHashCommitted(index, msg.sender, _hash, block.timestamp);
    }

    function getHash(uint256 index) external view returns (string memory) {
        require(index < logCount, "ForensicLogRegistry: index out of bounds");
        return _hashes[index];
    }

    /// @notice Address that submitted this index (auditor / relayer wallet).
    function getSubmitter(uint256 index) external view returns (address) {
        require(index < logCount, "ForensicLogRegistry: index out of bounds");
        return _submitters[index];
    }
}
