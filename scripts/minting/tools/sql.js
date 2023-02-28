import * as mysql from 'mysql2/promise'

export const createMySqlConnection = async (host, user, password, database, port) => {
  return mysql.createConnection({
    host,
    user,
    password,
    database,
    port
  });
}

export const getIdentityIdByProfileEmail = async (connection, email) => {
  const [profileQueryRows] = await connection.query("select id from Profile where email = ?", [email]);
  if(!profileQueryRows || !profileQueryRows[0]?.id)
    throw new Error('Cant find profile with specified email');

  const [identityQueryRows] = await connection.query("select id from Identity where profileId = ?", [profileQueryRows[0].id]);
  if(!profileQueryRows || !profileQueryRows[0]?.id)
    throw new Error('Cant find profile with specified email');

  return identityQueryRows[0].id
};

export const getWalletByIdentityIdAndChainId = async (connection, identityId, chainId) => {
  const [addressQueryRows] = await connection.query("select address from BlockchainIdentityAddress where identityId = ? and chainId = ?", [identityId, chainId]);
  if(!addressQueryRows || !addressQueryRows[0]?.address)
    throw new Error('Cant find address with provided parameters');

  return addressQueryRows[0].address
}

export const setUserAsPartner = async (connection, identityId) => {
  const [affectedRows] = await connection.execute("update Identity set accountType = 'partner' where id = ?", [identityId])
  if (affectedRows <= 0 || affectedRows > 1)
    throw new Error("Too much or no rows was updated");
}

export const setUserAsRegularUser = async (connection, identityId) => {
  const [affectedRows] = await connection.execute("update Identity set accountType = 'user' where id = ?", [identityId])
  if (affectedRows <= 0 || affectedRows > 1)
    throw new Error("Too much or no rows was updated");
}
