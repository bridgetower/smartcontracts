import {Manager} from "socket.io-client";
import {
  addCollectionToTheApi,
  buildRequest, getCollectionMintingConfig, getConfiguration, getNftCreateConfigs,
  getSalt,
  logger, sleep
} from "./tools/base.js";

import * as dotenv from "dotenv";
import {
  createMySqlConnection,
  getIdentityIdByProfileEmail, getWalletByIdentityIdAndChainId,
  setUserAsPartner,
} from "./tools/sql.js";
import {getFactoryContractInstance, getWeb3, setAddressAsPartner} from "./tools/contracts.js";
import {createToken} from "./tools/tokens.js";

dotenv.config();

const SOCKET_TIMEOUT = 1000 * 60 * 60; // 60 minutes

const params = await getConfiguration();
const collectionParams = await getCollectionMintingConfig();
const dbConnection = await createMySqlConnection(params.db.host, params.db.user, params.db.password, params.db.schema, params.db.port);


async function main() {

  logger.verbose('Preparing to mint NFTs...')

  const id = await getIdentityIdByProfileEmail(dbConnection, params.email);
  logger.ultraImportant(`Found identity id: ${id}`);

  const walletAddress = await getWalletByIdentityIdAndChainId(dbConnection, id, params.chainId);
  logger.ultraImportant(`Wallet address of  user: ${walletAddress}`);

  const web3 = getWeb3(params.nodeUrl);
  const factoryContract = getFactoryContractInstance(web3, collectionParams.factoryContract.address);
  const isPartner = await factoryContract.methods.isPartner(walletAddress).call();
  logger.ultraImportant(`Wallet is already partner: ${isPartner}`);

  if (!isPartner) {
    await setAddressAsPartner(
      web3,
      factoryContract,
      collectionParams.factoryContract.address,
      collectionParams.factoryContract.ownerPrivateKey,
      walletAddress
    );
  }

  await setUserAsPartner(dbConnection, id);
  logger.ultraImportant("Set users account type in the system to 'partner'");


  const bearerToken = await createToken(params.jwtSecret, id);
  logger.ultraImportant(`Generated token "${bearerToken}" for identity "${id}"`)

  logger.verbose('Preparing to mint collection...')

  const manager = new Manager(params.marketplace.apiBaseUrl, {
    extraHeaders: {
      Authorization: `Bearer ${bearerToken}`
    },
    timeout: 2000
  });

  logger.verbose('Manager created...')

  const socketUtils = manager.socket('/' + params.marketplace.socket.namespace, {retries: 2});

  socketUtils.on('connect', () => logger.verbose('Created socket connection on utils...'))
  socketUtils.onAny((eventName, ...args) => logger.verbose(`Got event "${eventName}" with payload ${JSON.stringify(args)}`))
  socketUtils.onAnyOutgoing((eventName, ...args) => logger.verbose(`Sent event "${eventName}" with payload ${JSON.stringify(args)}`))

  while(!socketUtils.connected){
    await sleep(1000);
    logger.verbose("Connecting to socket...")
  }

  const request = buildRequest({
    name: collectionParams.name,
    symbol: collectionParams.symbol,
    lockPeriod: collectionParams.lockPeriod,
    operators: [walletAddress],
    salt: getSalt()
  });

  logger.verbose('Waiting for collection to be minted... (Can take several minutes)')
  const response = await socketUtils.timeout(SOCKET_TIMEOUT).emitWithAck(params.marketplace.socket.calls.mintCollection, request);
  if (!response?.collectionAddress) {
    logger.failure(`Failed to mint collection, socket response: "${JSON.stringify(response)}"`)
    throw new Error("Failed to mint collection")
  }

  logger.success('Collection created!')
  logger.success(`Collection address: ${response.collectionAddress}`)
  logger.success(`Collection creator: ${walletAddress}`)
  logger.verbose('Adding collection to the API')

  const collectionAddress = response.collectionAddress;
  const apiResult = await addCollectionToTheApi(params.marketplace.apiBaseUrl, params.marketplace.api.endpoints.addCollection, bearerToken, {
    id: collectionAddress,
    cover: collectionParams.cover,
    logo: collectionParams.logo,
    name: collectionParams.name,
    symbol: collectionParams.symbol,
    description: collectionParams.description,
    chainId: params.chainId,
    salt: getSalt()
  })

  logger.success(`API Result -> ${JSON.stringify(apiResult)}`)

  logger.ultraImportant(`NOW YOU SHOULD ADD THIS COLLECTION ---> ${collectionAddress} <--- TO CYBAVO WHITELIST`)
  logger.ultraImportant(`CYBAVO WHITELIST === CONTRACT LIST AND DELEGATED AVAX WALLET CONTRACT INTERACTION POLICY (METHODS 'mintAndTransfer'/'setApprovalForAll'))`)
  logger.ultraImportant(`YOU CAN FIND ABI HERE (ERC1155 PROXY) ---> ${collectionParams.abiGist}`)
  logger.success('Done!')

  return;
}

let exitCode = 0;
try {
  await main()
} catch (e) {
  logger.failure(e)
  exitCode = 1;
}

dbConnection.close()
process.exit(exitCode)



