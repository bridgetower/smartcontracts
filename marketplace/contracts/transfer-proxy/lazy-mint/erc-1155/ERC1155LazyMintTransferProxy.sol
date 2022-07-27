// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../../../lazy-mint/erc-1155/LibERC1155LazyMint.sol";
import "../../../lazy-mint/erc-1155/IERC1155LazyMint.sol";

import "../../../securitize/WhitelistableUpgradeable.sol";

import "../../../interfaces/ITransferProxy.sol";

import "../../roles/OperatorRole.sol";

contract ERC1155LazyMintTransferProxy is
    OperatorRole,
    ITransferProxy,
    WhitelistableUpgradeable
{
    constructor(address securitizeRegistryProxy, address contractsRegistryProxy)
    {
        __Whitelistable_init_unchained(
            securitizeRegistryProxy,
            contractsRegistryProxy
        );
    }

    function transfer(
        LibAsset.Asset memory asset,
        address from,
        address to
    ) public override onlyOperator {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(from);
        onlyWhitelistedAddress(to);

        (address token, LibERC1155LazyMint.Mint1155Data memory data) = abi
            .decode(
                asset.assetType.data,
                (address, LibERC1155LazyMint.Mint1155Data)
            );

        IERC1155LazyMint(token).transferFromOrMint(data, from, to, asset.value);
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
