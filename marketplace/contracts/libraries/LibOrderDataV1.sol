// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../royalties/LibPart.sol";

library LibOrderDataV1 {
    /**
     * bytes4(keccak256("V1")) == 0x4c234266
     */
    bytes4 public constant V1 = 0x4c234266;

    struct DataV1 {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
    }

    function decodeOrderDataV1(bytes memory data)
        internal
        pure
        returns (DataV1 memory orderData)
    {
        orderData = abi.decode(data, (DataV1));
    }
}
