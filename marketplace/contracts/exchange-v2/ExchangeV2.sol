// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../transfer-manager/BridgeTowerTransferManager.sol";

import "../securitize/WhitelistableUpgradeable.sol";

import "./ExchangeV2Core.sol";

contract ExchangeV2 is
    ExchangeV2Core,
    BridgeTowerTransferManager,
    WhitelistableUpgradeable
{
    function __ExchangeV2_init(
        address transferProxy,
        address erc20TransferProxy,
        uint256 newProtocolFee,
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider,
        address securitizeRegistryProxy,
        address contractsRegistryProxy
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(transferProxy, erc20TransferProxy);
        __BridgeTowerTransferManager_init_unchained(
            newProtocolFee,
            newDefaultFeeReceiver,
            newRoyaltiesProvider
        );
        __OrderValidator_init_unchained();
        __Whitelistable_init_unchained(
            securitizeRegistryProxy,
            contractsRegistryProxy
        );
    }

    function cancel(LibOrder.Order memory order) public override {
        onlyWhitelistedAddress(_msgSender());

        super.cancel(order);
    }

    function matchOrders(
        LibOrder.Order memory orderLeft,
        bytes memory signatureLeft,
        LibOrder.Order memory orderRight,
        bytes memory signatureRight
    ) public payable override {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(orderLeft.maker);
        onlyWhitelistedAddress(orderRight.maker);

        if (orderLeft.taker != address(0)) {
            onlyWhitelistedAddress(orderLeft.taker);
        }
        if (orderRight.taker != address(0)) {
            onlyWhitelistedAddress(orderRight.taker);
        }

        require(
            isValidPaymentAssetType(orderLeft.makeAsset.assetType) ||
                isValidPaymentAssetType(orderLeft.takeAsset.assetType),
            "ExchangeV2: orderLeft - one of the payment asset isn't supported"
        );
        require(
            isValidPaymentAssetType(orderRight.makeAsset.assetType) ||
                isValidPaymentAssetType(orderRight.takeAsset.assetType),
            "ExchangeV2: orderRight - one of the payment asset isn't supported"
        );

        super.matchOrders(orderLeft, signatureLeft, orderRight, signatureRight);
    }

    function setAssetMatcher(bytes4 assetType, address matcher)
        public
        override
    {
        onlyWhitelistedAddress(_msgSender());

        super.setAssetMatcher(assetType, matcher);
    }

    function setDefaultFeeReceiver(address payable newDefaultFeeReceiver)
        public
        override
    {
        onlyWhitelistedAddress(_msgSender());

        super.setDefaultFeeReceiver(newDefaultFeeReceiver);
    }

    function setFeeReceiver(address token, address wallet) public override {
        onlyWhitelistedAddress(_msgSender());

        super.setFeeReceiver(token, wallet);
    }

    function setProtocolFee(uint256 newProtocolFee) public override {
        onlyWhitelistedAddress(_msgSender());

        super.setProtocolFee(newProtocolFee);
    }

    function setRoyaltiesRegistry(IRoyaltiesProvider newRoyaltiesRegistry)
        public
        override
    {
        onlyWhitelistedAddress(_msgSender());

        super.setRoyaltiesRegistry(newRoyaltiesRegistry);
    }

    function setTransferProxy(bytes4 assetType, address proxy) public override {
        onlyWhitelistedAddress(_msgSender());

        super.setTransferProxy(assetType, proxy);
    }

    function transferOwnership(address newOwner) public override {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(newOwner);

        super.transferOwnership(newOwner);
    }

    function renounceOwnership() public override {
        onlyWhitelistedAddress(_msgSender());

        super.renounceOwnership();
    }

    function whitelistPaymentToken(address token, bool whitelist)
        public
        override
    {
        onlyWhitelistedAddress(_msgSender());

        super.whitelistPaymentToken(token, whitelist);
    }

    function whitelistNativePaymentToken(bool whitelist) public override {
        onlyWhitelistedAddress(_msgSender());

        super.whitelistNativePaymentToken(whitelist);
    }

    function getProtocolFee() internal view override returns (uint256) {
        return protocolFee;
    }
}
