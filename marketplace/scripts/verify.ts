import * as dotenv from "dotenv";

import hre from "hardhat";

dotenv.config();

async function main() {
  let securitizeRegistry: string = "";

  switch ((process.env.ENV || "DEV").trim()) {
    case "DEV":
      securitizeRegistry = (process.env.SECURITIZE_REGISTRY_DEV || "").trim();
      break;
    case "STAGING":
      securitizeRegistry = (
        process.env.SECURITIZE_REGISTRY_STAGING || ""
      ).trim();
      break;
    case "PROD":
      securitizeRegistry = (process.env.SECURITIZE_REGISTRY_PROD || "").trim();
      break;
    default:
      break;
  }

  const securitizeRegistryProxy: string = (
    process.env.V_SECURITIZE_REGISTRY_PROXY || ""
  ).trim();
  const contractsRegistry: string = (
    process.env.V_CONTRACTS_REGISTRY || ""
  ).trim();
  const contractsRegistryProxy: string = (
    process.env.V_CONTRACTS_REGISTRY_PROXY || ""
  ).trim();
  const transferProxy: string = (process.env.V_TRANSFER_PROXY || "").trim();
  const erc20TransferProxy: string = (
    process.env.V_ERC20_TRANSFER_PROXY || ""
  ).trim();
  const lazyTransferProxy: string = (
    process.env.V_LAZY_TRANSFER_PROXY || ""
  ).trim();
  const royaltiesRegistry: string = (
    process.env.V_ROYALTIES_REGISTRY || ""
  ).trim();
  const exchangeV2Proxy: string = (
    process.env.V_EXCHANGE_V2_PROXY || ""
  ).trim();
  const erc1155BridgeTowerImplementation: string = (
    process.env.V_ERC1155_BRIDGE_TOWER_IMPLEMENTATION || ""
  ).trim();
  const erc1155BridgeTowerBeacon: string = (
    process.env.V_ERC1155_BRIDGE_TOWER_BEACON || ""
  ).trim();
  const erc1155BridgeTowerFactoryC2: string = (
    process.env.V_ERC1155_BRIDGE_TOWER_FACTORY_C2 || ""
  ).trim();

  // Verify SecuritizeRegistryProxy
  try {
    await hre.run("verify:verify", {
      address: securitizeRegistryProxy,
      constructorArguments: [securitizeRegistry],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify ContractsRegistry
  try {
    await hre.run("verify:verify", {
      address: contractsRegistry,
      constructorArguments: [securitizeRegistryProxy],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify ContractsRegistryProxy
  try {
    await hre.run("verify:verify", {
      address: contractsRegistryProxy,
      constructorArguments: [securitizeRegistryProxy, contractsRegistry],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify TransferProxy
  try {
    await hre.run("verify:verify", {
      address: transferProxy,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify ERC20TransferProxy
  try {
    await hre.run("verify:verify", {
      address: erc20TransferProxy,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify ERC1155LazyMintTransferProxy
  try {
    await hre.run("verify:verify", {
      address: lazyTransferProxy,
      constructorArguments: [securitizeRegistryProxy, contractsRegistryProxy],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify RoyaltiesRegistry
  try {
    await hre.run("verify:verify", {
      address: royaltiesRegistry,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify ExchangeV2Implementation
  try {
    await hre.run("verify:verify", {
      address: await hre.upgrades.erc1967.getImplementationAddress(
        exchangeV2Proxy
      ),
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify ERC1155BridgeTowerImplementation
  try {
    await hre.run("verify:verify", {
      address: erc1155BridgeTowerImplementation,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify ERC1155BridgeTowerFactoryC2
  try {
    await hre.run("verify:verify", {
      address: erc1155BridgeTowerFactoryC2,
      constructorArguments: [
        erc1155BridgeTowerBeacon,
        transferProxy,
        lazyTransferProxy,
        securitizeRegistryProxy,
        contractsRegistryProxy,
      ],
    });
  } catch (err: any) {
    console.error(err.message);
  }
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
