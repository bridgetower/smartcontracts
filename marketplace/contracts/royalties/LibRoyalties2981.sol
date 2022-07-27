// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./LibPart.sol";

library LibRoyalties2981 {
    /*
     * bytes4(keccak256("royaltyInfo(uint256,uint256)")) == 0x2a55205a
     */
    bytes4 internal constant _INTERFACE_ID_ROYALTIES = 0x2a55205a;
    uint96 internal constant _WEIGHT_VALUE = 1000000;

    /**
     * Method for converting amount to percent and forming LibPart
     */
    function calculateRoyalties(address to, uint256 amount)
        internal
        pure
        returns (LibPart.Part[] memory)
    {
        LibPart.Part[] memory result;

        if (amount == 0) {
            return result;
        }

        uint256 percent = ((amount * 100) / _WEIGHT_VALUE) * 100;

        require(percent < 10000, "Royalties2981: value more than 100%");

        result = new LibPart.Part[](1);
        result[0].account = payable(to);
        result[0].value = uint96(percent);

        return result;
    }
}
