/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { generateTokenID } from "../test/utils/helpers";
import { MintERC1155Data } from "../test/utils/types";

import mintData from "./data/mintData.json";

import { ethers } from "hardhat";

import * as dotenv from "dotenv";

import {
  ContractTransaction,
  ContractFactory,
  BigNumber,
  Contract,
} from "ethers";

const { constants } = require("@openzeppelin/test-helpers");

dotenv.config();

async function main() {
  const ERC1155BridgeTower: ContractFactory = await ethers.getContractFactory(
    "ERC1155BridgeTower"
  );
  const erc1155BridgeTowerProxy: Contract = ERC1155BridgeTower.attach(
    (process.env.M_COLLECTION || "").trim()
  );
  const signers: SignerWithAddress[] = await ethers.getSigners();

  for (let i: number = 1; i <= mintData.length; ++i) {
    const tokenId: BigNumber = generateTokenID(signers[0].address);
    const data: MintERC1155Data = {
      tokenId: tokenId,
      tokenURI: mintData[i - 1].ipfs_link,
      supply: BigNumber.from(mintData[i - 1].supply),
      creators: [
        {
          account: signers[0].address,
          value: BigNumber.from(10000),
        },
      ],
      royalties: [
        {
          account: signers[0].address,
          value: BigNumber.from((process.env.M_ROYALTIES || "0").trim()),
        },
      ],
      signatures: [constants.ZERO_ADDRESS],
    };
    const to: string = signers[0].address;
    const amount: BigNumber = BigNumber.from(mintData[i - 1].supply);
    const tx: ContractTransaction =
      await erc1155BridgeTowerProxy.mintAndTransfer(data, to, amount);

    await tx.wait();

    console.log(`${i.toString()}. ${tokenId.toString()}`);
  }
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
