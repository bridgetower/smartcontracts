/* eslint-disable no-process-exit */

import * as dotenv from "dotenv";

import hre from "hardhat";

dotenv.config();

async function main() {
  const transferProxy: string = process.env.TRANSFER_PROXY || "";
  const lazyTransferProxy: string = process.env.LAZY_TRANSFER_PROXY || "";
  const erc721BridgeTowerProxy: string =
    process.env.ERC721_BRIDGE_TOWER_PROXY || "";

  // Verify TransferProxy
  try {
    await hre.run("verify:verify", {
      address: transferProxy,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err);
  }

  // Verify ERC721LazyMintTransferProxy
  try {
    await hre.run("verify:verify", {
      address: lazyTransferProxy,
      constructorArguments: [],
    });
  } catch (err: any) {
    console.error(err);
  }

  try {
    await hre.run("verify:verify", {
      address: erc721BridgeTowerProxy,
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
