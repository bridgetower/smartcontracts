# Test coverage for contracts

## ContractsRegistry

1. `constructor`:

   - ✅ should fail if the initial securitize registry is not a contract;
   - ✅ should deploy a new contracts registry contract.

2. `addContract`:

   - ✅ should fail if not a whitelisted owner is trying to add a contract to the whitelist;
   - ✅ should fail if not owner is trying to add a contract to the whitelist;
   - ✅ should fail if the owner is trying to add not a contract to the whitelist;
   - ✅ should add a contract to the whitelist by an owner.

3. `isWhitelisted`:

   - ✅ should be whitelisted;
   - ✅ should not be whitelisted.

4. `removeContract`:

   - ✅ should fail if not a whitelisted owner is trying to remove a contract from the whitelist;
   - ✅ should fail if not owner is trying to remove a contract from the whitelist;
   - ✅ should remove a contract from the whitelist by an owner.

5. `setSecuritizeRegistryProxy`:

   - ✅ should fail if not a whitelisted owner is trying to set a new securitize registry proxy;
   - ✅ should fail if not an owner is trying to set a new securitize registry proxy;
   - ✅ should fail if a new securitize registry proxy is not a contract;
   - ✅ should set a new securitize registry proxy by a whitelisted owner.

6. `transferOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
   - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
   - ✅ should transfer ownership.

7. `renounceOwnership`:
   - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
   - ✅ should renounce ownership by a whitelisted owner.

## ContractsRegistryProxy

1. `constructor`:

   - ✅ should fail if the initial securitize registry proxy is not a contract;
   - ✅ should fail if the initial contracts registry is not a contract;
   - ✅ should deploy a new contracts registry proxy contract.

2. `isWhitelistedContract`:

   - ✅ should be whitelisted;
   - ✅ should not be whitelisted.

3. `setContractsRegistry`:

   - ✅ should fail if not a whitelisted owner is trying to set a new contracts registry;
   - ✅ should fail if not an owner is trying to set a new contracts registry;
   - ✅ should fail if a new contracts registry is not a contract;
   - ✅ should set a new contracts registry by a whitelisted owner.

4. `setSecuritizeRegistryProxy`:

   - ✅ should fail if not a whitelisted owner is trying to set a new securitize registry proxy;
   - ✅ should fail if not an owner is trying to set a new securitize registry proxy;
   - ✅ should fail if a new securitize registry proxy is not a contract;
   - ✅ should set a new securitize registry proxy by a whitelisted owner.

5. `transferOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
   - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
   - ✅ should transfer ownership.

6. `renounceOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
   - ✅ should renounce ownership by a whitelisted owner.

## SecuritizeRegistryProxy

1. `constructor`:

   - ✅ should fail if the initial securitize registry is not a contract;
   - ✅ should deploy a new securitize registry proxy contract.

2. `isWhitelistedWallet`:

   - ✅ should be whitelisted;
   - ✅ should not be whitelisted.

3. `setSecuritizeRegistry`:

   - ✅ should fail if not a whitelisted owner is trying to set a new securitize registry;
   - ✅ should fail if not an owner is trying to set a new securitize registry;
   - ✅ should fail if a new securitize registry is not a contract;
   - ✅ should set a new securitize registry by a whitelisted owner.

4. `transferOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
   - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
   - ✅ should transfer ownership.

