import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";

import "hardhat-contract-sizer";

import "@openzeppelin/hardhat-upgrades";

import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";

import "hardhat-gas-reporter";

import "@typechain/hardhat";

import "solidity-coverage";

import "solidity-docgen";

dotenv.config();

task("accounts", "Prints the list of accounts", async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY || ""],
      gas: 5000000,
      chainId: 5,
      gasPrice: 30000000000,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY || ""],
      gas: 5000000,
      chainId: 1,
      gasPrice: 100000000000,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  docgen: {
    pages: "files",
  },
  // contractSizer: {
  //   alphaSort: true,
  //   disambiguatePaths: false,
  //   runOnCompile: true,
  //   strict: true,
  //   only: [],
  // },
};

export default config;
