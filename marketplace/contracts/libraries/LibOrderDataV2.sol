// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../royalties/LibPart.sol";

library LibOrderDataV2 {
    /**
     * bytes4(keccak256("V2")) == 0x23d235ef
     */
    bytes4 public constant V2 = 0x23d235ef;

    struct DataV2 {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
        bool isMakeFill;
    }

    function decodeOrderDataV2(bytes memory data)
        internal
        pure
        returns (DataV2 memory orderData)
    {
        orderData = abi.decode(data, (DataV2));
    }
}
