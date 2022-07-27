// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./LibOrderDataV1.sol";
import "./LibOrderDataV2.sol";

import "./LibAsset.sol";

import "./LibMath.sol";

library LibOrder {
    using SafeMathUpgradeable for uint256;

    uint256 internal constant ON_CHAIN_ORDER = 0;

    /**
     * keccak256("Order(address maker,Asset makeAsset,address taker,Asset takeAsset,uint256 salt,uint256 start,uint256 end,bytes4 dataType,bytes data)Asset(AssetType assetType,uint256 value)AssetType(bytes4 assetClass,bytes data)")
     */
    bytes32 internal constant ORDER_TYPEHASH =
        0x477ed43b8020849b755512278536c3766a3b4ab547519949a75f483372493f8d;

    bytes4 internal constant DEFAULT_ORDER_TYPE = 0xffffffff;

    struct Order {
        address maker;
        LibAsset.Asset makeAsset;
        address taker;
        LibAsset.Asset takeAsset;
        uint256 salt;
        uint256 start;
        uint256 end;
        bytes4 dataType;
        bytes data;
    }

    struct MatchedAssets {
        LibAsset.AssetType makeMatch;
        LibAsset.AssetType takeMatch;
    }

    function calculateRemaining(
        Order memory order,
        uint256 fill,
        bool isMakeFill
    ) internal pure returns (uint256 makeValue, uint256 takeValue) {
        if (isMakeFill) {
            makeValue = order.makeAsset.value.sub(fill);
            takeValue = LibMath.safeGetPartialAmountFloor(
                order.takeAsset.value,
                order.makeAsset.value,
                makeValue
            );
        } else {
            takeValue = order.takeAsset.value.sub(fill);
            makeValue = LibMath.safeGetPartialAmountFloor(
                order.makeAsset.value,
                order.takeAsset.value,
                takeValue
            );
        }
    }

    function hashKey(Order memory order) internal pure returns (bytes32) {
        // order.data is in hash for V2 orders
        if (order.dataType == LibOrderDataV2.V2) {
            return
                keccak256(
                    abi.encode(
                        order.maker,
                        LibAsset.hash(order.makeAsset.assetType),
                        LibAsset.hash(order.takeAsset.assetType),
                        order.salt,
                        order.data
                    )
                );
        } else {
            return
                keccak256(
                    abi.encode(
                        order.maker,
                        LibAsset.hash(order.makeAsset.assetType),
                        LibAsset.hash(order.takeAsset.assetType),
                        order.salt
                    )
                );
        }
    }

    function hash(Order memory order) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    ORDER_TYPEHASH,
                    order.maker,
                    LibAsset.hash(order.makeAsset),
                    order.taker,
                    LibAsset.hash(order.takeAsset),
                    order.salt,
                    order.start,
                    order.end,
                    order.dataType,
                    keccak256(order.data)
                )
            );
    }

    function validate(LibOrder.Order memory order) internal view {
        require(
            order.start == 0 || order.start < block.timestamp,
            "Order start validation failed"
        );

        require(
            order.end == 0 || order.end > block.timestamp,
            "Order end validation failed"
        );
    }
}
