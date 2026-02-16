import assert from "node:assert/strict"
import test from "node:test"
import {
  createAccessTokenForWallet,
  createNonce,
  createNonceChallengeToken,
  verifyAccessToken,
  verifyNonceChallengeToken,
} from "@/lib/server/wallet-auth"

test("access token verifies for matching wallet and user", async () => {
  const token = await createAccessTokenForWallet("wallet:abc", "AbcWallet11111111111111111111111111111111")
  const payload = await verifyAccessToken(token)
  assert.ok(payload)
  assert.equal(payload.sub, "wallet:abc")
  assert.equal(payload.walletAddress, "AbcWallet11111111111111111111111111111111")
})

test("access token verification fails when signature is tampered", async () => {
  const token = await createAccessTokenForWallet("wallet:def", "DefWallet11111111111111111111111111111111")
  const parts = token.split(".")
  assert.equal(parts.length, 3)
  const tampered = `${parts[0]}.${parts[1]}.tampered-signature`
  const payload = await verifyAccessToken(tampered)
  assert.equal(payload, null)
})

test("nonce challenge validates only for expected wallet and nonce", () => {
  const wallet = "DwN8jYP5aY6RJYKDkeTFS3Vf6EpZrxPQVm3uzdG8QXRX"
  const nonce = createNonce()
  const token = createNonceChallengeToken(wallet, nonce)
  assert.equal(verifyNonceChallengeToken(token, wallet, nonce), true)
  assert.equal(verifyNonceChallengeToken(token, wallet, "wrong"), false)
  assert.equal(verifyNonceChallengeToken(token, "wrong-wallet", nonce), false)
})
