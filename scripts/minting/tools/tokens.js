import * as jose from "jose";

export const getUnixTimestamp = (date) => {
  return Math.floor(date.getTime() / 1000)
}

export const createToken = async (secret, identityId) => {
  const encoder = new TextEncoder().encode(secret)
  const now = new Date();
  const iat = new Date(now)
  const exp = new Date(now)

  iat.setHours(now.getHours() - 2);
  exp.setMonth(now.getMonth() + 2);

  return new jose.SignJWT({sub: identityId})
    .setProtectedHeader({alg: 'HS256', typ: 'JWT'})
    .setIssuedAt(getUnixTimestamp(iat))
    .setExpirationTime(getUnixTimestamp(exp))
    .sign(encoder);
}
