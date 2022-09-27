// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Address.sol";

import "../interfaces/ISecuritizeRegistryProxy.sol";
import "../interfaces/IContractsRegistry.sol";

contract ContractsRegistry is IContractsRegistry, Ownable {
    using Address for address;

    mapping(address => bool) private _contractToWhitelisted;

    address public securitizeRegistryProxy;

    modifier onlyContract(address addr) {
        require(addr.isContract(), "ContractsRegistry: not contract address");
        _;
    }

    modifier onlyWhitelistedWallet(address wallet) {
        require(
            ISecuritizeRegistryProxy(securitizeRegistryProxy)
                .isWhitelistedWallet(wallet),
            "ContractsRegistry: wallet is not whitelisted"
        );
        _;
    }

    constructor(address initialSecuritizeRegistryProxy)
        onlyContract(initialSecuritizeRegistryProxy)
    {
        securitizeRegistryProxy = initialSecuritizeRegistryProxy;
    }

    function addContract(address addr)
        external
        override
        onlyWhitelistedWallet(_msgSender())
        onlyOwner
        onlyContract(addr)
    {
        _contractToWhitelisted[addr] = true;
    }

    function removeContract(address addr)
        external
        override
        onlyWhitelistedWallet(_msgSender())
        onlyOwner
    {
        _contractToWhitelisted[addr] = false;
    }

    function setSecuritizeRegistryProxy(address newSecuritizeRegistryProxy)
        external
        override
        onlyWhitelistedWallet(_msgSender())
        onlyOwner
        onlyContract(newSecuritizeRegistryProxy)
    {
        securitizeRegistryProxy = newSecuritizeRegistryProxy;
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

    function isWhitelisted(address addr) external view override returns (bool) {
        return _contractToWhitelisted[addr];
    }
}
