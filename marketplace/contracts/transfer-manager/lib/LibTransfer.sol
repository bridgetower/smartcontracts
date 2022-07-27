// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library LibTransfer {
    function transferAvax(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}("");

        require(success, "LibTransfer: transfer failed");
    }
}
