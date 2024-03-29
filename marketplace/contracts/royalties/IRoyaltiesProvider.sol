// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "./LibPart.sol";

interface IRoyaltiesProvider {
    function getRoyalties(address token, uint256 tokenId)
        external
        returns (LibPart.Part[] memory);
}