5. `renounceOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
   - ✅ should renounce ownership by a whitelisted owner.

## ERC1155BridgeTower

1. `setSecuritizeRegistryProxy`:

   - ✅ should fail if not an owner is trying to set a new securitize registry proxy;
   - ✅ should fail if an owner is not whitelisted and is trying to set a new securitize registry proxy;
   - ✅ should fail if a new securitize registry proxy is not a contract;
   - ✅ should set a new securitize registry proxy by a whitelisted owner.

2. `setContractsRegistryProxy`:

   - ✅ should fail if not an owner is trying to set a new contracts registry proxy;
   - ✅ should fail if an owner is not whitelisted and is trying to set a new contracts registry proxy;
   - ✅ should fail if a new contracts registry proxy is not a contract;
   - ✅ should set a new contracts registry proxy by a whitelisted owner.

3. `__ERC1155BridgeTower_init`:

   - ✅ should fail if a contract is already initialized.

4. `__ERC1155BridgeTowerUser_init`:

   - ✅ should fail if a contract is already initialized.

5. `mintAndTransfer`:

   - ✅ should fail if not a whitelisted wallet is trying to mint and transfer tokens;
   - ✅ should fail if a whitelisted wallet is trying to mint and transfer tokens to not whitelisted wallet;
   - ✅ should mint and transfer tokens by a whitelisted owner.

6. `transferFromOrMint`:

   - ✅ should fail if not a whitelisted wallet is trying to transfer or mint tokens;
   - ✅ should fail if FROM is not a whitelisted wallet;
   - ✅ should fail if TO is not a whitelisted wallet;
   - ✅ should transfer or mint tokens by a whitelisted owner.

7. `safeTransferFrom`:

   - ✅ should fail if not a whitelisted wallet is trying to transfer tokens;
   - ✅ should fail if FROM is not a whitelisted wallet;
   - ✅ should fail if TO is not a whitelisted wallet;
   - ✅ should transfer tokens;
   - ✅ should fail if user is trying to transfer more than unlocked tokens amount;
   - ✅ should lock proper amount of tokens;
   - ✅ should unlock proper amount of tokens.

8. `safeBatchTransferFrom`:

   - ✅ should fail if not a whitelisted wallet is trying to transfer tokens in batch;
   - ✅ should fail if FROM is not a whitelisted wallet;
   - ✅ should fail if TO is not a whitelisted wallet;
   - ✅ should transfer tokens in batch;
   - ✅ should fail if user is trying to transfer more than unlocked tokens amount;
   - ✅ should fail if user is trying to transfer more than unlocked tokens amount in one of transferred tokens in a batch;
   - ✅ should unlock proper amount of tokens;
   - ✅ should unlock proper amount of tokens in one of transferred tokens in a batch.

9. `unlock`:

   - ✅ should fail if not a whitelisted wallet is trying to unlock tokens;
   - ✅ should fail if whitelisted user is trying to unlock tokens for not a whitelisted user;
   - ✅ should not unlock tokens if nothing to unlock;
   - ✅ should unlock proper amount of tokens.

10. `getLockedAmount`:

    - ✅ should return proper locked amount - 1;
    - ✅ should return proper locked amount - 2;
    - ✅ should return proper locked amount - 3.

11. `getUnlockableAmount`:

    - ✅ should return proper unlockable amount - 1;
    - ✅ should return proper unlockable amount - 2;
    - ✅ should return proper unlockable amount - 3.

12. `getLocksInfo`:

    - ✅ should return proper locks info.

13. `updateAccount`:

    - ✅ should fail if not a whitelisted wallet is trying to update the account;
    - ✅ should update the account by a whitelisted user.

14. `setBaseURI`:

    - ✅ should fail if not a whitelisted owner is trying to set a new base URI;
    - ✅ should set a new base URI by a whitelisted owner.

15. `setApprovalForAll`:

    - ✅ should fail if not a whitelisted user is trying to set approval for all;
    - ✅ should set approval for all by a whitelisted user.

16. `addMinter`:

    - ✅ should fail if not a whitelisted owner is trying to add a new minter;
    - ✅ should add a new minter by a whitelisted owner.

17. `removeMinter`:

    - ✅ should fail if not a whitelisted owner is trying to remove a minter;
    - ✅ should remove a minter by a whitelisted owner.

18. `transferOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
    - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
    - ✅ should transfer ownership.

19. `renounceOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
    - ✅ should renounce ownership by a whitelisted owner.

## ERC1155BridgeTowerBeacon

1. `constructor`:

   - ✅ should deploy a new beacon properly.

2. `upgradeTo`:

   - ✅ should fail if not a whitelisted owner is trying to upgrade an implementation address;
   - ✅ should fail if not an owner is trying to upgrade an implementation address;
   - ✅ should upgrade to a new implementation properly.

3. `renounceOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
   - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
   - ✅ should transfer ownership.

