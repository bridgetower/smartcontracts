import { BigNumber } from "ethers";

export type Part = {
  account: string;
  value: BigNumber;
};

export type MintERC721Data = {
  tokenId: BigNumber;
  tokenURI: string;
  creators: Part[];
  royalties: Part[];
  signatures: string[];
};
