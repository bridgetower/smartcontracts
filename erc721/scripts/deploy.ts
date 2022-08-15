import { Contract, ContractFactory, ContractTransaction } from "ethers";

import { ethers, upgrades } from "hardhat";

import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  let tx: ContractTransaction;

  /**
   * TransferProxy
   */
  const TransferProxy: ContractFactory = await ethers.getContractFactory(
    "TransferProxy"
  );
  const transferProxy: Contract = await TransferProxy.deploy();

  tx = await transferProxy.__TransferProxy_init();

  await tx.wait();

  console.log("TransferProxy: ", transferProxy.address);

  /**
   * ERC721LazyMintTransferProxy
   */
  const ERC721LazyMintTransferProxy: ContractFactory =
    await ethers.getContractFactory("ERC721LazyMintTransferProxy");
  const erc721LazyMintTransferProxy: Contract =
    await ERC721LazyMintTransferProxy.deploy();

  tx = await erc721LazyMintTransferProxy.__OperatorRole_init();

  await tx.wait();

  console.log(
    "ERC721LazyMintTransferProxy: ",
    erc721LazyMintTransferProxy.address
  );

  /**
   * ERC721BridgeTowerProxy
   */
  const ERC721BridgeTower: ContractFactory = await ethers.getContractFactory(
    "ERC721BridgeTower"
  );
  const erc721BridgeTowerProxy: Contract = await upgrades.deployProxy(
    ERC721BridgeTower,
    [
      process.env.TOKEN_NAME,
      process.env.TOKEN_SYMBOL,
      "",
      "",
      transferProxy.address,
      erc721LazyMintTransferProxy.address,
    ],
    { initializer: "__ERC721BridgeTower_init" }
  );

  await erc721BridgeTowerProxy.deployed();

  console.log("ERC721BridgeTowerProxy: ", erc721BridgeTowerProxy.address, "\n");
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
