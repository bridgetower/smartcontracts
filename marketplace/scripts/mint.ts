/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { generateTokenID } from "../test/utils/helpers";
import { MintERC1155Data } from "../test/utils/types";

import links from "./data/links.json";

import { ethers } from "hardhat";

import {
  ContractTransaction,
  ContractFactory,
  BigNumber,
  Contract,
} from "ethers";

const { constants } = require("@openzeppelin/test-helpers");

export async function mint(erc1155BridgeTowerProxyAddress: string) {
  const ERC1155BridgeTower: ContractFactory = await ethers.getContractFactory(
    "ERC1155BridgeTower"
  );
  const erc1155BridgeTowerProxy: Contract = ERC1155BridgeTower.attach(
    erc1155BridgeTowerProxyAddress
  );
  const signers: SignerWithAddress[] = await ethers.getSigners();

  let tx: ContractTransaction = await erc1155BridgeTowerProxy.addPartner(
    signers[0].address
  );

  await tx.wait();

  for (let i: number = 1; i <= 80; i++) {
    const tokenId: BigNumber = generateTokenID(signers[0].address);
    const data: MintERC1155Data = {
      tokenId: tokenId,
      tokenURI: links[i - 1],
      supply: BigNumber.from(1000),
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
    const amount: BigNumber = BigNumber.from(1000);

    tx = await erc1155BridgeTowerProxy.mintAndTransfer(data, to, amount);

    await tx.wait();

    console.log(`${i.toString()}. ${tokenId.toString()}`);
  }
}
