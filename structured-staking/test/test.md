# Test coverage for contracts

## AggregatorUpgradeable

1. `__Aggregator_init`:

   - ✅ should fail if a contract is already initialized.

2. `__Aggregator_init_unchained`:

   - ✅ should fail if a contract is already initialized.

3. `setTotalStakedAmount`:

   - ✅ should fail if not an owner is trying to set a total staked amount;
   - ✅ should fail if not a whitelisted owner is trying to set a total staked amount;
   - ✅ should set a new total staked amount by a whitelisted owner.

4. `latestRoundData`:

   - ✅ should return proper latest round data.

5. `securitizeRegistryProxy`:

   - ✅ should return proper securitize registry proxy.

6. `contractsRegistryProxy`:

   - ✅ should return proper contracts registry proxy.

7. `setSecuritizeRegistryProxy`:

   - ✅ should fail if not an owner is trying to set a new securitize registry proxy;
   - ✅ should fail if not a whitelisted owner is trying to set a new securitize registry proxy;
   - ✅ should fail if a new securitize registry proxy is not a contract;
   - ✅ should set a new securitize registry proxy by a whitelisted owner.

8. `setContractsRegistryProxy`:

   - ✅ should fail if not an owner is trying to set a new contracts registry proxy;
   - ✅ should fail if not a whitelisted owner is trying to set a new contracts registry proxy;
   - ✅ should fail if a new contracts registry proxy is not a contract;
   - ✅ should set a new contracts registry proxy by a whitelisted owner.

9. `onlyWhitelistedAddress`:

   - ✅ should not revert - 1;
   - ✅ should not revert - 2;
   - ✅ should revert - 1;
   - ✅ should revert - 2.

10. `transferOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
    - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
    - ✅ should transfer ownership.

11. `renounceOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
    - ✅ should renounce ownership by a whitelisted owner.

## BeaconUpgradeable

1. `__Beacon_init`:

   - ✅ should fail if a contract is already initialized.

2. `__Beacon_init_unchained`:

   - ✅ should fail if a contract is already initialized.

3. `upgradeTo`:

   - ✅ should fail if not an owner is trying to upgrade implementation;
   - ✅ should fail if not a whitelisted owner is trying to upgrade implementation;
   - ✅ should fail if a new implementation is not a contract;
   - ✅ should upgrade to a new implementation by a whitelisted owner.

4. `implementation`:

   - ✅ should return proper implementation.

5. `securitizeRegistryProxy`:

   - ✅ should return proper securitize registry proxy.

6. `contractsRegistryProxy`:

   - ✅ should return proper contracts registry proxy.

7. `setSecuritizeRegistryProxy`:

   - ✅ should fail if not an owner is trying to set a new securitize registry proxy;
   - ✅ should fail if not a whitelisted owner is trying to set a new securitize registry proxy;
   - ✅ should fail if a new securitize registry proxy is not a contract;
   - ✅ should set a new securitize registry proxy by a whitelisted owner.

8. `setContractsRegistryProxy`:

   - ✅ should fail if not an owner is trying to set a new contracts registry proxy;
   - ✅ should fail if not a whitelisted owner is trying to set a new contracts registry proxy;
   - ✅ should fail if a new contracts registry proxy is not a contract;
   - ✅ should set a new contracts registry proxy by a whitelisted owner.

9. `onlyWhitelistedAddress`:

   - ✅ should not revert - 1;
   - ✅ should not revert - 2;
   - ✅ should revert - 1;
   - ✅ should revert - 2.

10. `transferOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
    - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
    - ✅ should transfer ownership.

11. `renounceOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
    - ✅ should renounce ownership by a whitelisted owner.

## ValidationNodesProviderUpgradeable

1. `__ValidationNodesProvider_init`:

   - ✅ should fail if a contract is already initialized.

2. `__ValidationNodesProvider_init_unchained`:

   - ✅ should fail if a contract is already initialized.

3. `setValidationNodes`:

   - ✅ should fail if not an owner is trying to set a list of validation nodes;
   - ✅ should fail if not a whitelisted owner is trying to set a list of validation nodes;
   - ✅ should set a new list of validation nodes by a whitelisted owner.

4. `getPoRAddressListLength`:

   - ✅ should return proper PoR address list length.

5. `getPoRAddressList`:

   - ✅ should return proper PoR address list - 1;
   - ✅ should return proper PoR address list - 2;
   - ✅ should return proper PoR address list - 3;
   - ✅ should return proper PoR address list - 4;
   - ✅ should return proper PoR address list - 5;
   - ✅ should return proper PoR address list - 6.

6. `securitizeRegistryProxy`:

   - ✅ should return proper securitize registry proxy.

7. `contractsRegistryProxy`:

   - ✅ should return proper contracts registry proxy.

8. `setSecuritizeRegistryProxy`:

   - ✅ should fail if not an owner is trying to set a new securitize registry proxy;
   - ✅ should fail if not a whitelisted owner is trying to set a new securitize registry proxy;
   - ✅ should fail if a new securitize registry proxy is not a contract;
   - ✅ should set a new securitize registry proxy by a whitelisted owner.

9. `setContractsRegistryProxy`:

   - ✅ should fail if not an owner is trying to set a new contracts registry proxy;
   - ✅ should fail if not a whitelisted owner is trying to set a new contracts registry proxy;
   - ✅ should fail if a new contracts registry proxy is not a contract;
   - ✅ should set a new contracts registry proxy by a whitelisted owner.

10. `onlyWhitelistedAddress`:

    - ✅ should not revert - 1;
    - ✅ should not revert - 2;
    - ✅ should revert - 1;
    - ✅ should revert - 2.

11. `transferOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
    - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
    - ✅ should transfer ownership.

12. `renounceOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
    - ✅ should renounce ownership by a whitelisted owner.

