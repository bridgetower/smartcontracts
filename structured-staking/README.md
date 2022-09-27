# Structured Staking

A new kind of staking systems related to the Bridge Tower project.

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

At the end you need to verify 2 upgradable proxies that were deployed:
`BeaconProxy` and `StructuredStakingProxy`. To do this open the Snowtrace block
explorer.

- [mainnet](https://snowtrace.io/proxycontractchecker)
- [testnet](https://testnet.snowtrace.io/proxycontractchecker)

Put a contract address into the field and press `Verify` button.

## Launching of a new staking pool

A whitelisted owner of the `StructuredStakingProxy` contract can launch a new
staking pool. To do this, update your `.env` file (`Launch pool parameters`
section). After this execute the next comman in your command line (terminal):

```bash
yarn launch-pool
```

A new staking pool will be launched on the `StructuredStakingProxy` contract in
the mainnet. Also, a new `ValidationNodesProvideProxy` and `AggregatorProxy`
will be deployed and configured.

For the testnet:

```bash
yarn launch-pool:testnet
```

To launch a new staking pool in the sandbox (to test a script), execute the
next commands in your command line (terminal):

```bash
yarn start-sandbox
yarn launch-pool:sandbox
```

NOTE: after launching of a new staking pool you need to verify 2 deployed
contracts (`ValidationNodesProvideProxy` and `AggregatorProxy`) as described at
the end of the previous section (verification of upgradeable proxy).

## Finalization of a staking pool

A whitelisted owner of the `StructuredStakingProxy` contract can finalize a
staking pool after the end of the pool. To do this, update your `.env` file
(`Finalize pool parameters` section). After this execute the next command in
your command line (terminal):

```bash
yarn finalize-pool
```

The pool will be finalized and users will be able to claim staked tokens +
earned rewards.

NOTE: the owner must have on his balance the next amount of tokens before
finalization of the pool: `TS + R + FEE`, where

- TS - total staked amount of tokens in the finalizing pool;
- R - rewards amount as mentioned in `.env` file;
- FEE - fees to pay for the transaction.

For the testnet:

```bash
yarn finalize-pool:testnet
```

To finalize a staking pool in the sandbox (to test a script), execute the next
commands in your command line (terminal):

```bash
yarn start-sandbox
yarn finalize-pool:sandbox
```