4. `transferOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
   - ✅ should renounce ownership by a whitelisted owner.

## ERC1155BridgeTowerFactoryC2

1. `addPartner`:

   - ✅ should fail if not a whitelisted wallet is trying to add a new partner;
   - ✅ should fail if not an owner is trying to add a new partner;
   - ✅ should add a new partner by a whitelisted owner.

2. `isPartner`:

   - ✅ should return true;
   - ✅ should return false.

3. `removePartner`:

   - ✅ should fail if not a whitelisted wallet is trying to remove a partner;
   - ✅ should fail if not an owner is trying to remove a partner;
   - ✅ should remove a partner by a whitelisted owner.

4. `constructor`:

   - ✅ should deploy a new factory properly.

5. `addPartner`:

   - ✅ should fail if not a whitelisted owner is trying to add a new partner;
   - ✅ should add a new partner by a whitelisted owner.

6. `removePartner`:

   - ✅ should fail if not a whitelisted owner is trying to remove a partner;
   - ✅ should remove a partner by a whitelisted owner.

7. `createToken`:

   - ✅ should fail if not a partner is trying to create a new token;
   - ✅ should fail if not a whitelisted partner is trying to create a new token;
   - ✅ should create a new token by a whitelisted partner.

8. `createToken`:

   - ✅ should fail if not a partner is trying to create a new token;
   - ✅ should fail if not a whitelisted partner is trying to create a new token;
   - ✅ should create a new token by a whitelisted partner.

9. `renounceOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
   - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
   - ✅ should transfer ownership.

10. `transferOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
    - ✅ should renounce ownership by a whitelisted owner.

## TransferProxy

1. `__OperatorRole_init`:

   - ✅ should fail if a contract is already initialized.

2. `__TransferProxy_init`:

   - ✅ should fail if a contract is already initialized.

3. `addOperator`:

   - ✅ should fail if not whitelisted wallet is trying to add an operator;
   - ✅ should add an operator.

4. `removeOperator`:

   - ✅ should fail if not whitelisted wallet is trying to remove an operator;
   - ✅ should remove an operator.

5. `erc721safeTransferFrom`:

   - ✅ should fail if not whitelisted wallet is trying to transfer;
   - ✅ should fail if FROM is not a whitelisted wallet;
   - ✅ should fail if TO is not a whitelisted wallet;
   - ✅ should transfer token by a whitelisted operator.

6. `erc1155safeTransferFrom`:

   - ✅ should fail if not whitelisted wallet is trying to transfer;
   - ✅ should fail if FROM is not a whitelisted wallet;
   - ✅ should fail if TO is not a whitelisted wallet;
   - ✅ should transfer token by a whitelisted operator.

7. `renounceOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
   - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
   - ✅ should transfer ownership.

8. `transferOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
   - ✅ should renounce ownership by a whitelisted owner.

## ERC20TransferProxy

1. `__ERC20TransferProxy_init`:

   - ✅ should fail if a contract is already initialized.

2. `__OperatorRole_init`:

   - ✅ should fail if a contract is already initialized.

3. `addOperator`:

   - ✅ should fail if not whitelisted wallet is trying to add an operator;
   - ✅ should add an operator.

4. `removeOperator`:

   - ✅ should fail if not whitelisted wallet is trying to remove an operator;
   - ✅ should remove an operator.

5. `erc20safeTransferFrom`:

   - ✅ should fail if not whitelisted wallet is trying to transfer;
   - ✅ should fail if FROM is not a whitelisted wallet;
   - ✅ should fail if TO is not a whitelisted wallet;
   - ✅ should transfer token by a whitelisted operator.

6. `renounceOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
   - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
   - ✅ should transfer ownership.

7. `transferOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
   - ✅ should renounce ownership by a whitelisted owner.

## ERC1155LazyMintTransferProxy

1. `__OperatorRole_init`:

   - ✅ should fail if a contract is already initialized.

2. `addOperator`:

   - ✅ should fail if not whitelisted wallet is trying to add an operator;
   - ✅ should add an operator.

3. `removeOperator`:

   - ✅ should fail if not whitelisted wallet is trying to remove an operator;
   - ✅ should remove an operator.

4. `transfer`:

   - ✅ should fail if not whitelisted wallet is trying to transfer;
   - ✅ should fail if FROM is not a whitelisted wallet;
   - ✅ should fail if TO is not a whitelisted wallet;
   - ✅ should transfer token by a whitelisted operator.

5. `renounceOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
   - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
   - ✅ should transfer ownership.

