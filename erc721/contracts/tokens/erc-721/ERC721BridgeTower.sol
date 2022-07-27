// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "./ERC721Base.sol";

contract ERC721BridgeTower is ERC721Base {
    event CreateERC721BridgeTower(address owner, string name, string symbol);

    function __ERC721BridgeTower_init(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        address transferProxy,
        address lazyTransferProxy
    ) external initializer {
        __ERC721BridgeTower_init_unchained(
            _name,
            _symbol,
            baseURI,
            contractURI,
            transferProxy,
            lazyTransferProxy
        );

        emit CreateERC721BridgeTower(_msgSender(), _name, _symbol);
    }

    function __ERC721BridgeTower_init_unchained(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        address transferProxy,
        address lazyTransferProxy
    ) internal {
        _setBaseURI(baseURI);
        __ERC721Lazy_init_unchained();
        __RoyaltiesUpgradeable_init_unchained();
        __Context_init_unchained();
        __ERC165_init_unchained();
        __Ownable_init_unchained();
        __ERC721Burnable_init_unchained();
        __Mint721Validator_init_unchained();
        __HasContractURI_init_unchained(contractURI);
        __ERC721_init_unchained(_name, _symbol);

        // Setting default approver for transfer proxies
        _setDefaultApproval(transferProxy, true);
        _setDefaultApproval(lazyTransferProxy, true);
    }

    uint256[50] private __gap;
}
