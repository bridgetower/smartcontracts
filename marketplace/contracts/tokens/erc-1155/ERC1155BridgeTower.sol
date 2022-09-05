// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../../securitize/WhitelistableUpgradeable.sol";

import "../access/MinterAccessControl.sol";

import "../IsPrivateCollection.sol";

import "./ERC1155Base.sol";

contract ERC1155BridgeTower is
    ERC1155Base,
    IsPrivateCollection,
    MinterAccessControl,
    WhitelistableUpgradeable
{
    event CreateERC1155BridgeTower(address owner, string name, string symbol);
    event CreateERC1155BridgeTowerUser(
        address owner,
        string name,
        string symbol
    );

    function __ERC1155BridgeTowerUser_init(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        address[] memory operators,
        address transferProxy,
        address lazyTransferProxy,
        address securitizeRegistryProxy,
        address contractsRegistryProxy,
        uint256 lockPeriod
    ) external virtual {
        __ERC1155BridgeTower_init_unchained(
            _name,
            _symbol,
            baseURI,
            contractURI,
            transferProxy,
            lazyTransferProxy,
            securitizeRegistryProxy,
            contractsRegistryProxy,
            lockPeriod
        );

        for (uint256 i = 0; i < operators.length; i++) {
            setApprovalForAll(operators[i], true);
        }

        isPrivate = true;

        emit CreateERC1155BridgeTowerUser(_msgSender(), _name, _symbol);
    }

    function __ERC1155BridgeTower_init(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        address transferProxy,
        address lazyTransferProxy,
        address securitizeRegistryProxy,
        address contractsRegistryProxy,
        uint256 lockPeriod
    ) external virtual {
        __ERC1155BridgeTower_init_unchained(
            _name,
            _symbol,
            baseURI,
            contractURI,
            transferProxy,
            lazyTransferProxy,
            securitizeRegistryProxy,
            contractsRegistryProxy,
            lockPeriod
        );

        isPrivate = false;

        emit CreateERC1155BridgeTower(_msgSender(), _name, _symbol);
    }

    function __ERC1155BridgeTower_init_unchained(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        address transferProxy,
        address lazyTransferProxy,
        address securitizeRegistryProxy,
        address contractsRegistryProxy,
        uint256 lockPeriod
    ) internal initializer {
        __Ownable_init_unchained();
        __ERC1155Lazy_init_unchained();
        __ERC165_init_unchained();
        __Context_init_unchained();
        __Mint1155Validator_init_unchained();
        __ERC1155_init_unchained("", transferProxy);
        __HasContractURI_init_unchained(contractURI);
        __RoyaltiesUpgradeable_init_unchained();
        __ERC1155Base_init_unchained(_name, _symbol);
        __ERC1155Lockable_init_unchained(lockPeriod);
        __MinterAccessControl_init_unchained();
        __Whitelistable_init_unchained(
            securitizeRegistryProxy,
            contractsRegistryProxy
        );

        _setBaseURI(baseURI);

        // Setting default approve for transfer proxies
        _setDefaultApproval(transferProxy, true);
        _setDefaultApproval(lazyTransferProxy, true);
    }

    function transferFromOrMint(
        LibERC1155LazyMint.Mint1155Data memory data,
        address from,
        address to,
        uint256 amount
    ) external override {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(from);
        onlyWhitelistedAddress(to);

        super._transferFromOrMint(data, from, to, amount);
    }

    function mintAndTransfer(
        LibERC1155LazyMint.Mint1155Data memory data,
        address to,
        uint256 amount
    ) public override {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(to);

        if (isPrivate) {
            require(
                owner() == data.creators[0].account ||
                    isMinter(data.creators[0].account),
                "ERC1155BridgeTower: not owner nor minter"
            );
        }

        super.mintAndTransfer(data, to, amount);
    }

    function updateAccount(
        uint256 id,
        address from,
        address to
    ) external {
        onlyWhitelistedAddress(_msgSender());

        super._updateAccount(id, from, to);
    }

    function setBaseURI(string memory newBaseURI) external {
        onlyWhitelistedAddress(_msgSender());

        super._setBaseURI(newBaseURI);
    }

    function setApprovalForAll(address operator, bool approved)
        public
        override(ERC1155Upgradeable)
    {
        onlyWhitelistedAddress(_msgSender());

        super.setApprovalForAll(operator, approved);
    }

    function addMinter(address minter) public override {
        onlyWhitelistedAddress(_msgSender());

        super.addMinter(minter);
    }

    function removeMinter(address minter) public override {
        onlyWhitelistedAddress(_msgSender());

        super.removeMinter(minter);
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

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override(ERC1155Upgradeable) {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(from);
        onlyWhitelistedAddress(to);

        super.safeTransferFrom(from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override(ERC1155Upgradeable) {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(from);
        onlyWhitelistedAddress(to);

        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    function unlock(address user, uint256 id) public override(ERC1155Lockable) {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(user);

        super.unlock(user, id);
    }
}
