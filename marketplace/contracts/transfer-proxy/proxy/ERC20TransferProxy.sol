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

    function addOperator(address operator) public override {
        onlyWhitelistedAddress(_msgSender());

        super.addOperator(operator);
    }

    function removeOperator(address operator) public override {
        onlyWhitelistedAddress(_msgSender());

        super.removeOperator(operator);
    }

    function transferOwnership(address newOwner) public override {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(newOwner);

        super.transferOwnership(newOwner);
    }

    function renounceOwnership() public override {
        onlyWhitelistedAddress(_msgSender());

        super.renounceOwnership();
    }
}
