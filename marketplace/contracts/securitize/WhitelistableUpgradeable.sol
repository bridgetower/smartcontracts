// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../openzeppelin-upgradeable/access/OwnableUpgradeable.sol";
import "../openzeppelin-upgradeable/utils/AddressUpgradeable.sol";

import "./interfaces/ISecuritizeRegistryProxy.sol";
import "./interfaces/IContractsRegistryProxy.sol";

error NotWhitelisted(address addr);

abstract contract WhitelistableUpgradeable is OwnableUpgradeable {
    using AddressUpgradeable for address;

    address public securitizeRegistryProxy;
    address public contractsRegistryProxy;

    modifier onlyContract(address addr) {
        require(addr.isContract(), "Whitelistable: not contract address");
        _;
    }

    /**
        @dev Initialization method for contract. It can only be called once
    */

    function __Whitelistable_init(
        address initialSecuritizeRegistryProxy,
        address initialContractsRegistryProxy
    ) internal {
        __Ownable_init_unchained();
        __Whitelistable_init_unchained(
            initialSecuritizeRegistryProxy,
            initialContractsRegistryProxy
        );
    }

    function __Whitelistable_init_unchained(
        address initialSecuritizeRegistryProxy,
        address initialContractsRegistryProxy
    )
        internal
        onlyContract(initialSecuritizeRegistryProxy)
        onlyContract(initialContractsRegistryProxy)
    {
        securitizeRegistryProxy = initialSecuritizeRegistryProxy;
        contractsRegistryProxy = initialContractsRegistryProxy;
    }

    /**
        @dev Sets the securitize registry proxy. 
        Proxy will always point to the securitize registry        
        @param newSecuritizeRegistryProxy Proxy address
    */

    function setSecuritizeRegistryProxy(address newSecuritizeRegistryProxy)
        external
        onlyOwner
        onlyContract(newSecuritizeRegistryProxy)
    {
        onlyWhitelistedAddress(_msgSender());

        securitizeRegistryProxy = newSecuritizeRegistryProxy;
    }

    /**
        @dev Sets the contract registry proxy
        Proxy will always point to the contract registry        
        @param newContractsRegistryProxy Proxy address
    */

    function setContractsRegistryProxy(address newContractsRegistryProxy)
        external
        onlyOwner
        onlyContract(newContractsRegistryProxy)
    {
        onlyWhitelistedAddress(_msgSender());

        contractsRegistryProxy = newContractsRegistryProxy;
    }

    /**
        @dev Checks if address is whitelisted either on securitize registry or contract registry.
        This method is used in all marketplace calleable methods. 
        If address is not whitelisted then the transaction will fail
        @param addr address to check
    */

    function onlyWhitelistedAddress(address addr) public view {
        if (
            !ISecuritizeRegistryProxy(securitizeRegistryProxy)
                .isWhitelistedWallet(addr) &&
            !IContractsRegistryProxy(contractsRegistryProxy)
                .isWhitelistedContract(addr)
        ) {
            revert NotWhitelisted(addr);
        }
    }

    uint256[50] private __gap;
}
