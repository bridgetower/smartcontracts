// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../openzeppelin-upgradeable/structs/EnumerableSetUpgradeable.sol";

import "../openzeppelin-upgradeable/utils/AddressUpgradeable.sol";

import "../transfer-manager/TransferExecutor.sol";

import "../interfaces/ITransferManager.sol";

import "../libraries/LibOrderData.sol";
import "../libraries/LibFeeSide.sol";
import "../libraries/BpLibrary.sol";
import "../libraries/LibFill.sol";
import "../libraries/LibDeal.sol";

import "./OrderValidator.sol";
import "./AssetMatcher.sol";

abstract contract ExchangeV2Core is
    Initializable,
    OwnableUpgradeable,
    AssetMatcher,
    TransferExecutor,
    OrderValidator,
    ITransferManager
{
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;
    using LibTransfer for address;

    uint256 private constant UINT256_MAX = 2**256 - 1;

    // AVAX token is acceptable for payments in orders or not
    bool public isWhitelistedNativePaymentToken;

    // State of the orders
    mapping(bytes32 => uint256) public fills;

    // Whitelisted tokens which is acceptable for payments in orders
    EnumerableSetUpgradeable.AddressSet private whitelistedPaymentTokens;

    // Events
    event Match(uint256 newLeftFill, uint256 newRightFill);
    event Cancel(bytes32 hash);
    event WhitelistedPaymentToken(address indexed token, bool whitelisted);
    event WhitelistedNativePaymentToken(bool whitelisted);

    function whitelistPaymentToken(address token, bool whitelist)
        public
        virtual
        onlyOwner
    {
        require(token.isContract(), "ExchangeV2Core: not contract address");

        whitelist
            ? whitelistedPaymentTokens.add(token)
            : whitelistedPaymentTokens.remove(token);

        emit WhitelistedPaymentToken(token, whitelist);
    }

    function whitelistNativePaymentToken(bool whitelist)
        public
        virtual
        onlyOwner
    {
        isWhitelistedNativePaymentToken = whitelist;

        emit WhitelistedNativePaymentToken(whitelist);
    }

    function cancel(LibOrder.Order memory order) public virtual {
        require(_msgSender() == order.maker, "ExchangeV2Core: not a maker");
        require(order.salt != 0, "ExchangeV2Core: 0 salt can't be used");

        bytes32 orderKeyHash = LibOrder.hashKey(order);

        fills[orderKeyHash] = UINT256_MAX;

        emit Cancel(orderKeyHash);
    }

    function matchOrders(
        LibOrder.Order memory orderLeft,
        bytes memory signatureLeft,
        LibOrder.Order memory orderRight,
        bytes memory signatureRight
    ) public payable virtual {
        validateFull(orderLeft, signatureLeft);
        validateFull(orderRight, signatureRight);

        if (orderLeft.taker != address(0)) {
            require(
                orderRight.maker == orderLeft.taker,
                "ExchangeV2Core: leftOrder.taker verification failed"
            );
        }

        if (orderRight.taker != address(0)) {
            require(
                orderRight.taker == orderLeft.maker,
                "ExchangeV2Core: rightOrder.taker verification failed"
            );
        }

        matchAndTransfer(orderLeft, orderRight);
    }

    function matchAndTransfer(
        LibOrder.Order memory orderLeft,
        LibOrder.Order memory orderRight
    ) internal {
        (
            LibAsset.AssetType memory makeMatch,
            LibAsset.AssetType memory takeMatch
        ) = matchAssets(orderLeft, orderRight);

        bytes32 leftOrderKeyHash = LibOrder.hashKey(orderLeft);
        bytes32 rightOrderKeyHash = LibOrder.hashKey(orderRight);

        LibOrderDataV2.DataV2 memory leftOrderData = LibOrderData.parse(
            orderLeft
        );
        LibOrderDataV2.DataV2 memory rightOrderData = LibOrderData.parse(
            orderRight
        );

        LibFill.FillResult memory newFill = getFillSetNew(
            orderLeft,
            orderRight,
            leftOrderKeyHash,
            rightOrderKeyHash,
            leftOrderData.isMakeFill,
            rightOrderData.isMakeFill
        );

        (uint256 totalMakeValue, uint256 totalTakeValue) = doTransfers(
            LibDeal.DealSide(
                LibAsset.Asset(makeMatch, newFill.leftValue),
                leftOrderData.payouts,
                leftOrderData.originFees,
                proxies[orderLeft.makeAsset.assetType.assetClass],
                orderLeft.maker
            ),
            LibDeal.DealSide(
                LibAsset.Asset(takeMatch, newFill.rightValue),
                rightOrderData.payouts,
                rightOrderData.originFees,
                proxies[orderRight.makeAsset.assetType.assetClass],
                orderRight.maker
            ),
            LibFeeSide.getFeeSide(makeMatch.assetClass, takeMatch.assetClass),
            getProtocolFee()
        );

        if (makeMatch.assetClass == LibAsset.AVAX_ASSET_CLASS) {
            require(
                takeMatch.assetClass != LibAsset.AVAX_ASSET_CLASS,
                "ExchangeV2Core: wrong asset class"
            );
            require(
                msg.value >= totalMakeValue,
                "ExchangeV2Core: not enough AVAX"
            );

            if (msg.value > totalMakeValue) {
                address(msg.sender).transferAvax(msg.value.sub(totalMakeValue));
            }
        } else if (takeMatch.assetClass == LibAsset.AVAX_ASSET_CLASS) {
            require(
                msg.value >= totalTakeValue,
                "ExchangeV2Core: not enough AVAX"
            );

            if (msg.value > totalTakeValue) {
                address(msg.sender).transferAvax(msg.value.sub(totalTakeValue));
            }
        }

        emit Match(newFill.rightValue, newFill.leftValue);
    }

    function getFillSetNew(
        LibOrder.Order memory orderLeft,
        LibOrder.Order memory orderRight,
        bytes32 leftOrderKeyHash,
        bytes32 rightOrderKeyHash,
        bool leftMakeFill,
        bool rightMakeFill
    ) internal returns (LibFill.FillResult memory) {
        uint256 leftOrderFill = getOrderFill(orderLeft.salt, leftOrderKeyHash);
        uint256 rightOrderFill = getOrderFill(
            orderRight.salt,
            rightOrderKeyHash
        );

        LibFill.FillResult memory newFill = LibFill.fillOrder(
            orderLeft,
            orderRight,
            leftOrderFill,
            rightOrderFill,
            leftMakeFill,
            rightMakeFill
        );

        require(
            newFill.rightValue > 0 && newFill.leftValue > 0,
            "ExchangeV2Core: nothing to fill"
        );

        if (orderLeft.salt != 0) {
            if (leftMakeFill) {
                fills[leftOrderKeyHash] = leftOrderFill.add(newFill.leftValue);
            } else {
                fills[leftOrderKeyHash] = leftOrderFill.add(newFill.rightValue);
            }
        }

        if (orderRight.salt != 0) {
            if (rightMakeFill) {
                fills[rightOrderKeyHash] = rightOrderFill.add(
                    newFill.rightValue
                );
            } else {
                fills[rightOrderKeyHash] = rightOrderFill.add(
                    newFill.leftValue
                );
            }
        }

        return newFill;
    }

    function getOrderFill(uint256 salt, bytes32 hash)
        internal
        view
        returns (uint256 fill)
    {
        if (salt == 0) {
            fill = 0;
        } else {
            fill = fills[hash];
        }
    }

    function matchAssets(
        LibOrder.Order memory orderLeft,
        LibOrder.Order memory orderRight
    )
        internal
        view
        returns (
            LibAsset.AssetType memory makeMatch,
            LibAsset.AssetType memory takeMatch
        )
    {
        makeMatch = matchAssets(
            orderLeft.makeAsset.assetType,
            orderRight.takeAsset.assetType
        );

        require(
            makeMatch.assetClass != 0,
            "ExchangeV2Core: assets don't match"
        );

        takeMatch = matchAssets(
            orderLeft.takeAsset.assetType,
            orderRight.makeAsset.assetType
        );

        require(
            takeMatch.assetClass != 0,
            "ExchangeV2Core: assets don't match"
        );
    }

    function validateFull(LibOrder.Order memory order, bytes memory signature)
        internal
        view
    {
        LibOrder.validate(order);

        validate(order, signature);
    }

    function isValidPaymentAssetType(LibAsset.AssetType memory assetType)
        internal
        view
        override
        returns (bool)
    {
        if (assetType.assetClass == LibAsset.AVAX_ASSET_CLASS) {
            return isWhitelistedNativePaymentToken;
        } else if (assetType.assetClass == LibAsset.ERC20_ASSET_CLASS) {
            address token = abi.decode(assetType.data, (address));

            return isWhitelistedPaymentToken(token);
        } else if (
            assetType.assetClass == LibAsset.ERC721_ASSET_CLASS ||
            assetType.assetClass == LibAsset.ERC1155_ASSET_CLASS
        ) {
            (address token, ) = abi.decode(assetType.data, (address, uint256));

            return isWhitelistedPaymentToken(token);
        }

        return false;
    }

    function isWhitelistedPaymentToken(address token)
        public
        view
        returns (bool)
    {
        return whitelistedPaymentTokens.contains(token);
    }

    function getProtocolFee() internal view virtual returns (uint256);

    uint256[47] private __gap;
}
