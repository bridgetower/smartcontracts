import {Manager} from "socket.io-client";
import {
  buildRequest, getCollectionLockPeriodUpdateConfig,
  getConfiguration, logger, sleep
} from "./tools/base.js";

import * as dotenv from "dotenv";
import {
  createMySqlConnection,
  getIdentityIdByProfileEmail, getWalletByIdentityIdAndChainId,
} from "./tools/sql.js";
import {
  getCollectionContractInstance,
  getWeb3,
} from "./tools/contracts.js";
import {createToken} from "./tools/tokens.js";

dotenv.config();

const SOCKET_TIMEOUT = 1000 * 60 * 60; // 60 minutes

const params = await getConfiguration();
const setLockPeriodConfigs = getCollectionLockPeriodUpdateConfig();
const dbConnection = await createMySqlConnection(params.db.host, params.db.user, params.db.password, params.db.schema, params.db.port);


async function main() {
  const id = await getIdentityIdByProfileEmail(dbConnection, params.email);
  logger.ultraImportant(`Found identity id: ${id}`);

  const walletAddress = await getWalletByIdentityIdAndChainId(dbConnection, id, params.chainId);
  logger.ultraImportant(`Wallet address of  user: ${walletAddress}`);

  const web3 = getWeb3(params.nodeUrl);
  const collectionContract = getCollectionContractInstance(web3, setLockPeriodConfigs.collectionAddress)

  const currentLockPeriod = await collectionContract.methods.lockPeriod().call()

  logger.verbose(`Current lock period: ${currentLockPeriod}`)

  const bearerToken = await createToken(params.jwtSecret, id);
  logger.ultraImportant(`Generated token "${bearerToken}" for identity "${id}"`)

  logger.verbose('Preparing to set lock period of the collection...')

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
    collectionAddress: setLockPeriodConfigs.collectionAddress,
    lockPeriod: setLockPeriodConfigs.newLockPeriod
  });

  logger.verbose('Waiting for collection to be minted... (Can take several minutes)')
  const response = await socketUtils.timeout(SOCKET_TIMEOUT).emitWithAck(params.marketplace.socket.calls.setCollectionLockPeriod, request);
  logger.debug(response)
  if (!response?.lockPeriod) {
    logger.failure(`Failed to mint collection, socket response: "${JSON.stringify(response)}"`)
    throw new Error("Failed to mint collection")
  }

  logger.success(`Collection ${setLockPeriodConfigs.collectionAddress} locking period has been successfully changed to [${response?.lockPeriod}] !`)

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



