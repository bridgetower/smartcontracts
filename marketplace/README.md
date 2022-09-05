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
