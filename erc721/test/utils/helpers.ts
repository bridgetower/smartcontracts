import { BigNumber } from "ethers";

export const generateTokenID = (creator: string): BigNumber => {
  const timestamp: number = Date.now();
  const rand: string = (Math.random() * 10 ** 18).toString().slice(0, 11);

  return BigNumber.from(creator + timestamp + rand);
};
