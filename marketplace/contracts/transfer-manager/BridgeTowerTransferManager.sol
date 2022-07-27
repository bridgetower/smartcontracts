// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../openzeppelin-upgradeable/access/OwnableUpgradeable.sol";

import "../lazy-mint/erc-1155/LibERC1155LazyMint.sol";
import "../lazy-mint/erc-721/LibERC721LazyMint.sol";

import "../royalties/IRoyaltiesProvider.sol";

import "../interfaces/ITransferManager.sol";

import "../libraries/BpLibrary.sol";

abstract contract BridgeTowerTransferManager is
    OwnableUpgradeable,
    ITransferManager
{
    using SafeMathUpgradeable for uint256;
    using BpLibrary for uint256;

    uint256 public protocolFee;

    IRoyaltiesProvider public royaltiesRegistry;

    address public defaultFeeReceiver;

    mapping(address => address) public feeReceivers;

    event ProtocolFeeChanged(uint256 oldValue, uint256 newValue);

    function __BridgeTowerTransferManager_init_unchained(
        uint256 newProtocolFee,
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider
    ) internal initializer {
        protocolFee = newProtocolFee;
        defaultFeeReceiver = newDefaultFeeReceiver;
        royaltiesRegistry = newRoyaltiesProvider;
    }

    function setRoyaltiesRegistry(IRoyaltiesProvider newRoyaltiesRegistry)
        public
        virtual
        onlyOwner
    {
        royaltiesRegistry = newRoyaltiesRegistry;
    }

    function setProtocolFee(uint256 newProtocolFee) public virtual onlyOwner {
        uint256 prevProtocolFee = protocolFee;

        protocolFee = newProtocolFee;

        emit ProtocolFeeChanged(prevProtocolFee, newProtocolFee);
    }

    function setDefaultFeeReceiver(address payable newDefaultFeeReceiver)
        public
        virtual
        onlyOwner
    {
        defaultFeeReceiver = newDefaultFeeReceiver;
    }

    function setFeeReceiver(address token, address wallet)
        public
        virtual
        onlyOwner
    {
        feeReceivers[token] = wallet;
    }

    function getFeeReceiver(address token) internal view returns (address) {
        address wallet = feeReceivers[token];

        if (wallet != address(0)) {
            return wallet;
        }

        return defaultFeeReceiver;
    }

    function doTransfers(
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory right,
        LibFeeSide.FeeSide feeSide,
        uint256 _protocolFee
    )
        internal
        override
        returns (uint256 totalLeftValue, uint256 totalRightValue)
    {
        totalLeftValue = left.asset.value;
        totalRightValue = right.asset.value;

        if (feeSide == LibFeeSide.FeeSide.LEFT) {
            totalLeftValue = doTransfersWithFees(left, right, _protocolFee);

            transferPayouts(
                right.asset.assetType,
                right.asset.value,
                right.from,
                left.payouts,
                right.proxy
            );
        } else if (feeSide == LibFeeSide.FeeSide.RIGHT) {
            totalRightValue = doTransfersWithFees(right, left, _protocolFee);

            transferPayouts(
                left.asset.assetType,
                left.asset.value,
                left.from,
                right.payouts,
                left.proxy
            );
        } else {
            transferPayouts(
                left.asset.assetType,
                left.asset.value,
                left.from,
                right.payouts,
                left.proxy
            );
            transferPayouts(
                right.asset.assetType,
                right.asset.value,
                right.from,
                left.payouts,
                right.proxy
            );
        }
    }

    function doTransfersWithFees(
        LibDeal.DealSide memory calculateSide,
        LibDeal.DealSide memory nftSide,
        uint256 _protocolFee
    ) internal returns (uint256 totalAmount) {
        totalAmount = calculateTotalAmount(
            calculateSide.asset.value,
            _protocolFee,
            calculateSide.originFees
        );

        uint256 rest = transferProtocolFee(
            totalAmount,
            calculateSide.asset.value,
            calculateSide.from,
            _protocolFee,
            _protocolFee,
            calculateSide.asset.assetType,
            calculateSide.proxy
        );

        rest = transferRoyalties(
            calculateSide.asset.assetType,
            nftSide.asset.assetType,
            nftSide.payouts,
            rest,
            calculateSide.asset.value,
            calculateSide.from,
            calculateSide.proxy
        );

        if (
            calculateSide.originFees.length == 1 &&
            nftSide.originFees.length == 1 &&
            nftSide.originFees[0].account == calculateSide.originFees[0].account
        ) {
            LibPart.Part[] memory origin = new LibPart.Part[](1);

            origin[0].account = nftSide.originFees[0].account;
            origin[0].value =
                nftSide.originFees[0].value +
                calculateSide.originFees[0].value;

            (rest, ) = transferFees(
                calculateSide.asset.assetType,
                rest,
                calculateSide.asset.value,
                origin,
                calculateSide.from,
                calculateSide.proxy
            );
        } else {
            (rest, ) = transferFees(
                calculateSide.asset.assetType,
                rest,
                calculateSide.asset.value,
                calculateSide.originFees,
                calculateSide.from,
                calculateSide.proxy
            );
            (rest, ) = transferFees(
                calculateSide.asset.assetType,
                rest,
                calculateSide.asset.value,
                nftSide.originFees,
                calculateSide.from,
                calculateSide.proxy
            );
        }

        transferPayouts(
            calculateSide.asset.assetType,
            rest,
            calculateSide.from,
            nftSide.payouts,
            calculateSide.proxy
        );
    }

    function transferProtocolFee(
        uint256 totalAmount,
        uint256 amount,
        address from,
        uint256 feeSideProtocolFee,
        uint256 nftSideProtocolFee,
        LibAsset.AssetType memory matchCalculate,
        address proxy
    ) internal returns (uint256) {
        (uint256 rest, uint256 fee) = subFeeInBp(
            totalAmount,
            amount,
            feeSideProtocolFee + nftSideProtocolFee
        );

        if (fee > 0) {
            address tokenAddress = address(0);

            if (matchCalculate.assetClass == LibAsset.ERC20_ASSET_CLASS) {
                tokenAddress = abi.decode(matchCalculate.data, (address));
            } else if (
                matchCalculate.assetClass == LibAsset.ERC1155_ASSET_CLASS
            ) {
                uint256 tokenId;

                (tokenAddress, tokenId) = abi.decode(
                    matchCalculate.data,
                    (address, uint256)
                );
            }

            transfer(
                LibAsset.Asset(matchCalculate, fee),
                from,
                getFeeReceiver(tokenAddress),
                proxy
            );
        }

        return rest;
    }

    function transferRoyalties(
        LibAsset.AssetType memory matchCalculate,
        LibAsset.AssetType memory matchNft,
        LibPart.Part[] memory payouts,
        uint256 rest,
        uint256 amount,
        address from,
        address proxy
    ) internal returns (uint256) {
        LibPart.Part[] memory fees = getRoyaltiesByAssetType(matchNft);

        if (
            fees.length == 1 &&
            payouts.length == 1 &&
            fees[0].account == payouts[0].account
        ) {
            require(fees[0].value <= 5000, "Royalties are too high (>50%)");

            return rest;
        }

        (uint256 result, uint256 totalRoyalties) = transferFees(
            matchCalculate,
            rest,
            amount,
            fees,
            from,
            proxy
        );

        require(totalRoyalties <= 5000, "Royalties are too high (>50%)");

        return result;
    }

    function getRoyaltiesByAssetType(LibAsset.AssetType memory matchNft)
        internal
        returns (LibPart.Part[] memory)
    {
        if (
            matchNft.assetClass == LibAsset.ERC1155_ASSET_CLASS ||
            matchNft.assetClass == LibAsset.ERC721_ASSET_CLASS
        ) {
            (address token, uint256 tokenId) = abi.decode(
                matchNft.data,
                (address, uint256)
            );

            return royaltiesRegistry.getRoyalties(token, tokenId);
        } else if (
            matchNft.assetClass == LibERC1155LazyMint.ERC1155_LAZY_ASSET_CLASS
        ) {
            (, LibERC1155LazyMint.Mint1155Data memory data) = abi.decode(
                matchNft.data,
                (address, LibERC1155LazyMint.Mint1155Data)
            );

            return data.royalties;
        } else if (
            matchNft.assetClass == LibERC721LazyMint.ERC721_LAZY_ASSET_CLASS
        ) {
            (, LibERC721LazyMint.Mint721Data memory data) = abi.decode(
                matchNft.data,
                (address, LibERC721LazyMint.Mint721Data)
            );

            return data.royalties;
        }

        LibPart.Part[] memory empty;

        return empty;
    }

    function transferFees(
        LibAsset.AssetType memory matchCalculate,
        uint256 rest,
        uint256 amount,
        LibPart.Part[] memory fees,
        address from,
        address proxy
    ) internal returns (uint256 restValue, uint256 totalFees) {
        restValue = rest;
        totalFees = 0;

        for (uint256 i = 0; i < fees.length; i++) {
            totalFees = totalFees.add(fees[i].value);

            (uint256 newRestValue, uint256 feeValue) = subFeeInBp(
                restValue,
                amount,
                fees[i].value
            );

            restValue = newRestValue;

            if (feeValue > 0) {
                transfer(
                    LibAsset.Asset(matchCalculate, feeValue),
                    from,
                    fees[i].account,
                    proxy
                );
            }
        }
    }

    function transferPayouts(
        LibAsset.AssetType memory matchCalculate,
        uint256 amount,
        address from,
        LibPart.Part[] memory payouts,
        address proxy
    ) internal {
        require(payouts.length > 0, "transferPayouts: nothing to transfer");

        uint256 restValue = amount;
        uint256 sumBps = 0;

        for (uint256 i = 0; i < payouts.length - 1; i++) {
            uint256 currentAmount = amount.bp(payouts[i].value);

            sumBps = sumBps.add(payouts[i].value);

            if (currentAmount > 0) {
                restValue = restValue.sub(currentAmount);

                transfer(
                    LibAsset.Asset(matchCalculate, currentAmount),
                    from,
                    payouts[i].account,
                    proxy
                );
            }
        }

        LibPart.Part memory lastPayout = payouts[payouts.length - 1];

        sumBps = sumBps.add(lastPayout.value);

        require(sumBps == 10000, "Sum payouts Bps not equal 100%");

        if (restValue > 0) {
            transfer(
                LibAsset.Asset(matchCalculate, restValue),
                from,
                lastPayout.account,
                proxy
            );
        }
    }

    function calculateTotalAmount(
        uint256 amount,
        uint256 feeOnTopBp,
        LibPart.Part[] memory orderOriginFees
    ) internal pure returns (uint256 total) {
        total = amount.add(amount.bp(feeOnTopBp));

        for (uint256 i = 0; i < orderOriginFees.length; i++) {
            total = total.add(amount.bp(orderOriginFees[i].value));
        }
    }

    function subFeeInBp(
        uint256 value,
        uint256 total,
        uint256 feeInBp
    ) internal pure returns (uint256 newValue, uint256 realFee) {
        return subFee(value, total.bp(feeInBp));
    }

    function subFee(uint256 value, uint256 fee)
        internal
        pure
        returns (uint256 newValue, uint256 realFee)
    {
        if (value > fee) {
            newValue = value.sub(fee);
            realFee = fee;
        } else {
            newValue = 0;
            realFee = value;
        }
    }

    function parseFeeData(uint256 data)
        internal
        pure
        returns (address, uint96)
    {
        return (address(uint160(data)), uint96(data >> 160));
    }

    uint256[46] private __gap;
}
