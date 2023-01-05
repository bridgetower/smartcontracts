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

    /**
        @dev Initialization method for the ERC1155. It can only be called once.
        It creates a private collection, which means only owners and authorized users (minters) can call mintAndTransfer method
        It also approve by default a list of operators to be able to transfer the contract owner's NFTs on his behalf
    */

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

    /**
        @dev Initialization method for the ERC1155. It can only be called once.
        It creates a non private collection, which means anyone can call mintAndTransfer method
    */


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

    /**
        @dev Transfers NFTs from a sender to a receiver.
        If the sender doesn't have enough funds, the rest will be minted and transferred.
        It also sets the royalties information and max NFT Id supply if not set
    */

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

    /**
        @dev Mints and transfers NFTs to the receiver.
        It also sets the royalties information and max NFT Id supply if not set
        This function is internally called by transferFromOrMint
    */

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

    /**
        @dev Updates royalties receiver address for an NFT Id
    */

    function updateAccount(
        uint256 id,
        address from,
        address to
    ) external {
        onlyWhitelistedAddress(_msgSender());

        super._updateAccount(id, from, to);
    }

    /**
        @dev Sets base URI for metadata
    */

    function setBaseURI(string memory newBaseURI) external {
        onlyWhitelistedAddress(_msgSender());

        super._setBaseURI(newBaseURI);
    }

    /**
        @dev Approves NFTs to be transferred on belhalf of an operator
    */

    function setApprovalForAll(address operator, bool approved)
        public
        override(ERC1155Upgradeable)
    {
        onlyWhitelistedAddress(_msgSender());

        super.setApprovalForAll(operator, approved);
    }

    /**
        @dev Authorize an user to be able to call mintAndTransfer. Valid for private collections only
    */

    function addMinter(address minter) public override {
        onlyWhitelistedAddress(_msgSender());

        super.addMinter(minter);
    }

    /**
        @dev Revokes minter role
    */

    function removeMinter(address minter) public override {
        onlyWhitelistedAddress(_msgSender());

        super.removeMinter(minter);
    }

    /**
        @dev Transfers contract ownership
        
        @param newOwner New marketplace owner
    */

    function transferOwnership(address newOwner) public override {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(newOwner);

        super.transferOwnership(newOwner);
    }

    /**
        @dev Renounces ownership. Meaning, there will be no contract owner.
        Access only owner methods won't no longer be able to be called
    */

    function renounceOwnership() public override {
        onlyWhitelistedAddress(_msgSender());

        super.renounceOwnership();
    }

    /**
        @dev Transfers multiple NFts with the same IDs from a sender to a receiver
    */

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

    /**
        @dev Transfers multiple NFts with mutiple IDs from a sender to a receiver
    */

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

    /**
        @dev Sets/Updates the NFTs lock period.
        Lock period is applied to NFTs when they're purchased on the marketplace
    */

    function setLockPeriod(uint256 newLockPeriod) external onlyOwner {
        onlyWhitelistedAddress(_msgSender());
        _setLockPeriod(newLockPeriod);   
    }

    /**
        @dev Manually unlocks an NFT after NFT lock period has ended
        Which means the NFT will be transferrable
        Notice this method is also automatically called whenever the user is trying to transfer an NFT afer lock period has ended
    */

    function unlock(address user, uint256 id) public override(ERC1155Lockable) {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(user);

        super.unlock(user, id);
    }
}
