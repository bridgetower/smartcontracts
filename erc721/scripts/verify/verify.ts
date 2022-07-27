/* eslint-disable no-process-exit */

import * as dotenv from "dotenv";

import hre from "hardhat";

dotenv.config();

async function main() {
  const transferProxy: string = "0x6444155C7F4885726E422267009CB609D2eE6BC9"; // CHANGE address
  const lazyTransferProxy: string =
    "0x4CE25528f8b80c0ce59CE4Ef431027812e54D4e1"; // CHANGE address
  const erc721BridgeTowerProxy: string =
    "0xa6Fdc272320235efa77BE5BB0522E059EbcD0e73"; // CHANGE address

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

  // Verify ERC721BridgeTowerProxy
  const name: string = "BridgeTower Permissioned Market Token";
  const symbol: string = "PMT";
  const baseURI: string = "";
  const contractURI: string = "";

  try {
    await hre.run("verify:verify", {
      address: erc721BridgeTowerProxy,
      constructorArguments: [
        name,
        symbol,
        baseURI,
        contractURI,
        transferProxy,
        lazyTransferProxy,
      ],
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
