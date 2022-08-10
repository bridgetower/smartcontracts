/* eslint-disable no-process-exit */

import { BigNumber } from "ethers";

import * as dotenv from "dotenv";

import hre from "hardhat";

dotenv.config();

async function main() {
  let securitizeRegistry: string = "";

  switch (process.env.ENV) {
    case "DEV":
      securitizeRegistry = process.env.SECURITIZE_REGISTRY_DEV || "";
      break;
    case "STAGING":
      securitizeRegistry = process.env.SECURITIZE_REGISTRY_STAGING || "";
      break;
    case "PROD":
      securitizeRegistry = process.env.SECURITIZE_REGISTRY_PROD || "";
      break;
    default:
      break;
  }

  const securitizeRegistryProxy: string = ""; // CHANGE address
  const contractsRegistry: string = ""; // CHANGE address
  const contractsRegistryProxy: string = ""; // CHANGE address
  const transferProxy: string = ""; // CHANGE address
  const erc20TransferProxy: string = ""; // CHANGE address
  const lazyTransferProxy: string = ""; // CHANGE address
  const royaltiesRegistry: string = ""; // CHANGE address
  const exchangeV2Proxy: string = ""; // CHANGE address
  const erc1155BridgeTowerProxy: string = ""; // CHANGE address

  // Verify SecuritizeRegistryProxy
  try {
    await hre.run("verify:verify", {
      address: securitizeRegistryProxy,
      constructorArguments: [securitizeRegistry],
    });
  } catch (err: any) {
    console.error(err);
  }

  // Verify ContractsRegistry
  try {
    await hre.run("verify:verify", {
      address: contractsRegistry,
      constructorArguments: [securitizeRegistryProxy],
    });
  } catch (err: any) {
    console.error(err);
  }

  // Verify ContractsRegistryProxy
  try {
    await hre.run("verify:verify", {
      address: contractsRegistryProxy,
      constructorArguments: [securitizeRegistryProxy, contractsRegistry],
    });
  } catch (err: any) {
    console.error(err);
  }

  // Verify TransferProxy
  try {
    await hre.run("verify:verify", {
      address: transferProxy,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err);
  }

  // Verify ERC20TransferProxy
  try {
    await hre.run("verify:verify", {
      address: erc20TransferProxy,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err);
  }

  // Verify ERC1155LazyMintTransferProxy
  try {
    await hre.run("verify:verify", {
      address: lazyTransferProxy,
      constructorArguments: [securitizeRegistryProxy, contractsRegistryProxy],
    });
  } catch (err: any) {
    console.error(err);
  }

  // Verify RoyaltiesRegistry
  try {
    await hre.run("verify:verify", {
      address: royaltiesRegistry,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err);
  }

  // Verify ExchangeV2Proxy
  const protocolFee: BigNumber = BigNumber.from(process.env.PROTOCOL_FEE);
  const defaultFeeReceiver: string =
    process.env.DEFAULT_FEE_RECEIVER ||
    (await hre.ethers.getSigners())[0].address;

  try {
    await hre.run("verify:verify", {
      address: exchangeV2Proxy,
      constructorArguments: [
        transferProxy,
        erc20TransferProxy,
        protocolFee,
        defaultFeeReceiver,
        royaltiesRegistry,
        securitizeRegistryProxy,
        contractsRegistryProxy,
      ],
    });
  } catch (err: any) {
    console.error(err);
  }

  // Verify ExchangeV2Implementation
  try {
    await hre.run("verify:verify", {
      address: await hre.upgrades.erc1967.getImplementationAddress(
        exchangeV2Proxy
      ),
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err);
  }

  // Verify ERC1155BridgeTowerProxy
  const name: string = process.env.TOKEN_NAME || "";
  const symbol: string = process.env.TOKEN_SYMBOL || "";
  const baseURI: string = "";
  const contractURI: string = "";
  const lockPeriod: BigNumber = BigNumber.from(0);

  try {
    await hre.run("verify:verify", {
      address: erc1155BridgeTowerProxy,
      constructorArguments: [
        name,
        symbol,
        baseURI,
        contractURI,
        transferProxy,
        lazyTransferProxy,
        securitizeRegistryProxy,
        contractsRegistryProxy,
        lockPeriod,
      ],
    });
  } catch (err: any) {
    console.error(err);
  }

  // Verify ERC1155BridgeTowerImplementation
  try {
    await hre.run("verify:verify", {
      address: await hre.upgrades.erc1967.getImplementationAddress(
        erc1155BridgeTowerProxy
      ),
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);

    process.exit(1);
  });