6. `transferOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
   - ✅ should renounce ownership by a whitelisted owner.

## RoyaltiesRegistry

1. `__RoyaltiesRegistry_init`:

   - ✅ should fail if a contract is already initialized.

2. `clearRoyaltiesType`:

   - ✅ should fail if not whitelisted wallet is trying to clear royalties type;
   - ✅ should fail if not owner is trying to clear royalties type;
   - ✅ should clear royalties type by a whitelisted owner.

3. `forceSetRoyaltiesType`:

   - ✅ should fail if not whitelisted wallet is trying to force set royalties type;
   - ✅ should fail if not owner is trying to force set royalties type;
   - ✅ should force set royalties type by a whitelisted owner;

4. `getRoyalties`:

   - ✅ should fail if not whitelisted wallet is trying to get royalties;
   - ✅ should get royalties by a whitelisted wallet.

5. `setProviderByToken`:

   - ✅ should fail if not whitelisted wallet is trying to set provider by token;
   - ✅ should fail if not owner is trying to set provider by token;
   - ✅ should set provider by token by a whitelisted owner.

6. `setRoyaltiesByToken`:

   - ✅ should fail if not whitelisted wallet is trying to set royalties by token;
   - ✅ should fail if not owner is trying to set royalties by token;
   - ✅ should set royalties by token by a whitelisted owner.

7. `renounceOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
   - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
   - ✅ should transfer ownership.

8. `transferOwnership`:

   - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
   - ✅ should renounce ownership by a whitelisted owner.

## ExchangeV2

1. `__ExchangeV2_init`:

   - ✅ should fail if a contract is already initialized.

2. `whitelistPaymentToken`:

   - ✅ should fail if not whitelisted wallet is trying to whitelist a payment token;
   - ✅ should fail if not owner is trying to whitelist a payment token;
   - ✅ should fail if the whitelisted owner is trying to whitelist not contract address;
   - ✅ should whitelist payment token by a whitelisted owner;
   - ✅ should un whitelist payment token by a whitelisted owner.

3. `whitelistNativePaymentToken`:

   - ✅ should fail if not whitelisted wallet is trying to whitelist a native payment token;
   - ✅ should fail if not owner is trying to whitelist a native payment token;
   - ✅ should whitelist native payment token by a whitelisted owner;
   - ✅ should un whitelist native payment token by a whitelisted owner.

4. `isWhitelistedPaymentToken`:

   - ✅ should be whitelisted;
   - ✅ should not be whitelisted.

5. `cancel`:

   - ✅ should fail if not whitelisted wallet is trying to cancel an order;
   - ✅ should cancel an order by a whitelisted wallet.

6. `matchOrders`:

   - ✅ should fail if not whitelisted wallet is trying to match orders;
   - ✅ should fail if a maker of a left order is not a whitelisted wallet;
   - ✅ should fail if a maker of a right order is not a whitelisted wallet;
   - ✅ should fail if a taker of a left order is not a whitelisted wallet;
   - ✅ should fail if a taker of a right order is not a whitelisted wallet;
   - ✅ should fail if one of the payment assets from the left order isn't supported;
   - ✅ should fail if one of the payment assets from the right order isn't supported;
   - ✅ should match orders (ERC1155 <=> ERC20).

7. `setAssetMatcher`:

   - ✅ should fail if not whitelisted wallet is trying to set asset matcher;
   - ✅ should fail if not owner is trying to set asset matcher;
   - ✅ should set asset matcher by a whitelisted owner.

8. `setDefaultFeeReceiver`:

   - ✅ should fail if not whitelisted wallet is trying to set default fee receiver;
   - ✅ should fail if not owner is trying to set a default fee receiver;
   - ✅ should set default fee receiver by a whitelisted owner.

9. `setFeeReceiver`:

   - ✅ should fail if not whitelisted wallet is trying to set fee receiver;
   - ✅ should fail if not owner is trying to set a fee receiver;
   - ✅ should set fee receiver by a whitelisted owner.

10. `setProtocolFee`:

    - ✅ should fail if not whitelisted wallet is trying to set protocol fee;
    - ✅ should fail if not owner is trying to set a protocol fee;
    - ✅ should set protocol fee by a whitelisted owner.

11. `setRoyaltiesRegistry`:

    - ✅ should fail if not whitelisted wallet is trying to set royalties registry;
    - ✅ should fail if not owner is trying to set a royalties registry;
    - ✅ should set royalties registry by a whitelisted owner.

12. `setTransferProxy`:

    - ✅ should fail if not whitelisted wallet is trying to set transfer proxy;
    - ✅ should fail if not owner is trying to set transfer proxy;
    - ✅ should set transfer proxy by a whitelisted owner.

13. `renounceOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to transfer ownership;
    - ✅ should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user;
    - ✅ should transfer ownership.

14. `transferOwnership`:

    - ✅ should fail if not a whitelisted owner is trying to renounce ownership;
    - ✅ should renounce ownership by a whitelisted owner.
