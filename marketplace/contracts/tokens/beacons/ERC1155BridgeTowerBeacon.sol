// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../securitize/WhitelistableUpgradeable.sol";

import "./BeaconUpgradeable.sol";

contract ERC1155BridgeTowerBeacon is
    WhitelistableUpgradeable,
    BeaconUpgradeable
{
    constructor(
        address implementation,
        address securitizeRegistryProxy,
        address contractsRegistryProxy
    ) BeaconUpgradeable(implementation) initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Whitelistable_init_unchained(
            securitizeRegistryProxy,
            contractsRegistryProxy
        );
    }

    function upgradeTo(address newImplementation) public override {
        onlyWhitelistedAddress(_msgSender());

        super.upgradeTo(newImplementation);
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
