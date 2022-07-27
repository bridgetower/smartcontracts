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
