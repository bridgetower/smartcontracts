// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library LibRoyalties {
    /**
     * bytes4(keccak256('getBridgeTowerRoyalties(uint256)')) == 0xc1834730
     */
    bytes4 internal constant _INTERFACE_ID_ROYALTIES = 0xc1834730;
}
