import { Contract, ContractFactory, ContractTransaction } from "ethers";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ethers, upgrades } from "hardhat";

import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  let tx: ContractTransaction;

  /**
   * SecuritizeRegistry
   */
  let securitizeRegistryAddress: string = "";

  switch ((process.env.ENV || "DEV").trim()) {
    case "DEV":
      securitizeRegistryAddress = (
        process.env.SECURITIZE_REGISTRY_DEV || ""
      ).trim();
      break;
    case "STAGING":
      securitizeRegistryAddress = (
        process.env.SECURITIZE_REGISTRY_STAGING || ""
      ).trim();
      break;
    case "PROD":
      securitizeRegistryAddress = (
        process.env.SECURITIZE_REGISTRY_PROD || ""
      ).trim();
      break;
    default:
      break;
  }

  if ((process.env.HARDHAT_NETWORK || "localhost").trim() === "localhost") {
    const SecuritizeRegistry: ContractFactory = await ethers.getContractFactory(
      "SecuritizeRegistry"
    );
    const securitizeRegistry: Contract = await SecuritizeRegistry.deploy();

    await securitizeRegistry.deployed();

    securitizeRegistryAddress = securitizeRegistry.address;

    tx = await securitizeRegistry.addWallet(signers[0].address);

    await tx.wait();
  }

  console.log("SecuritizeRegistry: ", securitizeRegistryAddress);

  /**
   * SecuritizeRegistryProxy
   */
  const securitizeRegistryProxyAddress: string = (
    process.env.D_SECURITIZE_REGISTRY_PROXY || ""
  ).trim();
  const SecuritizeRegistryProxy: ContractFactory =
    await ethers.getContractFactory("SecuritizeRegistryProxy");
  let securitizeRegistryProxy: Contract;

  if (securitizeRegistryProxyAddress != "") {
    securitizeRegistryProxy = SecuritizeRegistryProxy.attach(
      securitizeRegistryProxyAddress
    );
  } else {
    securitizeRegistryProxy = await SecuritizeRegistryProxy.deploy(
      securitizeRegistryAddress
    );

    await securitizeRegistryProxy.deployed();
  }

  console.log("SecuritizeRegistryProxy: ", securitizeRegistryProxy.address);

  /**
   * ContractsRegistry
   */
  const contractsRegistryAddress: string = (
    process.env.D_CONTRACTS_REGISTRY || ""
  ).trim();
  const ContractsRegistry: ContractFactory = await ethers.getContractFactory(
    "ContractsRegistry"
  );
  let contractsRegistry: Contract;

  if (contractsRegistryAddress != "") {
    contractsRegistry = ContractsRegistry.attach(contractsRegistryAddress);
  } else {
    contractsRegistry = await ContractsRegistry.deploy(
      securitizeRegistryProxy.address
    );

    await contractsRegistry.deployed();
  }

  console.log("ContractsRegistry: ", contractsRegistry.address);

  /**
   * ContractsRegistryProxy
   */
  const contractsRegistryProxyAddress: string = (
    process.env.D_CONTRACTS_REGISTRY_PROXY || ""
  ).trim();
  const ContractsRegistryProxy: ContractFactory =
    await ethers.getContractFactory("ContractsRegistryProxy");
  let contractsRegistryProxy: Contract;

  if (contractsRegistryProxyAddress != "") {
    contractsRegistryProxy = ContractsRegistryProxy.attach(
      contractsRegistryAddress
    );
  } else {
    contractsRegistryProxy = await ContractsRegistryProxy.deploy(
      securitizeRegistryProxy.address,
      contractsRegistry.address
    );

    await contractsRegistryProxy.deployed();
  }

  console.log("ContractsRegistryProxy: ", contractsRegistryProxy.address);

  /**
   * ValidationNodesProviderImplementation
   */
  const ValidationNodesProvider: ContractFactory =
    await ethers.getContractFactory("ValidationNodesProviderUpgradeable");
  const validationNodesProvider: Contract =
    await ValidationNodesProvider.deploy();

  await validationNodesProvider.deployed();

  console.log(
    "ValidationNodesProviderImplementation: ",
    validationNodesProvider.address
  );

  /**
   * BeaconProxy
   */
  const BeaconProxy: ContractFactory = await ethers.getContractFactory(
    "BeaconUpgradeable"
  );
  const beaconProxy: Contract = await upgrades.deployProxy(
    BeaconProxy,
    [
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address,
      validationNodesProvider.address,
    ],
    {
      initializer: "__Beacon_init",
    }
  );

  await beaconProxy.deployed();

  console.log("BeaconProxy: ", beaconProxy.address);
  console.log(
    "BeaconImplementation: ",
    await upgrades.erc1967.getImplementationAddress(beaconProxy.address)
  );

  /**
   * StructuredStaking
   */
  const centralBTWallet: string = (
    process.env.D_CENTRAL_BT_WALLLET || signers[0].address
  ).trim();
  const StructuredStakingProxy: ContractFactory =
    await ethers.getContractFactory("StructuredStakingUpgradeable");
  const structuredStakingProxy: Contract = await upgrades.deployProxy(
    StructuredStakingProxy,
    [
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address,
      beaconProxy.address,
      centralBTWallet,
    ],
    {
      initializer: "__StructuredStaking_init",
    }
  );

  await structuredStakingProxy.deployed();

  console.log("StructuredStakingProxy: ", structuredStakingProxy.address);
  console.log(
    "StructuredStakingImplementation: ",
    await upgrades.erc1967.getImplementationAddress(
      structuredStakingProxy.address
    )
  );

  /**
   * Whitelist contracts
   */
  tx = await contractsRegistry.addContract(securitizeRegistryAddress);

  await tx.wait();

  tx = await contractsRegistry.addContract(securitizeRegistryProxy.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(contractsRegistry.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(contractsRegistryProxy.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(validationNodesProvider.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(beaconProxy.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(structuredStakingProxy.address);

  await tx.wait();
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
