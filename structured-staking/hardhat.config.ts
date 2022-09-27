import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";

import "@openzeppelin/hardhat-upgrades";

import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";

import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    fuji: {
      url: (
        process.env.FUJI_TESTNET_RPC ||
        "https://api.avax-test.network/ext/bc/C/rpc"
      ).trim(),
      gasPrice: 30000000000,
      gas: 3000000,
      chainId: 43113,
      accounts: [(process.env.PRIVATE_KEY || "").trim()],
    },
    avalanche: {
      url: (
        process.env.AVALANCHE_MAINNET_RPC ||
        "https://api.avax.network/ext/bc/C/rpc"
      ).trim(),
      gasPrice: 30000000000,
      gas: 3000000,
      chainId: 43114,
      accounts: [(process.env.PRIVATE_KEY || "").trim()],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      avalanche: (process.env.V_SNOWTRACE_API_KEY || "").trim(),
      avalancheFujiTestnet: (process.env.V_SNOWTRACE_API_KEY || "").trim(),
    },
  },
};

export default config;
