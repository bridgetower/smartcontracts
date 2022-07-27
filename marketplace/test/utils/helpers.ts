import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "@ethersproject/strings";

import { AbiCoder } from "ethers/lib/utils";

import { BigNumber } from "ethers";

import hre, { ethers } from "hardhat";

// eslint-disable-next-line node/no-missing-import
import { Order } from "./types";

import Web3 from "web3";

const { constants } = require("@openzeppelin/test-helpers");

export const generateTokenID = (creator: string): BigNumber => {
  const timestamp: number = Date.now();
  const rand: string = (Math.random() * 10 ** 18).toString().slice(0, 11);

  return BigNumber.from(creator + timestamp + rand);
};

export const keccak256Hash = (data: string): string => {
  return keccak256(toUtf8Bytes(data));
};

export const bytes4 = (hash: string): string => {
  return hash.slice(0, 10);
};

export const getLeftOrder = (
  maker: string,
  makeAssetData: string = constants.ZERO_ADDRESS,
  takeAssetData: string = constants.ZERO_ADDRESS,
  encData: any[] = [[], [], false]
): Order => {
  const abiCoder: AbiCoder = new ethers.utils.AbiCoder();

  return {
    maker: maker,
    makeAsset: {
      assetType: {
        assetClass: bytes4(keccak256Hash("ERC1155")),
        data: makeAssetData,
      },
      value: BigNumber.from(1),
    },
    taker: constants.ZERO_ADDRESS,
    takeAsset: {
      assetType: {
        assetClass: bytes4(keccak256Hash("ERC20")),
        data: takeAssetData,
      },
      value: BigNumber.from(200),
    },
    salt: BigNumber.from(1),
    start: BigNumber.from(0),
    end: BigNumber.from(0),
    dataType: bytes4(keccak256Hash("V2")),
    data: abiCoder.encode(
      ["tupple(tupple(address, uint96)[], tupple(address, uint96)[], bool)"],
      [encData]
    ),
  };
};

export const getRightOrder = (
  maker: string,
  makeAssetData: string = constants.ZERO_ADDRESS,
  takeAssetData: string = constants.ZERO_ADDRESS,
  encData: any[] = [[], [], false]
): Order => {
  const abiCoder: AbiCoder = new ethers.utils.AbiCoder();

  return {
    maker: maker,
    makeAsset: {
      assetType: {
        assetClass: bytes4(keccak256Hash("ERC20")),
        data: makeAssetData,
      },
      value: BigNumber.from(200),
    },
    taker: constants.ZERO_ADDRESS,
    takeAsset: {
      assetType: {
        assetClass: bytes4(keccak256Hash("ERC1155")),
        data: takeAssetData,
      },
      value: BigNumber.from(1),
    },
    salt: BigNumber.from(1),
    start: BigNumber.from(0),
    end: BigNumber.from(0),
    dataType: bytes4(keccak256Hash("V2")),
    data: abiCoder.encode(
      ["tupple(tupple(address, uint96)[], tupple(address, uint96)[], bool)"],
      [encData]
    ),
  };
};

export const sign = async (
  order: Order,
  signer: SignerWithAddress,
  verifyingContract: string
): Promise<string> => {
  const web3: Web3 = new Web3(
    new Web3.providers.HttpProvider("http://localhost:8545")
  );
  const chainId: number = await web3.eth.getChainId();
  const domain: any = {
    name: "Exchange",
    version: "2",
    chainId,
    verifyingContract,
  };
  const types: any = {
    AssetType: [
      { name: "assetClass", type: "bytes4" },
      { name: "data", type: "bytes" },
    ],
    Asset: [
      { name: "assetType", type: "AssetType" },
      { name: "value", type: "uint256" },
    ],
    Order: [
      { name: "maker", type: "address" },
      { name: "makeAsset", type: "Asset" },
      { name: "taker", type: "address" },
      { name: "takeAsset", type: "Asset" },
      { name: "salt", type: "uint256" },
      { name: "start", type: "uint256" },
      { name: "end", type: "uint256" },
      { name: "dataType", type: "bytes4" },
      { name: "data", type: "bytes" },
    ],
  };

  return await signer._signTypedData(domain, types, order);
};

export const encodeAssetData = (token: string, tokenId?: BigNumber): string => {
  const abiCoder: AbiCoder = new ethers.utils.AbiCoder();

  if (tokenId) {
    return abiCoder.encode(["address", "uint256"], [token, tokenId.toString()]);
  } else {
    return abiCoder.encode(["address"], [token]);
  }
};

export const increaseTime = async (seconds: number): Promise<void> => {
  await hre.network.provider.send("evm_increaseTime", [seconds]);
};

export const mineBlocks = async (amount: number): Promise<void> => {
  for (let i = 0; i < amount; i++) {
    await hre.network.provider.send("evm_mine");
  }
};
