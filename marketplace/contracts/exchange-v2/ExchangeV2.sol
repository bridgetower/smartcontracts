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

    /**
        @dev Initialization method for the Marketplace. It can only be called once
    */
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

    /**
        @dev Cancels a sale/purchase order. 
        Meaning the order can no longer be used to be matched with another order. So the NFT can't be bought using that order
        
        @param order order object to cancel
    */

    function cancel(LibOrder.Order memory order) public override {
        onlyWhitelistedAddress(_msgSender());

        super.cancel(order);
    }

    /**
        @dev Match a sale order with a purchase order. Method used to buy an NFT
        
        @param orderLeft sale order object
        @param signatureLeft sale order signature
        @param orderLeft purchase order object
        @param signatureLeft purchase order signature
    */

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

    /**
        @dev Sets default fee receiver wallet address used to receive the protocol fee.
        Default receiver is used if there's no receiver set for a specific ERC20 or native token
        
        @param newDefaultFeeReceiver Receiver address
    */

    function setDefaultFeeReceiver(address payable newDefaultFeeReceiver)
        public
        override
    {
        onlyWhitelistedAddress(_msgSender());

        super.setDefaultFeeReceiver(newDefaultFeeReceiver);
    }

    /**
        @dev Sets receiver wallet address used to receive the protocol fee whenever an NFT is purchase with a specific ERC20 or native token
        Default receiver is used if there's no receiver set
        
        @param token Token address to set receiver to
        @param wallet Receiver address
    */

    function setFeeReceiver(address token, address wallet) public override {
        onlyWhitelistedAddress(_msgSender());

        super.setFeeReceiver(token, wallet);
    }

    /**
        @dev Sets protocol fee to charge whenenver an NFT is sold
        Default receiver is used if there's no receiver set
        
        @param newProtocolFee Protocol fee. 
    */

    function setProtocolFee(uint256 newProtocolFee) public override {
        onlyWhitelistedAddress(_msgSender());

        super.setProtocolFee(newProtocolFee);
    }

    /**
        @dev Sets the royalty registry contract used in the marketplace.
        Royalty registry is responsible of detecting the supported royalty standard in the ERC-1155/ERC-721 and distributing the royalties
        
        @param newRoyaltiesRegistry Protocol fee. 
    */

    function setRoyaltiesRegistry(IRoyaltiesProvider newRoyaltiesRegistry)
        public
        override
    {
        onlyWhitelistedAddress(_msgSender());

        super.setRoyaltiesRegistry(newRoyaltiesRegistry);
    }

    /**
        @dev Sets the transfer proxy contract used for ERC-20/ERC-721/ERC-1155 transfers inside the marketplace
        
        @param assetType bytes representation of ERC-20/ERC-721/ERC-1155. 
        @param proxy transfer proxy address. 
    */

    function setTransferProxy(bytes4 assetType, address proxy) public override {
        onlyWhitelistedAddress(_msgSender());

        super.setTransferProxy(assetType, proxy);
    }

    /**
        @dev Transfers marketplace ownership
        
        @param newOwner New marketplace owner
    */

    function transferOwnership(address newOwner) public override {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(newOwner);

        super.transferOwnership(newOwner);
    }

    /**
        @dev Renounces ownership. Meaning, there will be no marketplace owner.
        Access only owner methods won't no longer be able to be called
    */

    function renounceOwnership() public override {
        onlyWhitelistedAddress(_msgSender());

        super.renounceOwnership();
    }

    /**
        @dev Whitelists ERC-20 token to be used as payment for NFT purchase
        @param token Token address to whitelist
        @param whitelist Whitelist/Unwhitelist that token
    */

    function whitelistPaymentToken(address token, bool whitelist)
        public
        override
    {
        onlyWhitelistedAddress(_msgSender());

        super.whitelistPaymentToken(token, whitelist);
    }

    /**
        @dev Whitelists native token (AVAX/ETH/BNB) to be used as payment for NFT purchase
        @param whitelist Whitelist/Unwhitelist that token
    */

    function whitelistNativePaymentToken(bool whitelist) public override {
        onlyWhitelistedAddress(_msgSender());

        super.whitelistNativePaymentToken(whitelist);
    }

    /**
        @dev gets the protocol fee to charge when an NFT is purchased
    */

    function getProtocolFee() internal view override returns (uint256) {
        return protocolFee;
    }
}
