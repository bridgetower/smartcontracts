/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { generateTokenID } from "../test/utils/helpers";
import { MintERC721Data } from "../test/utils/types";

import links from "./data/links.json";

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

export async function mint(erc721BridgeTowerProxyAddress: string) {
  const ERC721BridgeTower: ContractFactory = await ethers.getContractFactory(
    "ERC721BridgeTower"
  );
  const erc721BridgeTowerProxy: Contract = ERC721BridgeTower.attach(
    erc721BridgeTowerProxyAddress
  );
  const signers: SignerWithAddress[] = await ethers.getSigners();

  for (let i: number = 1; i <= 80; i++) {
    const tokenId: BigNumber = generateTokenID(signers[0].address);
    const data: MintERC721Data = {
      tokenId: tokenId,
      tokenURI: links[i - 1],
      creators: [
        {
          account: signers[0].address,
          value: BigNumber.from(10000),
        },
      ],
      royalties: [
        {
          account: signers[0].address,
          value: BigNumber.from(process.env.ROYALTIES),
        },
      ],
      signatures: [constants.ZERO_ADDRESS],
    };
    const to: string = signers[0].address;
    const tx: ContractTransaction =
      await erc721BridgeTowerProxy.mintAndTransfer(data, to);

    await tx.wait();

    console.log(`${i.toString()}. ${tokenId.toString()}`);
  }
}
