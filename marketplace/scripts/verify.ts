import * as dotenv from "dotenv";

import hre from "hardhat";

dotenv.config();

async function main() {
  const securitizeRegistry: string = (
    process.env.V_SECURITIZE_REGISTRY || ""
  ).trim();
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

  console.log(`Verifying SecuritizeRegistry (aka Whitelist): ${securitizeRegistry}`);
  // Verify SecuritizeRegistry (aka whitelist)
  try {
    await hre.run("verify:verify", {
      address: securitizeRegistry,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  console.log(`Verifying SecuritizeRegistryProxy: ${securitizeRegistryProxy}`);
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

  console.log(`Verifying ContractsRegistry: ${contractsRegistry}`);
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

  console.log(`Verifying ContractsRegistryProxy: ${contractsRegistryProxy}`);
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

  console.log(`Verifying TransferProxy: ${transferProxy}`);
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

  console.log(`Verifying ERC20TransferProxy: ${erc20TransferProxy}`);
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

  console.log(`Verifying ERC1155LazyMintTransferProxy: ${lazyTransferProxy}`);
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

  console.log(`Verifying RoyaltiesRegistry: ${royaltiesRegistry}`);
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

  console.log(`Verifying impl of ExchangeV2Proxy: ${exchangeV2Proxy}`);
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

  console.log(`Verifying ERC1155BridgeTowerImplementation: ${erc1155BridgeTowerImplementation}`);
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

  console.log(`Verifying ERC1155BridgeTowerFactoryC2: ${erc1155BridgeTowerFactoryC2}`);
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
