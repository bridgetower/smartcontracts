// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../libraries/LibFeeSide.sol";
import "../libraries/LibDeal.sol";

import "./ITransferExecutor.sol";

abstract contract ITransferManager is ITransferExecutor {
    function doTransfers(
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory right,
        LibFeeSide.FeeSide feeSide,
        uint256 protocolFee
    ) internal virtual returns (uint256 totalMakeValue, uint256 totalTakeValue);
}
