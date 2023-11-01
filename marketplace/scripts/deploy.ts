import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

import hre, {ethers, upgrades} from "hardhat";

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
  const partners: string[] = process.env.D_PARTNERS
    ? process.env.D_PARTNERS.split(",").map((partner) => partner.trim())
    : [];
  const initialWhitelist: string[] = process.env.D_INITIAL_WHITELIST
    ? process.env.D_INITIAL_WHITELIST.split(",").map((addr) => addr.trim())
    : [];
  let tx: ContractTransaction;

  const SecuritizeRegistry: ContractFactory = await ethers.getContractFactory(
    "Whitelist"
  );
  const securitizeRegistry: Contract = await SecuritizeRegistry.deploy();

  await securitizeRegistry.deployed();

  const securitizeRegistryAddress = securitizeRegistry.address;

  console.log("SecuritizeRegistry: ", securitizeRegistryAddress);

  tx = await securitizeRegistry.addWalletFromOwner(signers[0].address);

  await tx.wait();

  console.log(`SecuritizeRegistry: ${securitizeRegistryAddress} whitelisted: ${signers[0].address} (owner)`);

  for (let i: number = 0; i < partners.length; ++i) {
    tx = await securitizeRegistry.addWalletFromOwner(partners[i]);

    await tx.wait();

    console.log(
      `SecuritizeRegistry: ${securitizeRegistryAddress} whitelisted: ${partners[i]} (partner)`
    );
  }

  for (let i: number = 0; i < initialWhitelist.length; ++i) {
    tx = await securitizeRegistry.addWalletFromOwner(initialWhitelist[i]);

    await tx.wait();

    console.log(
      `SecuritizeRegistry: ${securitizeRegistryAddress} whitelisted: ${initialWhitelist[i]} (initial whitelist)`
    );
  }

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
  const protocolFee: BigNumber = BigNumber.from(
    (process.env.D_PROTOCOL_FEE || "0").trim()
  );
  const defaultFeeReceiver: string = (
    process.env.D_DEFAULT_FEE_RECEIVER || signers[0].address
  ).trim();
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

  tx = await exchangeV2Proxy.whitelistPaymentToken(
    (process.env.D_USDC || "").trim(),
    true
  );

  await tx.wait();

  /**
   * ERC1155BridgeTowerImplementation
   */
  const ERC1155BridgeTower: ContractFactory = await ethers.getContractFactory(
    "ERC1155BridgeTower"
  );
  const erc1155BridgeTowerImplementation: Contract =
    await ERC1155BridgeTower.deploy();

  await erc1155BridgeTowerImplementation.deployed();

  console.log(
    "ERC1155BridgeTowerImplementation: ",
    erc1155BridgeTowerImplementation.address
  );

  /**
   * ERC1155BridgeTowerBeacon
   */
  const ERC1155BridgeTowerBeacon: ContractFactory =
    await ethers.getContractFactory("ERC1155BridgeTowerBeacon");
  const erc1155BridgeTowerBeacon: Contract =
    await ERC1155BridgeTowerBeacon.deploy(
      erc1155BridgeTowerImplementation.address,
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address
    );

  await erc1155BridgeTowerBeacon.deployed();

  console.log("ERC1155BridgeTowerBeacon: ", erc1155BridgeTowerBeacon.address);

  /**
   * ERC1155BridgeTowerFactoryC2
   */
  const ERC1155BridgeTowerFactoryC2: ContractFactory =
    await ethers.getContractFactory("ERC1155BridgeTowerFactoryC2");
  const erc1155BridgeTowerFactoryC2: Contract =
    await ERC1155BridgeTowerFactoryC2.deploy(
      erc1155BridgeTowerBeacon.address,
      transferProxy.address,
      erc1155LazyMintTransferProxy.address,
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address
    );

  await erc1155BridgeTowerFactoryC2.deployed();

  console.log(
    "ERC1155BridgeTowerFactoryC2: ",
    erc1155BridgeTowerFactoryC2.address
  );

  /**
   * Add partners
   */
  for (let i: number = 0; i < partners.length; ++i) {
    tx = await erc1155BridgeTowerFactoryC2.addPartner(partners[i]);

    await tx.wait();
  }

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

  tx = await contractsRegistry.addContract(royaltiesRegistry.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(exchangeV2Proxy.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(
    await hre.upgrades.erc1967.getImplementationAddress(exchangeV2Proxy.address)
  );

  await tx.wait();

  tx = await contractsRegistry.addContract(
    erc1155BridgeTowerImplementation.address
  );

  await tx.wait();

  tx = await contractsRegistry.addContract(erc1155BridgeTowerBeacon.address);

  await tx.wait();

  tx = await contractsRegistry.addContract(erc1155BridgeTowerFactoryC2.address);

  await tx.wait();

  /**
   * Set the ERC1155BridgeTowerFactoryC2 address inside of the ContractsRegistry
   */
  tx = await contractsRegistry.setERC1155BridgeTowerFactoryC2(
    erc1155BridgeTowerFactoryC2.address
  );

  await tx.wait();
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
