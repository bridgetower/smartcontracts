/* eslint-disable no-process-exit */

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
  const validationNodesProviderImplementation: string = (
    process.env.V_VALIDATION_NODES_PROVIDER_IMPLEMENTATION || ""
  ).trim();
  const beaconProxy: string = (process.env.V_BEACON_PROXY || "").trim();
  const beaconImplementation: string = (
    process.env.V_BEACON_IMPLEMENTATION || ""
  ).trim();
  const structuredStakingProxy: string = (
    process.env.V_STRUCTURED_STAKING_PROXY || ""
  ).trim();
  const structuredStakingImplementation: string = (
    process.env.V_STRUCTURED_STAKING_IMPLEMENTATION || ""
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

  // Verify ValidationNodesProviderImplementation
  try {
    await hre.run("verify:verify", {
      address: validationNodesProviderImplementation,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify BeaconProxy
  try {
    await hre.run("verify:verify", {
      address: beaconProxy,
      constructorArguments: [
        securitizeRegistryProxy,
        contractsRegistryProxy,
        validationNodesProviderImplementation,
      ],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify BeaconImplementation
  try {
    await hre.run("verify:verify", {
      address: beaconImplementation,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify StructuredStakingProxy
  try {
    await hre.run("verify:verify", {
      address: structuredStakingProxy,
      constructorArguments: [
        securitizeRegistryProxy,
        contractsRegistryProxy,
        beaconProxy,
        (process.env.V_CENTRAL_BT_WALLLET || "").trim(),
      ],
    });
  } catch (err: any) {
    console.error(err.message);
  }

  console.log("\n*********************************************************\n");

  // Verify StructuredStakingImplementation
  try {
    await hre.run("verify:verify", {
      address: structuredStakingImplementation,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err.message);
  }
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
