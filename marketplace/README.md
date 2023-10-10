# BridgeTower NFT Marketplace

A marketplace for NFTs related to the Bridge Tower project.

Before all the steps described below it is required to update your `.env` file
like in `.env.example`. Choose one section (block) with needed for your current
goal variables and update them.

## Dependencies installation

Development dependencies are used for contracts compilation, deployment,
verification and testing.

To install development dependencies execute the next command in your command
line (terminal):

```bash
yarn
```

## Testing

All contracts are covered with unit tests.

To run tests execute the next commands in your command line (terminal):

```bash
yarn start-sandbox
yarn test
```

NOTE: each command must be executed in a separate command line (terminal)
window.

## Compilation

To execute a compilation, you need to run the next command in your command line
(terminal):

```bash
yarn compile
```

An ABI and bytecode will be generated as the result of command execution. See
`artifacts/contracts/` directory.

## Deployment

This section describes how to deploy these contracts.

Before deployment update your `.env` file like in `.env.example`
(`Deployment parameters` section).

To deploy contracts to the sandbox (to test deployment file), execute the
next commands in your command line (terminal):

```bash
yarn start-sandbox
yarn deploy:sandbox
```

NOTE: each command must be executed in a separate command line (terminal)
window.

Also, you can deploy contracts to the Fuji testnet. To do this execute
the next command in your command line (terminal):

```bash
yarn deploy:testnet
```

To deploy contracts to the mainnet execute the next command in your command
line (terminal):

```bash
yarn deploy
```

NOTE: don't forget to update your `.env` file.

To add more networks support, update your `hardhat.config.ts` and
`package.json` files.

## Verification

To verify contracts deployed to the real network, update you `.env`
(`Verification parameters` section), `hardhat.config.ts`, and `package.json`
files. After this execute the next comman in your command line (terminal):

```bash
yarn verify:testnet
```

For the mainnet:

```bash
yarn verify
```

NOTE: don't forget to update your `.env` file.

At the end you need to verify 1 upgradable proxy that was deployed:
`ExchangeV2Proxy`. To do this open the Snowtrace block explorer.

