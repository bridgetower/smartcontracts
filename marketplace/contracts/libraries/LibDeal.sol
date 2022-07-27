// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../royalties/LibPart.sol";

import "./LibAsset.sol";

library LibDeal {
    struct DealSide {
        LibAsset.Asset asset;
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
        address proxy;
        address from;
    }
}
