// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../openzeppelin-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "../../securitize/WhitelistableUpgradeable.sol";

import "../../interfaces/IERC20TransferProxy.sol";

import "../roles/OperatorRole.sol";

contract ERC20TransferProxy is
    IERC20TransferProxy,
    Initializable,
    OperatorRole,
    WhitelistableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function __ERC20TransferProxy_init(
        address securitizeRegistryProxy,
        address contractsRegistryProxy
    ) public initializer {
        __Ownable_init();
        __Whitelistable_init_unchained(
            securitizeRegistryProxy,
            contractsRegistryProxy
        );
    }

    /**
        @dev Transfer any ERC-20 tokens from a sender to a receiver.
        This method is generally used by the marketplacew
        
        @param token Token address
        @param from sender
        @param to receiver
        @param value Token amount
    */ 

    function erc20safeTransferFrom(
        IERC20Upgradeable token,
        address from,
        address to,
        uint256 value
    ) public override onlyOperator {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(from);
        onlyWhitelistedAddress(to);

        token.safeTransferFrom(from, to, value);
    }

    /**
        @dev Adds an operator
        An operator is able to call erc20safeTransferFrom
        The marketplace contract is one operator

        @param operator New operator
    */

    function addOperator(address operator) public override {
        onlyWhitelistedAddress(_msgSender());

        super.addOperator(operator);
    }

     /**
        @dev Removes an operator
        An operator is able to call erc20safeTransferFrom
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
