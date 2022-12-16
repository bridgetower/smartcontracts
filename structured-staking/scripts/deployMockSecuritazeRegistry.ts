import { Contract, ContractFactory, ContractTransaction } from "ethers";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ethers } from "hardhat";

import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const signers: SignerWithAddress[] = await ethers.getSigners();

  /**
   * SecuritizeRegistry
   */
  const SecuritizeRegistry: ContractFactory = await ethers.getContractFactory(
    "SecuritizeRegistry"
  );
  const securitizeRegistryMock: Contract = await SecuritizeRegistry.deploy();

  await securitizeRegistryMock.deployed();

  const tx: ContractTransaction = await securitizeRegistryMock.addWallet(
    signers[0].address
  );

  await tx.wait();

  console.log("SecuritizeRegistryMock: ", securitizeRegistryMock.address);
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
