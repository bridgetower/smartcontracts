// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../../openzeppelin-upgradeable/access/OwnableUpgradeable.sol";

import "./ERC1155DefaultApproval.sol";
import "./ERC1155Lazy.sol";

import "../HasContractURI.sol";

abstract contract ERC1155Base is
    OwnableUpgradeable,
    ERC1155DefaultApproval,
    ERC1155Lazy,
    HasContractURI
{
    string public name;
    string public symbol;

    event BaseUriChanged(string newBaseURI);

    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override(ERC1155DefaultApproval, IERC1155Upgradeable)
        returns (bool)
    {
        return ERC1155DefaultApproval.isApprovedForAll(_owner, _operator);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155Lazy, ERC165StorageUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual override(ERC1155Upgradeable, ERC1155Lazy) {
        ERC1155Lazy._mint(account, id, amount, data);
    }

    function __ERC1155Base_init_unchained(
        string memory _name,
        string memory _symbol
    ) internal initializer {
        name = _name;
        symbol = _symbol;
    }

    function uri(uint256 id)
        external
        view
        virtual
        override(ERC1155BaseURI, ERC1155Upgradeable)
        returns (string memory)
    {
        return _tokenURI(id);
    }

    function _setBaseURI(string memory newBaseURI)
        internal
        virtual
        override
        onlyOwner
    {
        super._setBaseURI(newBaseURI);

        emit BaseUriChanged(newBaseURI);
    }

    uint256[50] private __gap;
}
