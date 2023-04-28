import {buildRequest, getConfiguration, getNftCreateConfigs, logger, sleep} from "./tools/base.js";
import {createMySqlConnection, getIdentityIdByProfileEmail} from "./tools/sql.js";
import {createToken} from "./tools/tokens.js";
import {Manager} from "socket.io-client";
import * as dotenv from "dotenv";

dotenv.config();

const SOCKET_TIMEOUT = 1000 * 60 * 60; // 60 minutes

const params = await getConfiguration();
const dbConnection = await createMySqlConnection(params.db.host, params.db.user, params.db.password, params.db.schema, params.db.port);

async function main() {
  const nftParams = getNftCreateConfigs();
  const id = await getIdentityIdByProfileEmail(dbConnection, params.email);
  logger.ultraImportant(`Found identity id: ${id}`);

  const bearerToken = await createToken(params.jwtSecret, id);
  logger.ultraImportant(`Generated token "${bearerToken}" for identity "${id}"`)

  const manager = new Manager(params.marketplace.apiBaseUrl, {
    extraHeaders: {
      Authorization: `Bearer ${bearerToken}`
    },
    timeout: 2000
  });

  logger.verbose('Manager created...')

  const socket = manager.socket('/' + params.marketplace.socket.namespace, {retries: 2});

  socket.on('connect', () => logger.verbose('Created socket connection on partner utils...'))
  while(!socket.connected){
    await sleep(1000);
    logger.verbose("Connecting to socket...")
  }

  socket.onAny((eventName, ...args) => logger.verbose(`Got event "${eventName}" with payload ${JSON.stringify(args)}`))
  socket.onAnyOutgoing((eventName, ...args) => logger.verbose(`Sent event "${eventName}" with payload ${JSON.stringify(args)}`))

  logger.verbose(`Preparing to mint ${nftParams.nfts.length} NFTs to collection ${nftParams.collectionAddress}`)
  const tokenIds = []
  for (const nft of nftParams.nfts) {
    const request = buildRequest({
      collectionAddress: nftParams.collectionAddress,
      ipfsLink: nft.ipfsLink,
      supply: nft.supply,
      royalties: nft.royalties
    })
    logger.verbose(`Minting nft with Supply: ${nft.supply}, Royalties: ${nft.royalties}, IPFS link {${nft.ipfsLink}}`)
    const response = await socket.timeout(SOCKET_TIMEOUT).emitWithAck(params.marketplace.socket.calls.mintNft, request);
    if(!response.tokenId) {
      logger.failure(`Failed to mint ${JSON.stringify(response)}`)
      throw new Error("Failure")
    }
    logger.success(`Minted NFT with ID: ${response.tokenId} for collection ${nftParams.collectionAddress}`)
    tokenIds.push(response.tokenId)
  }

  logger.success("Successfully minted NFTs")
  logger.success(`Collection: ${nftParams.collectionAddress}`)
  logger.success(`NFT IDs: ${tokenIds.join(' | ')}`)
  socket.disconnect();
  manager.removeAllListeners();
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
