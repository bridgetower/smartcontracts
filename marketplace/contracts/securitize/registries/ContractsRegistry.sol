// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "../interfaces/ISecuritizeRegistryProxy.sol";
import "../interfaces/IContractsRegistry.sol";

contract ContractsRegistry is IContractsRegistry, Ownable {
    using Address for address;

    mapping(address => bool) private _contractToWhitelisted;

    address public override securitizeRegistryProxy;

    address public override erc1155BridgeTowerFactoryC2;
    

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

    modifier onlyWhitelistedWalletOrContract(address addr) {
        require(
            ISecuritizeRegistryProxy(securitizeRegistryProxy)
                .isWhitelistedWallet(addr) || isWhitelisted(addr),
            "ContractsRegistry: wallet is not whitelisted"
        );
        _;
    }

    modifier onlyOwnerOrFactory(address addr) {
        require(
            _msgSender() == owner() ||
                _msgSender() == erc1155BridgeTowerFactoryC2,
            "ContractsRegistry: caller is not the owner nor the factory"
        );
        _;
    }

    constructor(address initialSecuritizeRegistryProxy)
        onlyContract(initialSecuritizeRegistryProxy)
    {
        securitizeRegistryProxy = initialSecuritizeRegistryProxy;
    }

    /**
        @dev adds a new contract to the whitelist
        @param addr new contract addrress
    */

    function addContract(address addr)
        public
        override
        onlyWhitelistedWalletOrContract(_msgSender())
        onlyOwnerOrFactory(_msgSender())
        onlyContract(addr)
    {
        _contractToWhitelisted[addr] = true;
    }

    /**
        @dev removes a contract from the whitelist
        @param addr contract addrress to remove
    */

    function removeContract(address addr)
        public
        override
        onlyWhitelistedWallet(_msgSender())
        onlyOwner
    {
        _contractToWhitelisted[addr] = false;
    }


    /**
        @dev Sets the securitize registry proxy. 
        Proxy will always point to the securitize registry        
        @param newSecuritizeRegistryProxy Proxy address
    */
    function setSecuritizeRegistryProxy(address newSecuritizeRegistryProxy)
        public
        override
        onlyWhitelistedWallet(_msgSender())
        onlyOwner
        onlyContract(newSecuritizeRegistryProxy)
    {
        securitizeRegistryProxy = newSecuritizeRegistryProxy;
    }

    /**
        @dev Sets the ERC-1155 Bridge tower factory C2. Which is responsible for creating the ERC-1155 contracts
    */

    function setERC1155BridgeTowerFactoryC2(
        address newERC1155BridgeTowerFactoryC2
    )
        public
        override
        onlyWhitelistedWallet(_msgSender())
        onlyOwner
        onlyContract(newERC1155BridgeTowerFactoryC2)
    {
        erc1155BridgeTowerFactoryC2 = newERC1155BridgeTowerFactoryC2;
    }

    /**
        @dev Transfers contract registry ownership
        
        @param newOwner New owner
    */


    function transferOwnership(address newOwner)
        public
        override
        onlyWhitelistedWallet(_msgSender())
        onlyWhitelistedWallet(newOwner)
    {
        super.transferOwnership(newOwner);
    }

    /**
        @dev Renounces ownership. Meaning, there will be no owner.
        Access only owner methods won't no longer be able to be called
    */

    function renounceOwnership()
        public
        override
        onlyWhitelistedWallet(_msgSender())
    {
        super.renounceOwnership();
    }

     /**
        @dev Checks if contract address is whitelisted.
        @param addr address to check
    */

    function isWhitelisted(address addr) public view override returns (bool) {
        return _contractToWhitelisted[addr];
    }
}
