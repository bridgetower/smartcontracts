// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/proxy/beacon/IBeaconUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "../securitize/WhitelistableUpgradeable.sol";

contract BeaconUpgradeable is
    IBeaconUpgradeable,
    OwnableUpgradeable,
    WhitelistableUpgradeable
{
    address private _implementation;

    event Upgraded(address indexed implementation);

    function __Beacon_init(
        address initialSecuritizeRegistryProxy,
        address initialContractsRegistryProxy,
        address initialImplementation
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Whitelistable_init_unchained(
            initialSecuritizeRegistryProxy,
            initialContractsRegistryProxy
        );
        __Beacon_init_unchained(initialImplementation);
    }

    function __Beacon_init_unchained(address initialImplementation)
        public
        initializer
    {
        _setImplementation(initialImplementation);
    }

    function upgradeTo(address newImplementation) external onlyOwner {
        onlyWhitelistedAddress(_msgSender());

        _setImplementation(newImplementation);

        emit Upgraded(newImplementation);
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

    function implementation() external view override returns (address) {
        return _implementation;
    }

    function _setImplementation(address newImplementation) private {
        require(
            AddressUpgradeable.isContract(newImplementation),
            "Beacon: implementation is not a contract"
        );

        _implementation = newImplementation;
    }

    uint256[50] private __gap;
}
