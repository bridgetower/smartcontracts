import { BigNumber } from "ethers";

export type Part = {
  account: string;
  value: BigNumber;
};

export type MintERC1155Data = {
  tokenId: BigNumber;
  tokenURI: string;
  supply: BigNumber;
  creators: Part[];
  royalties: Part[];
  signatures: string[];
};

export type AssetType = {
  assetClass: string;
  data: string;
};

export type Asset = {
  assetType: AssetType;
  value: BigNumber;
};

export type Order = {
  maker: string;
  makeAsset: Asset;
  taker: string;
  takeAsset: Asset;
  salt: BigNumber;
  start: BigNumber;
  end: BigNumber;
  dataType: string;
  data: string;
};
