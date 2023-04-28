import Web3 from "web3";
import {ERC1155FactoryAbi} from "../abis/erc1155factory.js";
import {logger} from "./base.js";
import {ERC1155Abi} from "../abis/erc1155.js";

export const getWeb3 = (nodeUrl) => {
  return new Web3(nodeUrl);
}

export const getFactoryContractInstance = (web3, contractAddress) => {
  return new web3.eth.Contract(ERC1155FactoryAbi, contractAddress);
}

export const getCollectionContractInstance = (web3, contractAddress) => {
  return new web3.eth.Contract(ERC1155Abi, contractAddress);
}

export const setAddressAsPartner = async (web3, factoryContractInstance, factoryContractAddress, ownerPrivateKey, address) => {
  logger.ultraImportant(`Adding address as partner to factory contract: ${address}`);
  const account = web3.eth.accounts.privateKeyToAccount(ownerPrivateKey);

  const transaction = factoryContractInstance.methods.addPartner(address);

  const options = {
    to: factoryContractAddress,
    data: transaction.encodeABI(),
    gas: await transaction.estimateGas({from: account.address}),
    gasPrice: await web3.eth.getGasPrice()
  };

  logger.ultraImportant(`Sending "addPartner(${address})" transaction`);
  const signed = await web3.eth.accounts.signTransaction(options, account.privateKey);
  const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
  logger.ultraImportant(`Transaction was successful, txHash: "${receipt.transactionHash}"`);

  const isPartnerValidate = await factoryContractInstance.methods.isPartner(address).call();
  logger.ultraImportant(`Validating that address is partner after latest tx: ${isPartnerValidate}`);
}