## StructuredStaking

1. `__StructuredStaking_init`:

   - ✅ should fail if a contract is already initialized.

2. `__StructuredStaking_init_unchained`:

   - ✅ should fail if a contract is already initialized.

3. `updateCentralBTWallet`:

   - ✅ should fail if not an owner is trying to update a central BT wallet;
   - ✅ should fail if not a whitelisted owner is trying to update a central BT wallet;
   - ✅ should update a central BT wallet by a whitelisted owner.

4. `centralBTWallet`:

   - ✅ should return proper central BT wallet.

5. `beacon`:

   - ✅ should return proper beacon.

6. `PRECISION`:

   - ✅ should return proper precision.

7. `launchStakingPool`:

   - ✅ should fail if not an owner is trying to launch a new staking pool;
   - ✅ should fail if not a whitelisted owner is trying to launch a new staking pool;
   - ✅ should fail if a staking period end timestamp is less than or equal to the current block timestamp;
   - ✅ should launch a new staking pool by a whitelisted owner.

8. `setAggregator`:

   - ✅ should fail if not an owner is trying to set an aggregator;
   - ✅ should fail if an owner is trying to set an aggregator for non-existent staking pool;
   - ✅ should fail if an owner is trying to set an aggregator that is not a contract;
   - ✅ should fail if not a whitelisted owner is trying to set an aggregator;
   - ✅ should set an aggregator by a whitelisted owner.

9. `getAddress`:

   - ✅ should return proper address for the future validation nodes provider.

10. `stakingPoolsCount`:

    - ✅ should return proper staking pools count.

11. `stakingPools`:

    - ✅ should return proper staking pool info - 1;
    - ✅ should return proper staking pool info - 2.

12. `uri`:

    - ✅ should return proper URI - 1;
    - ✅ should return proper URI - 2.

13. `stake`:

    - ✅ should fail if a user is trying to stake to non-existent staking pool;
    - ✅ should fail if not a whitelisted user is trying to stake into a staking pool;
    - ✅ should fail if a user is trying to stake to a finished staking pool;
    - ✅ should fail if a user is trying to stake a zero amount;
    - ✅ should fail if a user is trying to stake more than available to stake;
    - ✅ should fail if a user is trying to provide a wrong amount of tokens to stake;
    - ✅ should stake by a whitelisted user - 1;
    - ✅ should stake by a whitelisted user - 2;
    - ✅ should stake by a whitelisted user - 3;
    - ✅ should mint NFTs to a user in time of stake in 1 to 1 proportion;
    - ✅ should transfer staked tokens to a central BT wallet in time of stake.

14. `finalizeStakingPool` :

    - ✅ should fail if not an owner is trying to finalize a staking pool;
    - ✅ should fail if an owner is trying to finalize non-existent staking pool;
    - ✅ should fail if not a whitelisted owner is trying to finalize a staking pool;
    - ✅ should fail if an owner is trying to provide a wrong amount of tokens in time of finalizing of a staking pool;
    - ✅ should fail if an owner is trying to finalize a staking pool when it isn't finished yet;
    - ✅ should finalize a staking pool by a whitelisted owner;
    - ✅ should fail if an owner is trying to finalize already finalized staking pool;
    - ✅ should transfer rewards back to a tx sender if no one staked into a staking pool;
    - ✅ should set rewards amount in time of finalizing of a staking pool.

15. `getStakedByUserAmount`:

    - ✅ should return proper amount of staked by user tokens.

16. `getAvailableToStakeAmount`:

    - ✅ should return proper amount of available to stake tokens.

17. `claim`:

    - ✅ should fail if a user is trying to claim from non-existent staking pool;
    - ✅ should fail if not a whitelisted user is trying to claim from a staking pool;
    - ✅ should fail if a user is trying to claim from not finilized staking pool;
    - ✅ should claim rewards from a finalized staking pool by a whitelisted user;
    - ✅ should burn user's NFTs in time of claiming;
    - ✅ should transfer back rewards and staked by user amount to a user in time of claiming.

18. `safeTransferFrom`:

    - ✅ should revert.

19. `safeBatchTransferFrom`:

    - ✅ should revert.

20. `setApprovalForAll`:

    - ✅ should revert.

21. `getEarnedByUserAmount`:

    - ✅ should return proper amount of earned by user tokens.

22. `getUserSharesAmount`:

    - ✅ should return proper user's shares amount.

23. `isClaimedByUser`:

    - ✅ should return proper is claimed value.

24. `securitizeRegistryProxy`:

    - ✅ should return proper securitize registry proxy.

25. `contractsRegistryProxy`:

    - ✅ should return proper contracts registry proxy.

26. `setSecuritizeRegistryProxy`:

    - ✅ should fail if not an owner is trying to set a new securitize registry proxy;
    - ✅ should fail if not a whitelisted owner is trying to set a new securitize registry proxy;
    - ✅ should fail if a new securitize registry proxy is not a contract;
    - ✅ should set a new securitize registry proxy by a whitelisted owner.

27. `setContractsRegistryProxy`:

    - ✅ should fail if not an owner is trying to set a new contracts registry proxy;
    - ✅ should fail if not a whitelisted owner is trying to set a new contracts registry proxy;
    - ✅ should fail if a new contracts registry proxy is not a contract;
    - ✅ should set a new contracts registry proxy by a whitelisted owner.

28. `onlyWhitelistedAddress`:

    - ✅ should not revert - 1;
    - ✅ should not revert - 2;
    - ✅ should revert - 1;
    - ✅ should revert - 2.

29. `transferOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
    - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
    - ✅ should transfer ownership.

30. `renounceOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
    - ✅ should renounce ownership by a whitelisted owner.
