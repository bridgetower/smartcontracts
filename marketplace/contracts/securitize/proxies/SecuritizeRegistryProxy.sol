// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "../interfaces/ISecuritizeRegistryProxy.sol";
import "../interfaces/ISecuritizeRegistry.sol";

contract SecuritizeRegistryProxy is ISecuritizeRegistryProxy, Ownable {
    using Address for address;

    address public override securitizeRegistry;

    modifier onlyContract(address addr) {
        require(
            addr.isContract(),
            "SecuritizeRegistryProxy: not contract address"
        );
        _;
    }

    modifier onlyWhitelistedWallet(address wallet) {
        require(
            isWhitelistedWallet(wallet),
            "SecuritizeRegistryProxy: wallet is not whitelisted"
        );
        _;
    }

    constructor(address initialSecuritizeRegistry)
        onlyContract(initialSecuritizeRegistry)
    {
        securitizeRegistry = initialSecuritizeRegistry;
    }

    function setSecuritizeRegistry(address newSecuritizeRegistry)
        public
        override
        onlyWhitelistedWallet(_msgSender())
        onlyOwner
        onlyContract(newSecuritizeRegistry)
    {
        securitizeRegistry = newSecuritizeRegistry;
    }

    function transferOwnership(address newOwner)
        public
        override
        onlyWhitelistedWallet(_msgSender())
        onlyWhitelistedWallet(newOwner)
    {
        super.transferOwnership(newOwner);
    }

    function renounceOwnership()
        public
        override
        onlyWhitelistedWallet(_msgSender())
    {
        super.renounceOwnership();
    }

    function isWhitelistedWallet(address wallet)
        public
        view
        override
        returns (bool)
    {
        return ISecuritizeRegistry(securitizeRegistry).isWhitelisted(wallet);
    }
}
