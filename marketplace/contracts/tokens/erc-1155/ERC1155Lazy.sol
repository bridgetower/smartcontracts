// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../../royalties-upgradeable/RoyaltiesUpgradeable.sol";

import "../../lazy-mint/erc-1155/IERC1155LazyMint.sol";

import "../../royalties/impl/RoyaltiesImpl.sol";

import "./ERC1155Upgradeable.sol";
import "./Mint1155Validator.sol";
import "./ERC1155BaseURI.sol";

abstract contract ERC1155Lazy is
    IERC1155LazyMint,
    ERC1155BaseURI,
    Mint1155Validator,
    RoyaltiesUpgradeable,
    RoyaltiesImpl
{
    using SafeMathUpgradeable for uint256;

    bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;
    bytes4 private constant _INTERFACE_ID_ERC1155 = 0xd9b67a26;
    bytes4 private constant _INTERFACE_ID_ERC1155_METADATA_URI = 0x0e89341c;

    mapping(uint256 => LibPart.Part[]) private creators;
    mapping(uint256 => uint256) private supply;
    mapping(uint256 => uint256) private minted;

    function __ERC1155Lazy_init_unchained() internal initializer {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165Upgradeable, ERC165StorageUpgradeable)
        returns (bool)
    {
        return
            interfaceId == LibERC1155LazyMint._INTERFACE_ID_MINT_AND_TRANSFER ||
            interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES ||
            interfaceId == LibRoyalties2981._INTERFACE_ID_ROYALTIES ||
            interfaceId == _INTERFACE_ID_ERC165 ||
            interfaceId == _INTERFACE_ID_ERC1155 ||
            interfaceId == _INTERFACE_ID_ERC1155_METADATA_URI;
    }

    function _transferFromOrMint(
        LibERC1155LazyMint.Mint1155Data memory data,
        address from,
        address to,
        uint256 amount
    ) internal {
        uint256 balance = balanceOf(from, data.tokenId);
        uint256 left = amount;

        if (balance != 0) {
            uint256 transfer = amount;

            if (balance < amount) {
                transfer = balance;
            }

            safeTransferFrom(from, to, data.tokenId, transfer, "");

            left = amount - transfer;
        }

        if (left > 0) {
            mintAndTransfer(data, to, left);
        }
    }

    function mintAndTransfer(
        LibERC1155LazyMint.Mint1155Data memory data,
        address to,
        uint256 amount
    ) public virtual override {
        address minter = address(uint160(data.tokenId >> 96));
        address sender = _msgSender();

        require(
            minter == sender || isApprovedForAll(minter, sender),
            "ERC1155Lazy: transfer caller is not approved"
        );
        require(amount > 0, "ERC1155Lazy: incorrect amount");

        if (supply[data.tokenId] == 0) {
            require(
                minter == data.creators[0].account,
                "ERC1155Lazy: incorrect tokenId"
            );
            require(data.supply > 0, "ERC1155Lazy: incorrect supply");
            require(
                data.creators.length == data.signatures.length,
                "ERC1155Lazy: creators and signatures length mismatch"
            );

            bytes32 hash = LibERC1155LazyMint.hash(data);

            for (uint256 i = 0; i < data.creators.length; i++) {
                address creator = data.creators[i].account;

                if (creator != sender) {
                    validate(creator, hash, data.signatures[i]);
                }
            }

            _saveSupply(data.tokenId, data.supply);
            _saveRoyalties(data.tokenId, data.royalties);
            _saveCreators(data.tokenId, data.creators);
            _setTokenURI(data.tokenId, data.tokenURI);
        }

        _mint(to, data.tokenId, amount, "");

        if (minter != to) {
            emit TransferSingle(
                sender,
                address(0),
                minter,
                data.tokenId,
                amount
            );
            emit TransferSingle(sender, minter, to, data.tokenId, amount);
        } else {
            emit TransferSingle(sender, address(0), to, data.tokenId, amount);
        }
    }

    function _mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual override {
        uint256 newMinted = amount.add(minted[id]);

        require(newMinted <= supply[id], "ERC1155Lazy: more than supply");

        minted[id] = newMinted;

        require(account != address(0), "ERC1155Lazy: mint to the zero address");

        address operator = _msgSender();

        _beforeTokenTransfer(
            operator,
            address(0),
            account,
            _asSingletonArray(id),
            _asSingletonArray(amount),
            data
        );

        _balances[id][account] = _balances[id][account].add(amount);

        _doSafeTransferAcceptanceCheck(
            operator,
            address(0),
            account,
            id,
            amount,
            data
        );
    }

    function _saveSupply(uint256 tokenId, uint256 _supply) internal {
        require(supply[tokenId] == 0, "ERC1155Lazy: supply must be zero");

        supply[tokenId] = _supply;

        emit Supply(tokenId, _supply);
    }

    function _saveCreators(uint256 tokenId, LibPart.Part[] memory _creators)
        internal
    {
        LibPart.Part[] storage creatorsOfToken = creators[tokenId];
        uint256 total = 0;

        for (uint256 i = 0; i < _creators.length; i++) {
            require(
                _creators[i].account != address(0),
                "ERC1155Lazy: account should be present"
            );
            require(
                _creators[i].value != 0,
                "ERC1155Lazy: creator share should be positive"
            );

            creatorsOfToken.push(_creators[i]);
            total = total.add(_creators[i].value);
        }

        require(
            total == 10000,
            "ERC1155Lazy: total amount of creators share should be 10000"
        );

        emit Creators(tokenId, _creators);
    }

    function _updateAccount(
        uint256 _id,
        address _from,
        address _to
    ) internal override {
        require(_msgSender() == _from, "ERC1155Lazy: not allowed");

        super._updateAccount(_id, _from, _to);
    }

    function getCreators(uint256 _id)
        external
        view
        returns (LibPart.Part[] memory)
    {
        return creators[_id];
    }

    // function _addMinted(uint256 tokenId, uint256 amount) internal {
    //     minted[tokenId] += amount;
    // }

    // function _getMinted(uint256 tokenId) internal view returns (uint256) {
    //     return minted[tokenId];
    // }

    // function _getSupply(uint256 tokenId) internal view returns (uint256) {
    //     return supply[tokenId];
    // }

    uint256[50] private __gap;
}
