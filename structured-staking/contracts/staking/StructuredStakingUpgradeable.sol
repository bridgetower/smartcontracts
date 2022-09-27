//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";

import "../validation-nodes-provider/ValidationNodesProviderFactoryC2Upgradable.sol";

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "../securitize/WhitelistableUpgradeable.sol";

import "../chainlink/IAggregatorV3.sol";

contract StructuredStakingUpgradeable is
    ReentrancyGuardUpgradeable,
    ERC1155Upgradeable,
    ERC1155URIStorageUpgradeable,
    ERC1155SupplyUpgradeable,
    WhitelistableUpgradeable,
    ValidationNodesProviderFactoryC2Upgradable
{
    struct StakingPool {
        uint256 poolId;
        uint256 totalStaked;
        uint256 stakingPeriodEnd;
        uint256 cumulativeRewardPerStake;
        address validationNodesProvider;
        address aggregator;
        bool finalized;
        mapping(address => uint256) stakes;
        mapping(address => uint256) earned;
        mapping(address => uint256) accountCumulativeRewardPerStake;
    }

    uint256 public constant PRECISION = 10**18;

    uint256 public stakingPoolsCount;

    address public centralBTWallet;

    mapping(uint256 => StakingPool) public stakingPools;

    event StakingPoolLaunched(uint256 indexed poolId);
    event StakingPoolFinalized(uint256 indexed poolId, uint256 rewardsAmount);
    event Staked(
        uint256 indexed poolId,
        address indexed account,
        uint256 amount
    );
    event Claimed(
        uint256 indexed poolId,
        address indexed account,
        uint256 amount
    );

    modifier onlyExistingPool(uint256 poolId) {
        require(
            poolId < stakingPoolsCount,
            "Staking: staking pool doesn't exist"
        );
        _;
    }

    modifier onlyValidContract(address addr) {
        require(
            AddressUpgradeable.isContract(addr),
            "Staking: not contract address"
        );
        _;
    }

    function __StructuredStaking_init(
        address initialSecuritizeRegistryProxy,
        address initialContractsRegistryProxy,
        address initialBeacon,
        address initialCentralBTWallet
    ) external initializer {
        __ReentrancyGuard_init_unchained();
        __Context_init_unchained();
        __Ownable_init_unchained();
        __ERC165_init_unchained();
        __ERC1155_init_unchained("");
        __ERC1155URIStorage_init_unchained();
        __ERC1155Supply_init_unchained();
        __Whitelistable_init_unchained(
            initialSecuritizeRegistryProxy,
            initialContractsRegistryProxy
        );
        __ValidationNodesProviderFactoryC2_init_unchained(initialBeacon);
        __StructuredStaking_init_unchained(initialCentralBTWallet);
    }

    function __StructuredStaking_init_unchained(address initialCentralBTWallet)
        public
        initializer
    {
        centralBTWallet = initialCentralBTWallet;
    }

    function updateCentralBTWallet(address newCentralBTWallet)
        external
        onlyOwner
    {
        onlyWhitelistedAddress(_msgSender());

        centralBTWallet = newCentralBTWallet;
    }

    function setAggregator(uint256 poolId, address aggregator)
        external
        onlyOwner
        onlyExistingPool(poolId)
        onlyValidContract(aggregator)
    {
        onlyWhitelistedAddress(_msgSender());

        StakingPool storage stakingPool = stakingPools[poolId];

        stakingPool.aggregator = aggregator;
    }

    function launchStakingPool(
        uint256 stakingPeriodEnd,
        string memory tokenURI,
        string[] memory validationNodes
    ) external onlyOwner returns (uint256) {
        onlyWhitelistedAddress(_msgSender());

        require(
            stakingPeriodEnd > block.timestamp,
            "Staking: wrong staking period end"
        );

        StakingPool storage stakingPool = stakingPools[stakingPoolsCount];

        stakingPool.poolId = stakingPoolsCount;
        stakingPool.stakingPeriodEnd = stakingPeriodEnd;
        stakingPool.validationNodesProvider = createValidationNodesProvider(
            securitizeRegistryProxy,
            contractsRegistryProxy,
            validationNodes,
            stakingPoolsCount // salt, it increases in time of creation of a new staking pool
        );

        super._setURI(stakingPoolsCount, tokenURI);

        stakingPoolsCount += 1;

        emit StakingPoolLaunched(stakingPool.poolId);

        return stakingPool.poolId;
    }

    function finalizeStakingPool(uint256 poolId, uint256 rewardsAmount)
        external
        payable
        onlyOwner
        onlyExistingPool(poolId)
    {
        onlyWhitelistedAddress(_msgSender());

        require(
            msg.value == rewardsAmount + stakingPools[poolId].totalStaked,
            "Staking: provided wrong amount of tokens"
        );
        require(
            block.timestamp >= stakingPools[poolId].stakingPeriodEnd,
            "Staking: staking pool isn't finished"
        );
        require(
            stakingPools[poolId].finalized != true,
            "Staking: staking pool is already finalized"
        );

        StakingPool storage stakingPool = stakingPools[poolId];

        if (stakingPool.totalStaked > 0) {
            stakingPool.cumulativeRewardPerStake =
                (rewardsAmount * PRECISION) /
                stakingPool.totalStaked;
        } else {
            // Transfer rewards back because they can't be distributed (no one staked into a pool)
            payable(_msgSender()).transfer(msg.value);
        }

        stakingPool.finalized = true;

        emit StakingPoolFinalized(poolId, rewardsAmount);
    }

    function stake(uint256 poolId, uint256 amount)
        external
        payable
        nonReentrant
        onlyExistingPool(poolId)
    {
        onlyWhitelistedAddress(_msgSender());

        require(
            block.timestamp < stakingPools[poolId].stakingPeriodEnd,
            "Staking: staking pool is finished"
        );
        require(amount > 0, "Staking: amount to stake must be greater than 0");

        uint256 availableToStakeAmount = getAvailableToStakeAmount(poolId);

        require(
            amount <= availableToStakeAmount,
            "Staking: amount to stake is too big"
        );
        require(
            msg.value == amount,
            "Staking: provided wrong amount of tokens"
        );

        StakingPool storage stakingPool = stakingPools[poolId];

        stakingPool.stakes[_msgSender()] += amount;
        stakingPool.accountCumulativeRewardPerStake[_msgSender()] +=
            stakingPool.stakes[_msgSender()] *
            (stakingPool.stakingPeriodEnd - block.timestamp);
        stakingPool.totalStaked += amount;

        _mint(_msgSender(), poolId, amount, "");

        payable(centralBTWallet).transfer(msg.value);

        emit Staked(poolId, _msgSender(), amount);
    }

    function claim(uint256 poolId)
        external
        nonReentrant
        onlyExistingPool(poolId)
    {
        onlyWhitelistedAddress(_msgSender());

        require(
            stakingPools[poolId].finalized == true,
            "Staking: staking pool isn't finalized"
        );

        StakingPool storage stakingPool = stakingPools[poolId];

        _burn(_msgSender(), poolId, stakingPool.stakes[_msgSender()]);

        uint256 amountOwnedPerToken = stakingPool.cumulativeRewardPerStake -
            stakingPool.accountCumulativeRewardPerStake[_msgSender()];
        uint256 claimeableAmount = (stakingPool.stakes[_msgSender()] *
            amountOwnedPerToken) / PRECISION;

        payable(_msgSender()).transfer(
            claimeableAmount + stakingPool.stakes[_msgSender()]
        );

        stakingPool.totalStaked -= stakingPool.stakes[_msgSender()];
        stakingPool.stakes[_msgSender()] = 0;
        stakingPool.earned[_msgSender()] = claimeableAmount;

        emit Claimed(poolId, _msgSender(), claimeableAmount);
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure override {
        revert("Transfer is not allowed");
    }

    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure override {
        revert("Batched transfer is not allowed");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Approval is not allowed");
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

    function uri(uint256 tokenId)
        public
        view
        override(ERC1155Upgradeable, ERC1155URIStorageUpgradeable)
        returns (string memory)
    {
        return ERC1155URIStorageUpgradeable.uri(tokenId);
    }

    function getStakedByUserAmount(uint256 poolId, address user)
        external
        view
        returns (uint256)
    {
        return stakingPools[poolId].stakes[user];
    }

    function getEarnedByUserAmount(uint256 poolId, address user)
        external
        view
        returns (uint256)
    {
        return stakingPools[poolId].earned[user];
    }

    function getAccountCumulativeRewardPerStake(uint256 poolId, address user)
        external
        view
        returns (uint256)
    {
        return stakingPools[poolId].accountCumulativeRewardPerStake[user];
    }

    function getAvailableToStakeAmount(uint256 poolId)
        public
        view
        returns (uint256)
    {
        if (
            stakingPools[poolId].aggregator != address(0) &&
            block.timestamp < stakingPools[poolId].stakingPeriodEnd
        ) {
            (, int256 validationNodesTotalStaked, , , ) = IAggregatorV3(
                stakingPools[poolId].aggregator
            ).latestRoundData();

            return
                uint256(validationNodesTotalStaked) -
                stakingPools[poolId].totalStaked;
        }

        return 0;
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) {
        ERC1155SupplyUpgradeable._beforeTokenTransfer(
            operator,
            from,
            to,
            ids,
            amounts,
            data
        );
    }

    uint256[200] private __gap;
}
