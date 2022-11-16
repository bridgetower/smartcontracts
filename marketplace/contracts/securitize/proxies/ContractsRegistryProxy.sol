// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "../interfaces/ISecuritizeRegistryProxy.sol";
import "../interfaces/IContractsRegistryProxy.sol";
import "../interfaces/IContractsRegistry.sol";

contract ContractsRegistryProxy is IContractsRegistryProxy, Ownable, AccessControlEnumerable {
    using Address for address;

    address public override securitizeRegistryProxy;

    address public override contractsRegistry;

    modifier onlyContract(address addr) {
        require(
            addr.isContract(),
            "ContractsRegistryProxy: not contract address"
        );
        _;
    }

    modifier onlyWhitelistedWallet(address wallet) {
        require(
            ISecuritizeRegistryProxy(securitizeRegistryProxy)
                .isWhitelistedWallet(wallet),
            "ContractsRegistryProxy: wallet is not whitelisted"
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

    constructor(
        address initialSecuritizeRegistryProxy,
        address initialContractsRegistry
    )
        onlyContract(initialSecuritizeRegistryProxy)
        onlyContract(initialContractsRegistry)
    {
        securitizeRegistryProxy = initialSecuritizeRegistryProxy;
        contractsRegistry = initialContractsRegistry;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function addAdmin(address newAdmin) external onlyAdmin {
        _setupRole(DEFAULT_ADMIN_ROLE, newAdmin);
    }

    function setContractsRegistry(address newContractsRegistry)
        public
        override
        onlyWhitelistedWallet(_msgSender())
        onlyAdmin
        onlyContract(newContractsRegistry)
    {
        contractsRegistry = newContractsRegistry;
    }

    function setSecuritizeRegistryProxy(address newSecuritizeRegistryProxy)
        public
        override
        onlyWhitelistedWallet(_msgSender())
        onlyAdmin
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

    function isWhitelistedContract(address addr)
        public
        view
        override
        returns (bool)
    {
        return IContractsRegistry(contractsRegistry).isWhitelisted(addr);
    }
}
