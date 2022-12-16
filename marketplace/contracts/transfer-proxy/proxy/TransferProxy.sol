// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../securitize/WhitelistableUpgradeable.sol";

import "../../interfaces/INftTransferProxy.sol";

import "../roles/OperatorRole.sol";

contract TransferProxy is
    INftTransferProxy,
    Initializable,
    OperatorRole,
    WhitelistableUpgradeable
{
    function __TransferProxy_init(
        address securitizeRegistryProxy,
        address contractsRegistryProxy
    ) external initializer {
        __Ownable_init();
        __Whitelistable_init_unchained(
            securitizeRegistryProxy,
            contractsRegistryProxy
        );
    }

    /**
        @dev Transfer any ERC-721 tokens from a sender to a receiver.
        This method is generally used by the marketplacew
        
        @param token Token address
        @param from sender
        @param to receiver
        @param tokenId Token ID
    */    

    function erc721safeTransferFrom(
        IERC721Upgradeable token,
        address from,
        address to,
        uint256 tokenId
    ) public override onlyOperator {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(from);
        onlyWhitelistedAddress(to);

        token.safeTransferFrom(from, to, tokenId);
    }

    /**
        @dev Transfer any ERC-1155 tokens from a sender to a receiver.
        This method is generally used by the marketplacew
        
        @param token Token address
        @param from sender
        @param to receiver
        @param id Token ID
        @param value Total items to transfer
        @param data Optional data
    */  

    function erc1155safeTransferFrom(
        IERC1155Upgradeable token,
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) public override onlyOperator {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(from);
        onlyWhitelistedAddress(to);

        token.safeTransferFrom(from, to, id, value, data);
    }

    /**
        @dev Adds an operator
        An operator is able to call erc721safeTransferFrom or erc1155safeTransferFrom
        The marketplace contract is one operator

        @param operator New operator
    */

    function addOperator(address operator) public override {
        onlyWhitelistedAddress(_msgSender());

        super.addOperator(operator);
    }

    /**
        @dev Removes an operator
        An operator is able to call erc721safeTransferFrom or erc1155safeTransferFrom
        The marketplace contract is one operator

        @param operator operator to remove
    */

    function removeOperator(address operator) public override {
        onlyWhitelistedAddress(_msgSender());

        super.removeOperator(operator);
    }

    /**
        @dev Transfers ownership
        
        @param newOwner New owner
    */

    function transferOwnership(address newOwner) public override {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(newOwner);

        super.transferOwnership(newOwner);
    }

    /**
        @dev Renounces ownership. Meaning, there will be no owner.
        Access only owner methods won't no longer be able to be called
    */

    function renounceOwnership() public override {
        onlyWhitelistedAddress(_msgSender());

        super.renounceOwnership();
    }
}
