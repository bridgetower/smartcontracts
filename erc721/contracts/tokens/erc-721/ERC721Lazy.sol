// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../../royalties-upgradeable/RoyaltiesUpgradeable.sol";

import "../../lazy-mint/erc-721/IERC721LazyMint.sol";

import "../../royalties/impl/RoyaltiesImpl.sol";

import "../Mint721Validator.sol";

import "./ERC721Upgradeable.sol";

abstract contract ERC721Lazy is
    IERC721LazyMint,
    ERC721Upgradeable,
    Mint721Validator,
    RoyaltiesUpgradeable,
    RoyaltiesImpl
{
    using EnumerableMapUpgradeable for EnumerableMapUpgradeable.UintToAddressMap;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;
    using SafeMathUpgradeable for uint256;

    bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;
    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;
    bytes4 private constant _INTERFACE_ID_ERC721_METADATA = 0x5b5e139f;
    bytes4 private constant _INTERFACE_ID_ERC721_ENUMERABLE = 0x780e9d63;

    mapping(uint256 => LibPart.Part[]) private creators;

    function __ERC721Lazy_init_unchained() internal initializer {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165Upgradeable, ERC165StorageUpgradeable)
        returns (bool)
    {
        return
            interfaceId == LibERC721LazyMint._INTERFACE_ID_MINT_AND_TRANSFER ||
            interfaceId == LibRoyalties._INTERFACE_ID_ROYALTIES ||
            interfaceId == LibRoyalties2981._INTERFACE_ID_ROYALTIES ||
            interfaceId == _INTERFACE_ID_ERC165 ||
            interfaceId == _INTERFACE_ID_ERC721 ||
            interfaceId == _INTERFACE_ID_ERC721_METADATA ||
            interfaceId == _INTERFACE_ID_ERC721_ENUMERABLE;
    }

    function transferFromOrMint(
        LibERC721LazyMint.Mint721Data memory data,
        address from,
        address to
    ) external override {
        if (_exists(data.tokenId)) {
            safeTransferFrom(from, to, data.tokenId);
        } else {
            mintAndTransfer(data, to);
        }
    }

    function mintAndTransfer(
        LibERC721LazyMint.Mint721Data memory data,
        address to
    ) public virtual override {
        address minter = address(uint160(data.tokenId >> 96));
        address sender = _msgSender();

        require(
            minter == data.creators[0].account,
            "ERC721Lazy: incorrect tokenId"
        );
        require(
            data.creators.length == data.signatures.length,
            "ERC721Lazy: creators and signatures length mismatch"
        );
        require(
            minter == sender || isApprovedForAll(minter, sender),
            "ERC721Lazy: transfer caller is not owner nor approved"
        );

        bytes32 hash = LibERC721LazyMint.hash(data);

        for (uint256 i = 0; i < data.creators.length; i++) {
            address creator = data.creators[i].account;

            if (creator != sender) {
                validate(creator, hash, data.signatures[i]);
            }
        }

        _safeMint(to, data.tokenId);
        _saveRoyalties(data.tokenId, data.royalties);
        _saveCreators(data.tokenId, data.creators);
        _setTokenURI(data.tokenId, data.tokenURI);
    }

    function _mint(address to, uint256 tokenId) internal virtual override {
        require(to != address(0), "ERC721Lazy: mint to the zero address");
        require(!_burned(tokenId), "ERC721Lazy: token already burned");
        require(!_exists(tokenId), "ERC721Lazy: token already minted");

        _beforeTokenTransfer(address(0), to, tokenId);

        _holderTokens[to].add(tokenId);

        _tokenOwners.set(tokenId, to);

        address minter = address(uint160(tokenId >> 96));

        if (minter != to) {
            emit Transfer(address(0), minter, tokenId);
            emit Transfer(minter, to, tokenId);
        } else {
            emit Transfer(address(0), to, tokenId);
        }
    }

    function _saveCreators(uint256 tokenId, LibPart.Part[] memory _creators)
        internal
    {
        LibPart.Part[] storage creatorsOfToken = creators[tokenId];
        uint256 total = 0;

        for (uint256 i = 0; i < _creators.length; i++) {
            require(
                _creators[i].account != address(0x0),
                "ERC721Lazy: account should be present"
            );
            require(
                _creators[i].value != 0,
                "ERC721Lazy: creator share should be positive"
            );

            creatorsOfToken.push(_creators[i]);
            total = total.add(_creators[i].value);
        }

        require(
            total == 10000,
            "ERC721Lazy: total amount of creators share should be 10000"
        );

        emit Creators(tokenId, _creators);
    }

    function updateAccount(
        uint256 _id,
        address _from,
        address _to
    ) external {
        require(_msgSender() == _from, "ERC721Lazy: not allowed");

        super._updateAccount(_id, _from, _to);
    }

    function getCreators(uint256 _id)
        external
        view
        returns (LibPart.Part[] memory)
    {
        return creators[_id];
    }

    uint256[50] private __gap;
}
