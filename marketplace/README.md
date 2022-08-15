# BridgeTower NFT Marketplace

A marketplace for NFTs related to the Bridge Tower project.

Before all the steps described below it is required to update your `.env` file
like in `.env.example`.

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

## Migration (deployment)

This section describes how to migrate (deploy) these contracts.

Before migrations update your `.env` file like in `.env.example`.

To migrate contracts in the sandbox (to test migration files), execute the
next commands in your command line (terminal):

```bash
yarn start-sandbox
yarn migrate:sandbox
```

NOTE: each command must be executed in a separate command line (terminal)
window.

Also, you can migrate contracts to the Fuji testnet. To do this execute
the next command in your command line (terminal):

```bash
yarn migrate:testnet
```

To migrate contracts to the mainnet execute the next command in your command
line (terminal):

```bash
yarn migrate
```

NOTE: don't forget to update your `.env` file.

To add more networks support, update your `hardhat.config.ts` and
`package.json` files.

## Verification

To verify contracts deployed to the real network, update you `.env`
(verification section), `hardhat.config.ts`, and `package.json` files. After
this execute the next comman in your command line (terminal):

```bash
yarn verify:testnet
```

For the mainnet:

```bash
yarn verify
```

NOTE: don't forget to update your `.env` file.

At the end you need to verify 2 upgradable proxies that were deployed:
`ExchangeV2Proxy` and `ERC1155BridgeTowerProxy`. To do this open the Snowtrace
block explorer.

- [mainnet](https://snowtrace.io/proxycontractchecker)
- [testnet](https://testnet.snowtrace.io/proxycontractchecker)

Put a contract address into the field and press `Verify` button.

## Minting

To mint new tokens, update you `.env` (minting section) file. After this
execute the next comman in your command line (terminal):

```bash
yarn mint:testnet
```

For the mainnet:

```bash
yarn mint
```

NOTE: by default, all tokens will be minted to transaction signer and he become
an owner of a new tokens. Also, signer (minter) must be a partner. Keep in mind
that all links for tokens' metadata is stored in the array in the
`scripts/data/links.json`file.
