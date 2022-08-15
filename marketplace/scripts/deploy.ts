import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import hre, { ethers, upgrades } from "hardhat";

import * as dotenv from "dotenv";

import {
  ContractTransaction,
  ContractFactory,
  BigNumber,
  Contract,
} from "ethers";

dotenv.config();

async function main() {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  let tx: ContractTransaction;

  /**
   * SecuritizeRegistry
   */
  let securitizeRegistryAddress: string = "";

  switch (process.env.ENV) {
    case "DEV":
      securitizeRegistryAddress = process.env.SECURITIZE_REGISTRY_DEV || "";
      break;
    case "STAGING":
      securitizeRegistryAddress = process.env.SECURITIZE_REGISTRY_STAGING || "";
      break;
    case "PROD":
      securitizeRegistryAddress = process.env.SECURITIZE_REGISTRY_PROD || "";
      break;
    default:
      break;
  }

  if (process.env.HARDHAT_NETWORK === "localhost") {
    const SecuritizeRegistry: ContractFactory = await ethers.getContractFactory(
      "SecuritizeRegistry"
    );
    const securitizeRegistry: Contract = await SecuritizeRegistry.deploy();

    await securitizeRegistry.deployed();

    securitizeRegistryAddress = securitizeRegistry.address;

    tx = await securitizeRegistry.addWallet(signers[0].address);

    await tx.wait();
  }

  console.log("SecuritizeRegistry: ", securitizeRegistryAddress);

  /**
   * SecuritizeRegistryProxy
   */
  const SecuritizeRegistryProxy: ContractFactory =
    await ethers.getContractFactory("SecuritizeRegistryProxy");
  const securitizeRegistryProxy: Contract =
    await SecuritizeRegistryProxy.deploy(securitizeRegistryAddress);

  await securitizeRegistryProxy.deployed();

  console.log("SecuritizeRegistryProxy: ", securitizeRegistryProxy.address);

  /**
   * ContractsRegistry
   */
  const ContractsRegistry: ContractFactory = await ethers.getContractFactory(
    "ContractsRegistry"
  );
  const contractsRegistry: Contract = await ContractsRegistry.deploy(
    securitizeRegistryProxy.address
  );

  await contractsRegistry.deployed();

  console.log("ContractsRegistry: ", contractsRegistry.address);

  /**
   * ContractsRegistryProxy
   */
  const ContractsRegistryProxy: ContractFactory =
    await ethers.getContractFactory("ContractsRegistryProxy");
  const contractsRegistryProxy: Contract = await ContractsRegistryProxy.deploy(
    securitizeRegistryProxy.address,
    contractsRegistry.address
  );

  await contractsRegistryProxy.deployed();

  console.log("ContractsRegistryProxy: ", contractsRegistryProxy.address);

  /**
   * TransferProxy
   */
  const TransferProxy: ContractFactory = await ethers.getContractFactory(
    "TransferProxy"
  );
  const transferProxy: Contract = await TransferProxy.deploy();

  await transferProxy.deployed();

  tx = await transferProxy.__TransferProxy_init(
    securitizeRegistryProxy.address,
    contractsRegistryProxy.address
  );

  await tx.wait();

  console.log("TransferProxy: ", transferProxy.address);

  /**
   * ERC20TransferProxy
   */
  const ERC20TransferProxy: ContractFactory = await ethers.getContractFactory(
    "ERC20TransferProxy"
  );
  const erc20TransferProxy: Contract = await ERC20TransferProxy.deploy();

  await erc20TransferProxy.deployed();

  tx = await erc20TransferProxy.__ERC20TransferProxy_init(
    securitizeRegistryProxy.address,
    contractsRegistryProxy.address
  );

  await tx.wait();

  console.log("ERC20TransferProxy: ", erc20TransferProxy.address);

  /**
   * ERC1155LazyMintTransferProxy
   */
  const ERC1155LazyMintTransferProxy: ContractFactory =
    await ethers.getContractFactory("ERC1155LazyMintTransferProxy");
  const erc1155LazyMintTransferProxy: Contract =
    await ERC1155LazyMintTransferProxy.deploy(
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address
    );

  await erc1155LazyMintTransferProxy.deployed();

  tx = await erc1155LazyMintTransferProxy.__OperatorRole_init();

  await tx.wait();

  console.log(
    "ERC1155LazyMintTransferProxy: ",
    erc1155LazyMintTransferProxy.address
  );

  /**
   * RoyaltiesRegistry
   */
  const RoyaltiesRegistry: ContractFactory = await ethers.getContractFactory(
    "RoyaltiesRegistry"
  );
  const royaltiesRegistry: Contract = await RoyaltiesRegistry.deploy();

  await royaltiesRegistry.deployed();

  tx = await royaltiesRegistry.__RoyaltiesRegistry_init(
    securitizeRegistryProxy.address,
    contractsRegistryProxy.address
  );

  await tx.wait();

  console.log("RoyaltiesRegistry: ", royaltiesRegistry.address);

  /**
   * ExchangeV2Proxy
   */
  const protocolFee: BigNumber = BigNumber.from(process.env.PROTOCOL_FEE);
  const defaultFeeReceiver: string =
    process.env.DEFAULT_FEE_RECEIVER || signers[0].address;
  const ExchangeV2: ContractFactory = await ethers.getContractFactory(
    "ExchangeV2"
  );
  const exchangeV2Proxy: Contract = await upgrades.deployProxy(
    ExchangeV2,
    [
      transferProxy.address,
      erc20TransferProxy.address,
      protocolFee,
      defaultFeeReceiver,
      royaltiesRegistry.address,
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address,
    ],
    {
      initializer: "__ExchangeV2_init",
    }
  );

  await exchangeV2Proxy.deployed();

  console.log("ExchangeV2Proxy: ", exchangeV2Proxy.address);
  console.log(
    "ExchangeV2Implementation: ",
    await hre.upgrades.erc1967.getImplementationAddress(exchangeV2Proxy.address)
  );

  tx = await exchangeV2Proxy.whitelistPaymentToken(process.env.USDC, true);

  await tx.wait();

  /**
   * ERC1155BridgeTowerProxy
   */
  const ERC1155BridgeTower: ContractFactory = await ethers.getContractFactory(
    "ERC1155BridgeTower"
  );
  const erc1155BridgeTowerProxy: Contract = await upgrades.deployProxy(
    ERC1155BridgeTower,
    [
      process.env.TOKEN_NAME,
      process.env.TOKEN_SYMBOL,
      "",
      "",
      transferProxy.address,
      erc1155LazyMintTransferProxy.address,
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address,
      0, // 0 seconds
    ],
    { initializer: "__ERC1155BridgeTower_init" }
  );

  await erc1155BridgeTowerProxy.deployed();

  console.log("ERC1155BridgeTowerProxy: ", erc1155BridgeTowerProxy.address);
  console.log(
    "ERC1155BridgeTowerImplementation: ",
    await hre.upgrades.erc1967.getImplementationAddress(
      erc1155BridgeTowerProxy.address
    ),
    "\n"
  );

  tx = await erc1155BridgeTowerProxy.addPartner(
    erc1155LazyMintTransferProxy.address
  );

  await tx.wait();

  /**
   * Add operators
   */
  tx = await transferProxy.addOperator(exchangeV2Proxy.address);

  await tx.wait();

  tx = await erc20TransferProxy.addOperator(exchangeV2Proxy.address);

  await tx.wait();

  /**
   * Whitelist contracts
   */

  tx = await contractsRegistry.addContract(securitizeRegistryAddress);

  await tx.wait();

  tx = await contractsRegistry.addContract(securitizeRegistryProxy.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(contractsRegistry.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(contractsRegistryProxy.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(transferProxy.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(erc20TransferProxy.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(
    erc1155LazyMintTransferProxy.address
  );

  await tx.wait();

  tx = await contractsRegistry.addContract(erc1155BridgeTowerProxy.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(royaltiesRegistry.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(exchangeV2Proxy.address);

  await tx.wait();
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
