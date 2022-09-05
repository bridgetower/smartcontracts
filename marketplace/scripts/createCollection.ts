import { ethers } from "hardhat";

import * as dotenv from "dotenv";

import {
  ContractTransaction,
  ContractFactory,
  ContractReceipt,
  BigNumber,
  Contract,
  Event,
} from "ethers";

dotenv.config();

async function main() {
  const ERC1155BridgeTowerFactoryC2: ContractFactory =
    await ethers.getContractFactory("ERC1155BridgeTowerFactoryC2");
  const erc1155BridgeTowerFactoryC2: Contract =
    ERC1155BridgeTowerFactoryC2.attach(
      (process.env.C_ERC1155_BRIDGE_TOWER_FACTORY_C2 || "").trim()
    );

  const name: string = (process.env.C_NAME || "").trim();
  const symbol: string = (process.env.C_SYMBOL || "").trim();
  const baseURI: string = "";
  const contractURI: string = "";
  const operators: string[] = process.env.C_OPERATORS
    ? process.env.C_OPERATORS.split(",").map((operator) => operator.trim())
    : [];
  const lockPeriod: BigNumber = BigNumber.from(
    (process.env.C_LOCK_PERIOD || "0").trim()
  );
  const salt: BigNumber = BigNumber.from((process.env.C_SALT || "0").trim());

  const tx: ContractTransaction = await erc1155BridgeTowerFactoryC2.functions[
    "createToken(string,string,string,string,address[],uint256,uint256)"
  ](name, symbol, baseURI, contractURI, operators, lockPeriod, salt);
  const receipt: ContractReceipt = await tx.wait();
  const events: Event[] | undefined = receipt.events?.filter((event) => {
    return event.event === "CreateERC1155BridgeTowerUserProxy";
  });

  console.log(
    events?.length === 1
      ? events[0].args?.length === 1
        ? `Collection: ${events[0].args[0]}`
        : "Something went wrong. Collection isn't deployed. Please, try again"
      : "Something went wrong. Collection isn't deployed. Please, try again"
  );
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
