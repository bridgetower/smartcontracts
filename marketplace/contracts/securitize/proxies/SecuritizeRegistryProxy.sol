// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "../interfaces/ISecuritizeRegistryProxy.sol";
import "../interfaces/ISecuritizeRegistry.sol";

contract SecuritizeRegistryProxy is ISecuritizeRegistryProxy, Ownable, AccessControlEnumerable {
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

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "ContractsRegistryProxy: must have admin role"
        );
        _;
    }

    constructor(address initialSecuritizeRegistry)
        onlyContract(initialSecuritizeRegistry)
    {
        securitizeRegistry = initialSecuritizeRegistry;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function addAdmin(address newAdmin) external onlyAdmin {
        _setupRole(DEFAULT_ADMIN_ROLE, newAdmin);
    }

    function setSecuritizeRegistry(address newSecuritizeRegistry)
        public
        override
        onlyWhitelistedWallet(_msgSender())
        onlyAdmin
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
