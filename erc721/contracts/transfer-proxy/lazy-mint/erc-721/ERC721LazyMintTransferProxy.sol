// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../../../lazy-mint/erc-721/LibERC721LazyMint.sol";
import "../../../lazy-mint/erc-721/IERC721LazyMint.sol";

import "../../../interfaces/ITransferProxy.sol";

import "../../roles/OperatorRole.sol";

contract ERC721LazyMintTransferProxy is OperatorRole, ITransferProxy {
    function transfer(
        LibAsset.Asset memory asset,
        address from,
        address to
    ) external override onlyOperator {
        require(asset.value == 1, "erc721 value error");

        (address token, LibERC721LazyMint.Mint721Data memory data) = abi.decode(
            asset.assetType.data,
            (address, LibERC721LazyMint.Mint721Data)
        );

        IERC721LazyMint(token).transferFromOrMint(data, from, to);
    }
}