- [mainnet](https://snowtrace.io/proxycontractchecker)
- [testnet](https://testnet.snowtrace.io/proxycontractchecker)

Put a contract address into the field and press `Verify` button.

## Collections creation

Every partner, registered in the `ERC1155BridgeTowerFactoryC2` contract by an
owner, can create a new collection and mint a new tokens or assign a new
minters inside of created collection.

To create a new collection update your `.env` file
(`Collection creation parameters` section). Then execute the next command in
your command line (terminal):

```bash
yarn create-collection
```

A new collection will be deployed to the mainnet.

For the testnet:

```bash
yarn create-collection:testnet
```

To create a new collection in the sandbox (to test deployment file), execute
the next commands in your command line (terminal):

```bash
yarn start-sandbox
yarn create-collection:sandbox
```

NOTE: after deployment of a new collection you need to verify deployed contract
as described at the end of the previous section (verification of upgradeable
proxy).

## Minting

To mint new tokens inside of a collection, update you `.env` file
(`Minting parameters` section). After this execute the next comman in your
command line (terminal):

```bash
yarn mint:testnet
```

For the mainnet:

```bash
yarn mint
```

NOTE: by default, all tokens will be minted to transaction signer and he become
an owner of a new tokens. Also, signer must be an owner or a minter appointed
by an owner.

Keep in mind that all links to tokens' metadata and supply amounts are stored
in the array in the `scripts/data/mintData.json` file. To reduce an amount of
unique NFTs to be minted just remove some objects from an array. Now it
contains 80 objects with a supply of 1000 duplicates for each unique NFT.

NOTE: don't forget to update links to IPFS too.

## Whitelist contract deployment

### Summary

The script is intended to do the following actions:
- Deploy separate whitelist contract
- Whitelist owner and additional list of addresses on the aforementioned contract
- Grant permissions to whitelist other addresses to another address
- Change the target of the **existing** `SecuritizeRegistryProxy` to the newly deployed whitelist contract 

### Mandatory environment variables

`PRIVATE_KEY` - private key that has rights to change securitize registry proxy target address
(also new whitelist contract will be deploy on behalf of this contract)  
`WD_ADDITIONAL_OWNER_ADDRESS` - the address that will be allowed to whitelist other addresses
(in the current state - CYBAVO withdrawal wallet)  
`WD_REGISTRY_PROXY_ADDRESS` - Securitize registry proxy address that is already deployed  
`WD_INITIAL_WHITELIST` - list of addresses in JSON format (see the example below) that will be 
initially whitelisted, important thing to mention - in order to keep the system running correctly, 
platform fee receiver MUST be added to the list  
```json
["0x3E89865828fbf69Fc0dd1859910e3AC4E919583E","0xf24b9894Ed7077BE28610b57aC3509e105561aa0"]
```

### Execution

After filling all the envs you will be able to run the one of the following commands:  
- For the testnet
```bash
yarn deploy-whitelist:testnet
```
- For the mainnet
```bash
yarn deploy-whitelist
```

While the script is running, you will see the logs similar to the following:
```
⌛ Starting tedious process... ( -_•) 🔫
⌛ Deploying whitelist contract
✅ Deployed whitelist contract: 0xE439850a86590e84095465FB28b2Cd72Ea9796C6 with hash 0x5e031fb27f9e7e0d6d678cfd8a00386cdc2a236d4979a60d064f7fd7bbe11a2d
✅🛎️🛎️🛎️🛎️ WHITELIST CONTRACT ADDRESS: 0xE439850a86590e84095465FB28b2Cd72Ea9796C6 🛎️🛎️🛎️🛎✅️
⌛ Verifying whitelist contract
The contract 0xE439850a86590e84095465FB28b2Cd72Ea9796C6 has already been verified
✅ Verified whitelist contract: 0xE439850a86590e84095465FB28b2Cd72Ea9796C6
⌛ Adding owner 0x3E89865828fbf69Fc0dd1859910e3AC4E919583E to the whitelist contract
✅ Added owner 0x3E89865828fbf69Fc0dd1859910e3AC4E919583E to the whitelist contract 0xE439850a86590e84095465FB28b2Cd72Ea9796C6 with hash 0x576455b7888c3b8b70a7f2adc7179c55e3a0f7ae5be06656e691a872d0bf66fd
⌛ Adding signer address 0x423cbE3E6479E86dfb816915c5BF57060e48C5A7 to the whitelist
✅ Added owner 0x423cbE3E6479E86dfb816915c5BF57060e48C5A7 to the whitelist on contract 0xE439850a86590e84095465FB28b2Cd72Ea9796C6 with hash 0x95664d1266796b358efcbe33dc8f7b4cac2d02ebbf79e5242ab35f9f399ba32f
⌛ Attaching to the SecuritizeRegistryProxy at 0xf24b9894Ed7077BE28610b57aC3509e105561aa0
⌛ Setting SecuritizeRegistryProxy (0xf24b9894Ed7077BE28610b57aC3509e105561aa0) target to 0xE439850a86590e84095465FB28b2Cd72Ea9796C6
✅ Set securitize registry proxy target to 0xE439850a86590e84095465FB28b2Cd72Ea9796C6 with hash 0x62928e496b0512be62b6ee52903c74242107d0965057120037efc179cb06622a
⌛ Filling in initial whitelist
⌛ Adding wallet 0x3E89865828fbf69Fc0dd1859910e3AC4E919583E to the whitelist
✅ Added wallet 0x3E89865828fbf69Fc0dd1859910e3AC4E919583E to whitelist contract on 0xE439850a86590e84095465FB28b2Cd72Ea9796C6 with hash 0x0a4492c3e60ba31a152ffe8b2112956c8b41c49aac9890cc974baa28236cd189
✅ ʕ•͡-•ʔ ʕ•͡-•ʔ ʕ•͡-•ʔ Done! ʕ•͡-•ʔ ʕ•͡-•ʔ ʕ•͡-•ʔ
```

### Cybavo actions

To make the system able to interact with the new contract following actions should be done:
- Add the whitelist contract to the Cybavo contract list (under "Smart contracts" -> "All contracts")
  - Contract name (example): `Own_Whitelist_Contract`
  - Chain: `AVAX-C`
  - [ABI](https://api-testnet.snowtrace.io/api?module=contract&action=getabi&address=0x12A7F20aC2429399E0D140B45d855a315554Af9c&format=raw)
- Change **Avalanche withdrawal wallet** (under "Wallet settings" -> "Wallet policy" -> "Contract interaction")
  - Add the aforementioned contract (for ex. `Own_Whitelist_Contract`) to the policy
  - Add `addWallet(address,uint256)` method to the policy of the contract
