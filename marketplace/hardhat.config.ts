import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";

import "@nomicfoundation/hardhat-chai-matchers";

import "@openzeppelin/hardhat-upgrades";

import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";

import "hardhat-contract-sizer";

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
    avalanche_testnet: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      gasPrice: 30000000000,
      gas: 3000000,
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      gasPrice: 30000000000,
      gas: 3000000,
      chainId: 43114,
      accounts: [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      avalanche: process.env.V_SNOWTRACE_API_KEY || "",
      avalancheFujiTestnet: process.env.V_SNOWTRACE_API_KEY || "",
    },
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
