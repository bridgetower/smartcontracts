// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "./LibPart.sol";

interface IRoyalties {
    event RoyaltiesSet(uint256 tokenId, LibPart.Part[] royalties);

    function getBridgeTowerV2Royalties(uint256 id)
        external
        view
        returns (LibPart.Part[] memory);
}
