//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../securitize/WhitelistableUpgradeable.sol";

contract AggregatorUpgradeable is OwnableUpgradeable, WhitelistableUpgradeable {
    int256 private totalStakedAmount;

    function __Aggregator_init(
        address initialSecuritizeRegistryProxy,
        address initialContractsRegistryProxy,
        int256 initialTotalStakedAmount
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Whitelistable_init_unchained(
            initialSecuritizeRegistryProxy,
            initialContractsRegistryProxy
        );
        __Aggregator_init_unchained(initialTotalStakedAmount);
    }

    function __Aggregator_init_unchained(int256 initialTotalStakedAmount)
        public
        initializer
    {
        totalStakedAmount = initialTotalStakedAmount;
    }

    function setTotalStakedAmount(int256 newTotalStakedAmount)
        external
        onlyOwner
    {
        onlyWhitelistedAddress(_msgSender());

        totalStakedAmount = newTotalStakedAmount;
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

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            uint80(0),
            totalStakedAmount,
            uint256(0),
            uint256(0),
            uint80(0)
        );
    }

    uint256[50] private __gap;
}
