// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../openzeppelin-upgradeable/access/OwnableUpgradeable.sol";
import "../openzeppelin-upgradeable/utils/AddressUpgradeable.sol";

import "./interfaces/ISecuritizeRegistryProxy.sol";
import "./interfaces/IContractsRegistryProxy.sol";

abstract contract WhitelistableUpgradeable is OwnableUpgradeable {
    using AddressUpgradeable for address;

    address public securitizeRegistryProxy;
    address public contractsRegistryProxy;

    modifier onlyContract(address addr) {
        require(addr.isContract(), "Whitelistable: not contract address");
        _;
    }

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

    function setSecuritizeRegistryProxy(address newSecuritizeRegistryProxy)
        external
        onlyOwner
        onlyContract(newSecuritizeRegistryProxy)
    {
        onlyWhitelistedAddress(_msgSender());

        securitizeRegistryProxy = newSecuritizeRegistryProxy;
    }

    function setContractsRegistryProxy(address newContractsRegistryProxy)
        external
        onlyOwner
        onlyContract(newContractsRegistryProxy)
    {
        onlyWhitelistedAddress(_msgSender());

        contractsRegistryProxy = newContractsRegistryProxy;
    }

    function onlyWhitelistedAddress(address addr) public view {
        require(
            ISecuritizeRegistryProxy(securitizeRegistryProxy)
                .isWhitelistedWallet(addr) ||
                IContractsRegistryProxy(contractsRegistryProxy)
                    .isWhitelistedContract(addr),
            "Whitelistable: address is not whitelisted"
        );
    }

    uint256[50] private __gap;
}
