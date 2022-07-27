// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../../openzeppelin-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

import "../../royalties/LibPart.sol";

import "./LibERC1155LazyMint.sol";

interface IERC1155LazyMint is IERC1155Upgradeable {
    event Supply(uint256 tokenId, uint256 value);
    event Creators(uint256 tokenId, LibPart.Part[] creators);

    function mintAndTransfer(
        LibERC1155LazyMint.Mint1155Data memory data,
        address to,
        uint256 _amount
    ) external;

    function transferFromOrMint(
        LibERC1155LazyMint.Mint1155Data memory data,
        address from,
        address to,
        uint256 amount
    ) external;
}
