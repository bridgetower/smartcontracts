import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import hre, {ethers} from "hardhat";
import {
  Contract,
  ContractFactory,
  ContractReceipt,
  ContractTransaction,
} from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

function getEnvOrThrow(name: string): string | never {
  const param = process.env[name];
  if (!param) throw new Error("Beda");

  return param;
}

const log = {
  success: (msg: string) => console.log(`✅ ${msg}`),
  inProgress: (msg: string) => console.log(`⌛ ${msg}`),
  importantSuccess: (msg: string) => console.log(`✅🛎️🛎️🛎️🛎️ ${msg} 🛎️🛎️🛎️🛎✅️`),
};

async function main() {
  log.inProgress("Starting tedious process... ( -_•) 🔫");

  const signers: SignerWithAddress[] = await ethers.getSigners();

  const owner: string = getEnvOrThrow("WD_ADDITIONAL_OWNER_ADDRESS");
  const initialWhitelist: string[] = JSON.parse(
    getEnvOrThrow("WD_INITIAL_WHITELIST")
  );
  const registryProxyAddress = getEnvOrThrow("WD_REGISTRY_PROXY_ADDRESS");
  let tx: ContractTransaction;
  let txReceipt: ContractReceipt;

  const WhitelistContract: ContractFactory = await ethers.getContractFactory(
    "Whitelist"
  );

  log.inProgress(`Deploying whitelist contract`);
  const whitelist: Contract = await WhitelistContract.deploy();
  await whitelist.deployed();
  log.success(
    `Deployed whitelist contract: ${whitelist.address} with hash ${whitelist.deployTransaction.hash}`
  );
  log.importantSuccess(`WHITELIST CONTRACT ADDRESS: ${whitelist.address}`);

  log.inProgress(`Verifying whitelist contract`);
  try {
    await hre.run("verify:verify", {
      address: whitelist.address,
      constructorArguments: [],
    });
    log.success(`Verified whitelist contract: ${whitelist.address}`);
  } catch (err: any) {
    console.error(err.message);
  }

  log.inProgress(`Adding owner ${owner} to the whitelist contract`);
  tx = await whitelist.addOwner(owner);
  txReceipt = await tx.wait();
  log.success(
    `Added owner ${owner} to the whitelist contract ${whitelist.address} with hash ${txReceipt.transactionHash}`
  );

  log.inProgress(
    `Adding signer address ${signers[0].address} to the whitelist`
  );
  tx = await whitelist.addWalletFromOwner(signers[0].address);
  txReceipt = await tx.wait();
  log.success(
    `Added owner ${signers[0].address} to the whitelist on contract ${whitelist.address} with hash ${txReceipt.transactionHash}`
  );

  log.inProgress(
    `Attaching to the SecuritizeRegistryProxy at ${registryProxyAddress}`
  );
  const SecuritizeRegistryProxy: ContractFactory =
    await ethers.getContractFactory("SecuritizeRegistryProxy");
  //
  const registryProxy = SecuritizeRegistryProxy.attach(registryProxyAddress);

  log.inProgress(
    `Setting SecuritizeRegistryProxy (${registryProxyAddress}) target to ${whitelist.address}`
  );
  tx = await registryProxy.setSecuritizeRegistry(whitelist.address);
  txReceipt = await tx.wait();
  log.success(
    `Set securitize registry proxy target to ${whitelist.address} with hash ${txReceipt.transactionHash}`
  );

  log.inProgress(`Filling in initial whitelist`);
  for (let i = 0; i < initialWhitelist.length; i++) {
    log.inProgress(`Adding wallet ${initialWhitelist[i]} to the whitelist`);
    tx = await whitelist.addWalletFromOwner(initialWhitelist[i]);
    txReceipt = await tx.wait();
    log.success(
      `Added wallet ${initialWhitelist[i]} to whitelist contract on ${whitelist.address} with hash ${txReceipt.transactionHash}`
    );
  }

  log.success("ʕ•͡-•ʔ ʕ•͡-•ʔ ʕ•͡-•ʔ Done! ʕ•͡-•ʔ ʕ•͡-•ʔ ʕ•͡-•ʔ");
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
