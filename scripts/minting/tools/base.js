import nfts from "../nfts.json" assert {type: "json"};
import axios from "axios";
import FormData from "form-data"
import fs from "fs";

export const addCollectionToTheApi = async (baseUrl, endpoint, token, collection) => {
  const form = new FormData();
  form.append("id", collection.id);
  form.append("name", collection.name);
  form.append("description", collection.description);
  form.append("symbol", collection.symbol);
  form.append("salt", collection.salt);
  form.append("chainId", collection.chainId);
  form.append("cover", collection.cover, 'cover.jpg');
  form.append("logo", collection.logo, 'cover.png');

  const response = await axios.post(`${baseUrl}/${endpoint}`, form,
    {headers: {'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}`}});
  console.log(response.data)
  return response.data;
}

export const getEnvOrThrow = (env) => {
  const variable = process.env[env];
  if (!variable)
    throw new Error(`Env "${env}" variable is empty`)
  return variable;
};

export const getNftCreateConfigs = () => ({
  collectionAddress: getEnvOrThrow("BT_MINTER_NFT_COLLECTION_ADDRESS"),
  nfts: nfts
});

export const getConfiguration = async () => ({
  db: {
    host: getEnvOrThrow("BT_MINTER_DB_HOST"),
    user: getEnvOrThrow("BT_MINTER_DB_USER"),
    password: getEnvOrThrow("BT_MINTER_DB_PASSWORD"),
    schema: getEnvOrThrow("BT_MINTER_DB_SCHEMA"),
    port: getEnvOrThrow("BT_MINTER_DB_PORT"),
  },
  email: getEnvOrThrow("BT_MINTER_TARGET_USER_EMAIL"),
  nodeUrl: getEnvOrThrow("BT_MINTER_AVAX_NODE_URL"),
  factoryContractAddress: getEnvOrThrow("BT_MINTER_FACTORY_CONTRACT_ADDRESS"),
  chainId: parseInt(getEnvOrThrow("BT_MINTER_AVAX_CHAIN_ID"), 10),
  factoryContractOwnerPrivateKey: getEnvOrThrow("BT_MINTER_FACTORY_CONTRACT_OWNER_PRIVATE_KEY"),
  jwtSecret: getEnvOrThrow("BT_MINTER_JWT_SECRET"),
  minting: {
    apiBaseUrl: getEnvOrThrow("BT_MINTER_API_BASE_URL"),
    api: {
      endpoints: {
        addCollection: getEnvOrThrow("BT_MINTER_API_ENDPOINT_ADD_COLLECTION"),
      }
    },
    socket: {
      namespace: getEnvOrThrow("BT_MINTER_SOCKET_PARTNER_UTILS_NAMESPACE"),
      calls: {
        mintCollection: getEnvOrThrow("BT_MINTER_SOCKET_MINT_COLLECTION_EVENT"),
        mintNft: getEnvOrThrow("BT_MINTER_SOCKET_MINT_NFT_EVENT"),
      },
    },
    collection: {
      name: getEnvOrThrow("BT_MINTER_COLLECTION_NAME"),
      symbol: getEnvOrThrow("BT_MINTER_COLLECTION_SYMBOL"),
      lockPeriod: getEnvOrThrow("BT_MINTER_COLLECTION_LOCK_PERIOD"),
      abiGist: getEnvOrThrow("BT_MINTER_COLLECTION_ABI_GIST"),
      cover: await fs.promises.readFile(getEnvOrThrow("BT_MINTER_COLLECTION_COVER_PATH")),
      logo: await fs.promises.readFile(getEnvOrThrow("BT_MINTER_COLLECTION_LOGO_PATH")),
      description: getEnvOrThrow("BT_MINTER_COLLECTION_DESCRIPTION"),
    }
  }
})

export const getRequestId = () => new Date().getTime().toString();
export const getSalt = () => new Date().getTime().toString();
export const getLogTimestamp = () => new Date().toISOString();

export const logger = {
  verbose: (arg) => console.log(`[${getLogTimestamp()}]: 🌟 ${arg}`),
  success: (arg) => console.log(`[${getLogTimestamp()}]: ✨ ${arg}`),
  failure: (arg) => console.log(`[${getLogTimestamp()}]: ❌ ${arg}`),
  ultraImportant: (arg) => console.log(`[${getLogTimestamp()}] 🚀🚀🚀🚀 ${arg} 🚀🚀🚀🚀`)
}
export const buildRequest = (request) => ({...request, requestId: getRequestId()});

export const sleep = async (ms) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
