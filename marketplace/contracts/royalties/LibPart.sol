// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library LibPart {
    /**
     * keccak256("Part(address account,uint96 value)") == 0x397e04204c1e1a60ee8724b71f8244e10ab5f2e9009854d80f602bda21b59ebb
     */
    bytes32 public constant TYPE_HASH =
        0x397e04204c1e1a60ee8724b71f8244e10ab5f2e9009854d80f602bda21b59ebb;

    struct Part {
        address payable account;
        uint96 value;
    }

    function hash(Part memory part) internal pure returns (bytes32) {
        return keccak256(abi.encode(TYPE_HASH, part.account, part.value));
    }
}
