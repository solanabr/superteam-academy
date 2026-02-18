// src/generated/accounts/achievementReceipt.ts
import {
  assertAccountExists,
  assertAccountsExist,
  combineCodec,
  decodeAccount,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  fixDecoderSize,
  fixEncoderSize,
  getAddressDecoder,
  getAddressEncoder,
  getBytesDecoder,
  getBytesEncoder,
  getI64Decoder,
  getI64Encoder,
  getStructDecoder,
  getStructEncoder,
  getU8Decoder,
  getU8Encoder,
  transformEncoder
} from "@solana/kit";
var ACHIEVEMENT_RECEIPT_DISCRIMINATOR = new Uint8Array([
  149,
  5,
  79,
  178,
  116,
  231,
  43,
  248
]);
function getAchievementReceiptDiscriminatorBytes() {
  return fixEncoderSize(getBytesEncoder(), 8).encode(
    ACHIEVEMENT_RECEIPT_DISCRIMINATOR
  );
}
function getAchievementReceiptEncoder() {
  return transformEncoder(
    getStructEncoder([
      ["discriminator", fixEncoderSize(getBytesEncoder(), 8)],
      ["asset", getAddressEncoder()],
      ["awardedAt", getI64Encoder()],
      ["bump", getU8Encoder()]
    ]),
    (value) => ({ ...value, discriminator: ACHIEVEMENT_RECEIPT_DISCRIMINATOR })
  );
}
function getAchievementReceiptDecoder() {
  return getStructDecoder([
    ["discriminator", fixDecoderSize(getBytesDecoder(), 8)],
    ["asset", getAddressDecoder()],
    ["awardedAt", getI64Decoder()],
    ["bump", getU8Decoder()]
  ]);
}
function getAchievementReceiptCodec() {
  return combineCodec(
    getAchievementReceiptEncoder(),
    getAchievementReceiptDecoder()
  );
}
function decodeAchievementReceipt(encodedAccount) {
  return decodeAccount(
    encodedAccount,
    getAchievementReceiptDecoder()
  );
}
async function fetchAchievementReceipt(rpc, address, config) {
  const maybeAccount = await fetchMaybeAchievementReceipt(rpc, address, config);
  assertAccountExists(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeAchievementReceipt(rpc, address, config) {
  const maybeAccount = await fetchEncodedAccount(rpc, address, config);
  return decodeAchievementReceipt(maybeAccount);
}
async function fetchAllAchievementReceipt(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeAchievementReceipt(
    rpc,
    addresses,
    config
  );
  assertAccountsExist(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeAchievementReceipt(rpc, addresses, config) {
  const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
  return maybeAccounts.map(
    (maybeAccount) => decodeAchievementReceipt(maybeAccount)
  );
}
function getAchievementReceiptSize() {
  return 49;
}

// src/generated/accounts/achievementType.ts
import {
  addDecoderSizePrefix,
  addEncoderSizePrefix,
  assertAccountExists as assertAccountExists2,
  assertAccountsExist as assertAccountsExist2,
  combineCodec as combineCodec2,
  decodeAccount as decodeAccount2,
  fetchEncodedAccount as fetchEncodedAccount2,
  fetchEncodedAccounts as fetchEncodedAccounts2,
  fixDecoderSize as fixDecoderSize2,
  fixEncoderSize as fixEncoderSize2,
  getAddressDecoder as getAddressDecoder2,
  getAddressEncoder as getAddressEncoder2,
  getBooleanDecoder,
  getBooleanEncoder,
  getBytesDecoder as getBytesDecoder2,
  getBytesEncoder as getBytesEncoder2,
  getI64Decoder as getI64Decoder2,
  getI64Encoder as getI64Encoder2,
  getStructDecoder as getStructDecoder2,
  getStructEncoder as getStructEncoder2,
  getU32Decoder,
  getU32Encoder,
  getU8Decoder as getU8Decoder2,
  getU8Encoder as getU8Encoder2,
  getUtf8Decoder,
  getUtf8Encoder,
  transformEncoder as transformEncoder2
} from "@solana/kit";
var ACHIEVEMENT_TYPE_DISCRIMINATOR = new Uint8Array([
  13,
  187,
  114,
  66,
  217,
  154,
  85,
  137
]);
function getAchievementTypeDiscriminatorBytes() {
  return fixEncoderSize2(getBytesEncoder2(), 8).encode(
    ACHIEVEMENT_TYPE_DISCRIMINATOR
  );
}
function getAchievementTypeEncoder() {
  return transformEncoder2(
    getStructEncoder2([
      ["discriminator", fixEncoderSize2(getBytesEncoder2(), 8)],
      [
        "achievementId",
        addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())
      ],
      ["name", addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
      ["metadataUri", addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
      ["collection", getAddressEncoder2()],
      ["creator", getAddressEncoder2()],
      ["maxSupply", getU32Encoder()],
      ["currentSupply", getU32Encoder()],
      ["xpReward", getU32Encoder()],
      ["isActive", getBooleanEncoder()],
      ["createdAt", getI64Encoder2()],
      ["reserved", fixEncoderSize2(getBytesEncoder2(), 8)],
      ["bump", getU8Encoder2()]
    ]),
    (value) => ({ ...value, discriminator: ACHIEVEMENT_TYPE_DISCRIMINATOR })
  );
}
function getAchievementTypeDecoder() {
  return getStructDecoder2([
    ["discriminator", fixDecoderSize2(getBytesDecoder2(), 8)],
    ["achievementId", addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
    ["name", addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
    ["metadataUri", addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
    ["collection", getAddressDecoder2()],
    ["creator", getAddressDecoder2()],
    ["maxSupply", getU32Decoder()],
    ["currentSupply", getU32Decoder()],
    ["xpReward", getU32Decoder()],
    ["isActive", getBooleanDecoder()],
    ["createdAt", getI64Decoder2()],
    ["reserved", fixDecoderSize2(getBytesDecoder2(), 8)],
    ["bump", getU8Decoder2()]
  ]);
}
function getAchievementTypeCodec() {
  return combineCodec2(getAchievementTypeEncoder(), getAchievementTypeDecoder());
}
function decodeAchievementType(encodedAccount) {
  return decodeAccount2(
    encodedAccount,
    getAchievementTypeDecoder()
  );
}
async function fetchAchievementType(rpc, address, config) {
  const maybeAccount = await fetchMaybeAchievementType(rpc, address, config);
  assertAccountExists2(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeAchievementType(rpc, address, config) {
  const maybeAccount = await fetchEncodedAccount2(rpc, address, config);
  return decodeAchievementType(maybeAccount);
}
async function fetchAllAchievementType(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeAchievementType(
    rpc,
    addresses,
    config
  );
  assertAccountsExist2(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeAchievementType(rpc, addresses, config) {
  const maybeAccounts = await fetchEncodedAccounts2(rpc, addresses, config);
  return maybeAccounts.map(
    (maybeAccount) => decodeAchievementType(maybeAccount)
  );
}

// src/generated/accounts/config.ts
import {
  assertAccountExists as assertAccountExists3,
  assertAccountsExist as assertAccountsExist3,
  combineCodec as combineCodec3,
  decodeAccount as decodeAccount3,
  fetchEncodedAccount as fetchEncodedAccount3,
  fetchEncodedAccounts as fetchEncodedAccounts3,
  fixDecoderSize as fixDecoderSize3,
  fixEncoderSize as fixEncoderSize3,
  getAddressDecoder as getAddressDecoder3,
  getAddressEncoder as getAddressEncoder3,
  getBytesDecoder as getBytesDecoder3,
  getBytesEncoder as getBytesEncoder3,
  getStructDecoder as getStructDecoder3,
  getStructEncoder as getStructEncoder3,
  getU8Decoder as getU8Decoder3,
  getU8Encoder as getU8Encoder3,
  transformEncoder as transformEncoder3
} from "@solana/kit";
var CONFIG_DISCRIMINATOR = new Uint8Array([
  155,
  12,
  170,
  224,
  30,
  250,
  204,
  130
]);
function getConfigDiscriminatorBytes() {
  return fixEncoderSize3(getBytesEncoder3(), 8).encode(CONFIG_DISCRIMINATOR);
}
function getConfigEncoder() {
  return transformEncoder3(
    getStructEncoder3([
      ["discriminator", fixEncoderSize3(getBytesEncoder3(), 8)],
      ["authority", getAddressEncoder3()],
      ["backendSigner", getAddressEncoder3()],
      ["xpMint", getAddressEncoder3()],
      ["reserved", fixEncoderSize3(getBytesEncoder3(), 8)],
      ["bump", getU8Encoder3()]
    ]),
    (value) => ({ ...value, discriminator: CONFIG_DISCRIMINATOR })
  );
}
function getConfigDecoder() {
  return getStructDecoder3([
    ["discriminator", fixDecoderSize3(getBytesDecoder3(), 8)],
    ["authority", getAddressDecoder3()],
    ["backendSigner", getAddressDecoder3()],
    ["xpMint", getAddressDecoder3()],
    ["reserved", fixDecoderSize3(getBytesDecoder3(), 8)],
    ["bump", getU8Decoder3()]
  ]);
}
function getConfigCodec() {
  return combineCodec3(getConfigEncoder(), getConfigDecoder());
}
function decodeConfig(encodedAccount) {
  return decodeAccount3(
    encodedAccount,
    getConfigDecoder()
  );
}
async function fetchConfig(rpc, address, config) {
  const maybeAccount = await fetchMaybeConfig(rpc, address, config);
  assertAccountExists3(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeConfig(rpc, address, config) {
  const maybeAccount = await fetchEncodedAccount3(rpc, address, config);
  return decodeConfig(maybeAccount);
}
async function fetchAllConfig(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeConfig(rpc, addresses, config);
  assertAccountsExist3(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeConfig(rpc, addresses, config) {
  const maybeAccounts = await fetchEncodedAccounts3(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) => decodeConfig(maybeAccount));
}
function getConfigSize() {
  return 113;
}

// src/generated/accounts/course.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix2,
  addEncoderSizePrefix as addEncoderSizePrefix2,
  assertAccountExists as assertAccountExists4,
  assertAccountsExist as assertAccountsExist4,
  combineCodec as combineCodec4,
  decodeAccount as decodeAccount4,
  fetchEncodedAccount as fetchEncodedAccount4,
  fetchEncodedAccounts as fetchEncodedAccounts4,
  fixDecoderSize as fixDecoderSize4,
  fixEncoderSize as fixEncoderSize4,
  getAddressDecoder as getAddressDecoder4,
  getAddressEncoder as getAddressEncoder4,
  getBooleanDecoder as getBooleanDecoder2,
  getBooleanEncoder as getBooleanEncoder2,
  getBytesDecoder as getBytesDecoder4,
  getBytesEncoder as getBytesEncoder4,
  getI64Decoder as getI64Decoder3,
  getI64Encoder as getI64Encoder3,
  getOptionDecoder,
  getOptionEncoder,
  getStructDecoder as getStructDecoder4,
  getStructEncoder as getStructEncoder4,
  getU16Decoder,
  getU16Encoder,
  getU32Decoder as getU32Decoder2,
  getU32Encoder as getU32Encoder2,
  getU8Decoder as getU8Decoder4,
  getU8Encoder as getU8Encoder4,
  getUtf8Decoder as getUtf8Decoder2,
  getUtf8Encoder as getUtf8Encoder2,
  transformEncoder as transformEncoder4
} from "@solana/kit";
var COURSE_DISCRIMINATOR = new Uint8Array([
  206,
  6,
  78,
  228,
  163,
  138,
  241,
  106
]);
function getCourseDiscriminatorBytes() {
  return fixEncoderSize4(getBytesEncoder4(), 8).encode(COURSE_DISCRIMINATOR);
}
function getCourseEncoder() {
  return transformEncoder4(
    getStructEncoder4([
      ["discriminator", fixEncoderSize4(getBytesEncoder4(), 8)],
      ["courseId", addEncoderSizePrefix2(getUtf8Encoder2(), getU32Encoder2())],
      ["creator", getAddressEncoder4()],
      ["contentTxId", fixEncoderSize4(getBytesEncoder4(), 32)],
      ["version", getU16Encoder()],
      ["lessonCount", getU8Encoder4()],
      ["difficulty", getU8Encoder4()],
      ["xpPerLesson", getU32Encoder2()],
      ["trackId", getU16Encoder()],
      ["trackLevel", getU8Encoder4()],
      ["prerequisite", getOptionEncoder(getAddressEncoder4())],
      ["creatorRewardXp", getU32Encoder2()],
      ["minCompletionsForReward", getU16Encoder()],
      ["totalCompletions", getU32Encoder2()],
      ["totalEnrollments", getU32Encoder2()],
      ["isActive", getBooleanEncoder2()],
      ["createdAt", getI64Encoder3()],
      ["updatedAt", getI64Encoder3()],
      ["reserved", fixEncoderSize4(getBytesEncoder4(), 8)],
      ["bump", getU8Encoder4()]
    ]),
    (value) => ({ ...value, discriminator: COURSE_DISCRIMINATOR })
  );
}
function getCourseDecoder() {
  return getStructDecoder4([
    ["discriminator", fixDecoderSize4(getBytesDecoder4(), 8)],
    ["courseId", addDecoderSizePrefix2(getUtf8Decoder2(), getU32Decoder2())],
    ["creator", getAddressDecoder4()],
    ["contentTxId", fixDecoderSize4(getBytesDecoder4(), 32)],
    ["version", getU16Decoder()],
    ["lessonCount", getU8Decoder4()],
    ["difficulty", getU8Decoder4()],
    ["xpPerLesson", getU32Decoder2()],
    ["trackId", getU16Decoder()],
    ["trackLevel", getU8Decoder4()],
    ["prerequisite", getOptionDecoder(getAddressDecoder4())],
    ["creatorRewardXp", getU32Decoder2()],
    ["minCompletionsForReward", getU16Decoder()],
    ["totalCompletions", getU32Decoder2()],
    ["totalEnrollments", getU32Decoder2()],
    ["isActive", getBooleanDecoder2()],
    ["createdAt", getI64Decoder3()],
    ["updatedAt", getI64Decoder3()],
    ["reserved", fixDecoderSize4(getBytesDecoder4(), 8)],
    ["bump", getU8Decoder4()]
  ]);
}
function getCourseCodec() {
  return combineCodec4(getCourseEncoder(), getCourseDecoder());
}
function decodeCourse(encodedAccount) {
  return decodeAccount4(
    encodedAccount,
    getCourseDecoder()
  );
}
async function fetchCourse(rpc, address, config) {
  const maybeAccount = await fetchMaybeCourse(rpc, address, config);
  assertAccountExists4(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeCourse(rpc, address, config) {
  const maybeAccount = await fetchEncodedAccount4(rpc, address, config);
  return decodeCourse(maybeAccount);
}
async function fetchAllCourse(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeCourse(rpc, addresses, config);
  assertAccountsExist4(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeCourse(rpc, addresses, config) {
  const maybeAccounts = await fetchEncodedAccounts4(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) => decodeCourse(maybeAccount));
}

// src/generated/accounts/enrollment.ts
import {
  assertAccountExists as assertAccountExists5,
  assertAccountsExist as assertAccountsExist5,
  combineCodec as combineCodec5,
  decodeAccount as decodeAccount5,
  fetchEncodedAccount as fetchEncodedAccount5,
  fetchEncodedAccounts as fetchEncodedAccounts5,
  fixDecoderSize as fixDecoderSize5,
  fixEncoderSize as fixEncoderSize5,
  getAddressDecoder as getAddressDecoder5,
  getAddressEncoder as getAddressEncoder5,
  getArrayDecoder,
  getArrayEncoder,
  getBytesDecoder as getBytesDecoder5,
  getBytesEncoder as getBytesEncoder5,
  getI64Decoder as getI64Decoder4,
  getI64Encoder as getI64Encoder4,
  getOptionDecoder as getOptionDecoder2,
  getOptionEncoder as getOptionEncoder2,
  getStructDecoder as getStructDecoder5,
  getStructEncoder as getStructEncoder5,
  getU64Decoder,
  getU64Encoder,
  getU8Decoder as getU8Decoder5,
  getU8Encoder as getU8Encoder5,
  transformEncoder as transformEncoder5
} from "@solana/kit";
var ENROLLMENT_DISCRIMINATOR = new Uint8Array([
  249,
  210,
  64,
  145,
  197,
  241,
  57,
  51
]);
function getEnrollmentDiscriminatorBytes() {
  return fixEncoderSize5(getBytesEncoder5(), 8).encode(ENROLLMENT_DISCRIMINATOR);
}
function getEnrollmentEncoder() {
  return transformEncoder5(
    getStructEncoder5([
      ["discriminator", fixEncoderSize5(getBytesEncoder5(), 8)],
      ["course", getAddressEncoder5()],
      ["enrolledAt", getI64Encoder4()],
      ["completedAt", getOptionEncoder2(getI64Encoder4())],
      ["lessonFlags", getArrayEncoder(getU64Encoder(), { size: 4 })],
      ["credentialAsset", getOptionEncoder2(getAddressEncoder5())],
      ["reserved", fixEncoderSize5(getBytesEncoder5(), 4)],
      ["bump", getU8Encoder5()]
    ]),
    (value) => ({ ...value, discriminator: ENROLLMENT_DISCRIMINATOR })
  );
}
function getEnrollmentDecoder() {
  return getStructDecoder5([
    ["discriminator", fixDecoderSize5(getBytesDecoder5(), 8)],
    ["course", getAddressDecoder5()],
    ["enrolledAt", getI64Decoder4()],
    ["completedAt", getOptionDecoder2(getI64Decoder4())],
    ["lessonFlags", getArrayDecoder(getU64Decoder(), { size: 4 })],
    ["credentialAsset", getOptionDecoder2(getAddressDecoder5())],
    ["reserved", fixDecoderSize5(getBytesDecoder5(), 4)],
    ["bump", getU8Decoder5()]
  ]);
}
function getEnrollmentCodec() {
  return combineCodec5(getEnrollmentEncoder(), getEnrollmentDecoder());
}
function decodeEnrollment(encodedAccount) {
  return decodeAccount5(
    encodedAccount,
    getEnrollmentDecoder()
  );
}
async function fetchEnrollment(rpc, address, config) {
  const maybeAccount = await fetchMaybeEnrollment(rpc, address, config);
  assertAccountExists5(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeEnrollment(rpc, address, config) {
  const maybeAccount = await fetchEncodedAccount5(rpc, address, config);
  return decodeEnrollment(maybeAccount);
}
async function fetchAllEnrollment(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeEnrollment(rpc, addresses, config);
  assertAccountsExist5(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeEnrollment(rpc, addresses, config) {
  const maybeAccounts = await fetchEncodedAccounts5(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) => decodeEnrollment(maybeAccount));
}

// src/generated/accounts/minterRole.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix3,
  addEncoderSizePrefix as addEncoderSizePrefix3,
  assertAccountExists as assertAccountExists6,
  assertAccountsExist as assertAccountsExist6,
  combineCodec as combineCodec6,
  decodeAccount as decodeAccount6,
  fetchEncodedAccount as fetchEncodedAccount6,
  fetchEncodedAccounts as fetchEncodedAccounts6,
  fixDecoderSize as fixDecoderSize6,
  fixEncoderSize as fixEncoderSize6,
  getAddressDecoder as getAddressDecoder6,
  getAddressEncoder as getAddressEncoder6,
  getBooleanDecoder as getBooleanDecoder3,
  getBooleanEncoder as getBooleanEncoder3,
  getBytesDecoder as getBytesDecoder6,
  getBytesEncoder as getBytesEncoder6,
  getI64Decoder as getI64Decoder5,
  getI64Encoder as getI64Encoder5,
  getStructDecoder as getStructDecoder6,
  getStructEncoder as getStructEncoder6,
  getU32Decoder as getU32Decoder3,
  getU32Encoder as getU32Encoder3,
  getU64Decoder as getU64Decoder2,
  getU64Encoder as getU64Encoder2,
  getU8Decoder as getU8Decoder6,
  getU8Encoder as getU8Encoder6,
  getUtf8Decoder as getUtf8Decoder3,
  getUtf8Encoder as getUtf8Encoder3,
  transformEncoder as transformEncoder6
} from "@solana/kit";
var MINTER_ROLE_DISCRIMINATOR = new Uint8Array([
  21,
  246,
  6,
  133,
  142,
  211,
  33,
  193
]);
function getMinterRoleDiscriminatorBytes() {
  return fixEncoderSize6(getBytesEncoder6(), 8).encode(MINTER_ROLE_DISCRIMINATOR);
}
function getMinterRoleEncoder() {
  return transformEncoder6(
    getStructEncoder6([
      ["discriminator", fixEncoderSize6(getBytesEncoder6(), 8)],
      ["minter", getAddressEncoder6()],
      ["label", addEncoderSizePrefix3(getUtf8Encoder3(), getU32Encoder3())],
      ["maxXpPerCall", getU64Encoder2()],
      ["totalXpMinted", getU64Encoder2()],
      ["isActive", getBooleanEncoder3()],
      ["createdAt", getI64Encoder5()],
      ["reserved", fixEncoderSize6(getBytesEncoder6(), 8)],
      ["bump", getU8Encoder6()]
    ]),
    (value) => ({ ...value, discriminator: MINTER_ROLE_DISCRIMINATOR })
  );
}
function getMinterRoleDecoder() {
  return getStructDecoder6([
    ["discriminator", fixDecoderSize6(getBytesDecoder6(), 8)],
    ["minter", getAddressDecoder6()],
    ["label", addDecoderSizePrefix3(getUtf8Decoder3(), getU32Decoder3())],
    ["maxXpPerCall", getU64Decoder2()],
    ["totalXpMinted", getU64Decoder2()],
    ["isActive", getBooleanDecoder3()],
    ["createdAt", getI64Decoder5()],
    ["reserved", fixDecoderSize6(getBytesDecoder6(), 8)],
    ["bump", getU8Decoder6()]
  ]);
}
function getMinterRoleCodec() {
  return combineCodec6(getMinterRoleEncoder(), getMinterRoleDecoder());
}
function decodeMinterRole(encodedAccount) {
  return decodeAccount6(
    encodedAccount,
    getMinterRoleDecoder()
  );
}
async function fetchMinterRole(rpc, address, config) {
  const maybeAccount = await fetchMaybeMinterRole(rpc, address, config);
  assertAccountExists6(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeMinterRole(rpc, address, config) {
  const maybeAccount = await fetchEncodedAccount6(rpc, address, config);
  return decodeMinterRole(maybeAccount);
}
async function fetchAllMinterRole(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeMinterRole(rpc, addresses, config);
  assertAccountsExist6(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeMinterRole(rpc, addresses, config) {
  const maybeAccounts = await fetchEncodedAccounts6(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) => decodeMinterRole(maybeAccount));
}

// src/generated/errors/onchainAcademy.ts
import {
  isProgramError
} from "@solana/kit";

// src/generated/programs/onchainAcademy.ts
import {
  assertIsInstructionWithAccounts,
  containsBytes,
  fixEncoderSize as fixEncoderSize23,
  getBytesEncoder as getBytesEncoder23,
  SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_ACCOUNT,
  SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_INSTRUCTION,
  SOLANA_ERROR__PROGRAM_CLIENTS__UNRECOGNIZED_INSTRUCTION_TYPE,
  SolanaError as SolanaError17
} from "@solana/kit";
import {
  addSelfFetchFunctions,
  addSelfPlanAndSendFunctions
} from "@solana/program-client-core";

// src/generated/instructions/awardAchievement.ts
import {
  combineCodec as combineCodec7,
  fixDecoderSize as fixDecoderSize7,
  fixEncoderSize as fixEncoderSize7,
  getAddressEncoder as getAddressEncoder7,
  getBytesDecoder as getBytesDecoder7,
  getBytesEncoder as getBytesEncoder7,
  getProgramDerivedAddress,
  getStructDecoder as getStructDecoder7,
  getStructEncoder as getStructEncoder7,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS,
  SolanaError,
  transformEncoder as transformEncoder7
} from "@solana/kit";
import {
  getAccountMetaFactory,
  getAddressFromResolvedInstructionAccount
} from "@solana/program-client-core";
var AWARD_ACHIEVEMENT_DISCRIMINATOR = new Uint8Array([
  75,
  47,
  156,
  253,
  124,
  231,
  84,
  12
]);
function getAwardAchievementDiscriminatorBytes() {
  return fixEncoderSize7(getBytesEncoder7(), 8).encode(
    AWARD_ACHIEVEMENT_DISCRIMINATOR
  );
}
function getAwardAchievementInstructionDataEncoder() {
  return transformEncoder7(
    getStructEncoder7([["discriminator", fixEncoderSize7(getBytesEncoder7(), 8)]]),
    (value) => ({ ...value, discriminator: AWARD_ACHIEVEMENT_DISCRIMINATOR })
  );
}
function getAwardAchievementInstructionDataDecoder() {
  return getStructDecoder7([
    ["discriminator", fixDecoderSize7(getBytesDecoder7(), 8)]
  ]);
}
function getAwardAchievementInstructionDataCodec() {
  return combineCodec7(
    getAwardAchievementInstructionDataEncoder(),
    getAwardAchievementInstructionDataDecoder()
  );
}
async function getAwardAchievementInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    achievementType: { value: input.achievementType ?? null, isWritable: true },
    achievementReceipt: {
      value: input.achievementReceipt ?? null,
      isWritable: true
    },
    minterRole: { value: input.minterRole ?? null, isWritable: true },
    asset: { value: input.asset ?? null, isWritable: true },
    collection: { value: input.collection ?? null, isWritable: true },
    recipient: { value: input.recipient ?? null, isWritable: false },
    recipientTokenAccount: {
      value: input.recipientTokenAccount ?? null,
      isWritable: true
    },
    xpMint: { value: input.xpMint ?? null, isWritable: true },
    payer: { value: input.payer ?? null, isWritable: true },
    minter: { value: input.minter ?? null, isWritable: false },
    mplCoreProgram: { value: input.mplCoreProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress({
      programAddress,
      seeds: [
        getBytesEncoder7().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  if (!accounts.minterRole.value) {
    accounts.minterRole.value = await getProgramDerivedAddress({
      programAddress,
      seeds: [
        getBytesEncoder7().encode(
          new Uint8Array([109, 105, 110, 116, 101, 114])
        ),
        getAddressEncoder7().encode(
          getAddressFromResolvedInstructionAccount(
            "minter",
            accounts.minter.value
          )
        )
      ]
    });
  }
  if (!accounts.mplCoreProgram.value) {
    accounts.mplCoreProgram.value = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("achievementType", accounts.achievementType),
      getAccountMeta("achievementReceipt", accounts.achievementReceipt),
      getAccountMeta("minterRole", accounts.minterRole),
      getAccountMeta("asset", accounts.asset),
      getAccountMeta("collection", accounts.collection),
      getAccountMeta("recipient", accounts.recipient),
      getAccountMeta("recipientTokenAccount", accounts.recipientTokenAccount),
      getAccountMeta("xpMint", accounts.xpMint),
      getAccountMeta("payer", accounts.payer),
      getAccountMeta("minter", accounts.minter),
      getAccountMeta("mplCoreProgram", accounts.mplCoreProgram),
      getAccountMeta("tokenProgram", accounts.tokenProgram),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getAwardAchievementInstructionDataEncoder().encode({}),
    programAddress
  });
}
function getAwardAchievementInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    achievementType: { value: input.achievementType ?? null, isWritable: true },
    achievementReceipt: {
      value: input.achievementReceipt ?? null,
      isWritable: true
    },
    minterRole: { value: input.minterRole ?? null, isWritable: true },
    asset: { value: input.asset ?? null, isWritable: true },
    collection: { value: input.collection ?? null, isWritable: true },
    recipient: { value: input.recipient ?? null, isWritable: false },
    recipientTokenAccount: {
      value: input.recipientTokenAccount ?? null,
      isWritable: true
    },
    xpMint: { value: input.xpMint ?? null, isWritable: true },
    payer: { value: input.payer ?? null, isWritable: true },
    minter: { value: input.minter ?? null, isWritable: false },
    mplCoreProgram: { value: input.mplCoreProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.mplCoreProgram.value) {
    accounts.mplCoreProgram.value = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("achievementType", accounts.achievementType),
      getAccountMeta("achievementReceipt", accounts.achievementReceipt),
      getAccountMeta("minterRole", accounts.minterRole),
      getAccountMeta("asset", accounts.asset),
      getAccountMeta("collection", accounts.collection),
      getAccountMeta("recipient", accounts.recipient),
      getAccountMeta("recipientTokenAccount", accounts.recipientTokenAccount),
      getAccountMeta("xpMint", accounts.xpMint),
      getAccountMeta("payer", accounts.payer),
      getAccountMeta("minter", accounts.minter),
      getAccountMeta("mplCoreProgram", accounts.mplCoreProgram),
      getAccountMeta("tokenProgram", accounts.tokenProgram),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getAwardAchievementInstructionDataEncoder().encode({}),
    programAddress
  });
}
function parseAwardAchievementInstruction(instruction) {
  if (instruction.accounts.length < 14) {
    throw new SolanaError(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 14
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      achievementType: getNextAccount(),
      achievementReceipt: getNextAccount(),
      minterRole: getNextAccount(),
      asset: getNextAccount(),
      collection: getNextAccount(),
      recipient: getNextAccount(),
      recipientTokenAccount: getNextAccount(),
      xpMint: getNextAccount(),
      payer: getNextAccount(),
      minter: getNextAccount(),
      mplCoreProgram: getNextAccount(),
      tokenProgram: getNextAccount(),
      systemProgram: getNextAccount()
    },
    data: getAwardAchievementInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/closeEnrollment.ts
import {
  combineCodec as combineCodec8,
  fixDecoderSize as fixDecoderSize8,
  fixEncoderSize as fixEncoderSize8,
  getBytesDecoder as getBytesDecoder8,
  getBytesEncoder as getBytesEncoder8,
  getStructDecoder as getStructDecoder8,
  getStructEncoder as getStructEncoder8,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS2,
  SolanaError as SolanaError2,
  transformEncoder as transformEncoder8
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory2
} from "@solana/program-client-core";
var CLOSE_ENROLLMENT_DISCRIMINATOR = new Uint8Array([
  236,
  137,
  133,
  253,
  91,
  138,
  217,
  91
]);
function getCloseEnrollmentDiscriminatorBytes() {
  return fixEncoderSize8(getBytesEncoder8(), 8).encode(
    CLOSE_ENROLLMENT_DISCRIMINATOR
  );
}
function getCloseEnrollmentInstructionDataEncoder() {
  return transformEncoder8(
    getStructEncoder8([["discriminator", fixEncoderSize8(getBytesEncoder8(), 8)]]),
    (value) => ({ ...value, discriminator: CLOSE_ENROLLMENT_DISCRIMINATOR })
  );
}
function getCloseEnrollmentInstructionDataDecoder() {
  return getStructDecoder8([
    ["discriminator", fixDecoderSize8(getBytesDecoder8(), 8)]
  ]);
}
function getCloseEnrollmentInstructionDataCodec() {
  return combineCodec8(
    getCloseEnrollmentInstructionDataEncoder(),
    getCloseEnrollmentInstructionDataDecoder()
  );
}
function getCloseEnrollmentInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    course: { value: input.course ?? null, isWritable: false },
    enrollment: { value: input.enrollment ?? null, isWritable: true },
    learner: { value: input.learner ?? null, isWritable: true }
  };
  const accounts = originalAccounts;
  const getAccountMeta = getAccountMetaFactory2(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("course", accounts.course),
      getAccountMeta("enrollment", accounts.enrollment),
      getAccountMeta("learner", accounts.learner)
    ],
    data: getCloseEnrollmentInstructionDataEncoder().encode({}),
    programAddress
  });
}
function parseCloseEnrollmentInstruction(instruction) {
  if (instruction.accounts.length < 3) {
    throw new SolanaError2(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS2,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 3
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      course: getNextAccount(),
      enrollment: getNextAccount(),
      learner: getNextAccount()
    },
    data: getCloseEnrollmentInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/completeLesson.ts
import {
  combineCodec as combineCodec9,
  fixDecoderSize as fixDecoderSize9,
  fixEncoderSize as fixEncoderSize9,
  getBytesDecoder as getBytesDecoder9,
  getBytesEncoder as getBytesEncoder9,
  getProgramDerivedAddress as getProgramDerivedAddress2,
  getStructDecoder as getStructDecoder9,
  getStructEncoder as getStructEncoder9,
  getU8Decoder as getU8Decoder7,
  getU8Encoder as getU8Encoder7,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS3,
  SolanaError as SolanaError3,
  transformEncoder as transformEncoder9
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory3
} from "@solana/program-client-core";
var COMPLETE_LESSON_DISCRIMINATOR = new Uint8Array([
  77,
  217,
  53,
  132,
  204,
  150,
  169,
  58
]);
function getCompleteLessonDiscriminatorBytes() {
  return fixEncoderSize9(getBytesEncoder9(), 8).encode(
    COMPLETE_LESSON_DISCRIMINATOR
  );
}
function getCompleteLessonInstructionDataEncoder() {
  return transformEncoder9(
    getStructEncoder9([
      ["discriminator", fixEncoderSize9(getBytesEncoder9(), 8)],
      ["lessonIndex", getU8Encoder7()]
    ]),
    (value) => ({ ...value, discriminator: COMPLETE_LESSON_DISCRIMINATOR })
  );
}
function getCompleteLessonInstructionDataDecoder() {
  return getStructDecoder9([
    ["discriminator", fixDecoderSize9(getBytesDecoder9(), 8)],
    ["lessonIndex", getU8Decoder7()]
  ]);
}
function getCompleteLessonInstructionDataCodec() {
  return combineCodec9(
    getCompleteLessonInstructionDataEncoder(),
    getCompleteLessonInstructionDataDecoder()
  );
}
async function getCompleteLessonInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    course: { value: input.course ?? null, isWritable: false },
    enrollment: { value: input.enrollment ?? null, isWritable: true },
    learner: { value: input.learner ?? null, isWritable: false },
    learnerTokenAccount: {
      value: input.learnerTokenAccount ?? null,
      isWritable: true
    },
    xpMint: { value: input.xpMint ?? null, isWritable: true },
    backendSigner: { value: input.backendSigner ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress2({
      programAddress,
      seeds: [
        getBytesEncoder9().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory3(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("course", accounts.course),
      getAccountMeta("enrollment", accounts.enrollment),
      getAccountMeta("learner", accounts.learner),
      getAccountMeta("learnerTokenAccount", accounts.learnerTokenAccount),
      getAccountMeta("xpMint", accounts.xpMint),
      getAccountMeta("backendSigner", accounts.backendSigner),
      getAccountMeta("tokenProgram", accounts.tokenProgram)
    ],
    data: getCompleteLessonInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getCompleteLessonInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    course: { value: input.course ?? null, isWritable: false },
    enrollment: { value: input.enrollment ?? null, isWritable: true },
    learner: { value: input.learner ?? null, isWritable: false },
    learnerTokenAccount: {
      value: input.learnerTokenAccount ?? null,
      isWritable: true
    },
    xpMint: { value: input.xpMint ?? null, isWritable: true },
    backendSigner: { value: input.backendSigner ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory3(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("course", accounts.course),
      getAccountMeta("enrollment", accounts.enrollment),
      getAccountMeta("learner", accounts.learner),
      getAccountMeta("learnerTokenAccount", accounts.learnerTokenAccount),
      getAccountMeta("xpMint", accounts.xpMint),
      getAccountMeta("backendSigner", accounts.backendSigner),
      getAccountMeta("tokenProgram", accounts.tokenProgram)
    ],
    data: getCompleteLessonInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseCompleteLessonInstruction(instruction) {
  if (instruction.accounts.length < 8) {
    throw new SolanaError3(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS3,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 8
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      course: getNextAccount(),
      enrollment: getNextAccount(),
      learner: getNextAccount(),
      learnerTokenAccount: getNextAccount(),
      xpMint: getNextAccount(),
      backendSigner: getNextAccount(),
      tokenProgram: getNextAccount()
    },
    data: getCompleteLessonInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/createAchievementType.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix4,
  addEncoderSizePrefix as addEncoderSizePrefix4,
  combineCodec as combineCodec10,
  fixDecoderSize as fixDecoderSize10,
  fixEncoderSize as fixEncoderSize10,
  getBytesDecoder as getBytesDecoder10,
  getBytesEncoder as getBytesEncoder10,
  getProgramDerivedAddress as getProgramDerivedAddress3,
  getStructDecoder as getStructDecoder10,
  getStructEncoder as getStructEncoder10,
  getU32Decoder as getU32Decoder4,
  getU32Encoder as getU32Encoder4,
  getUtf8Decoder as getUtf8Decoder4,
  getUtf8Encoder as getUtf8Encoder4,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS4,
  SolanaError as SolanaError4,
  transformEncoder as transformEncoder10
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory4
} from "@solana/program-client-core";
var CREATE_ACHIEVEMENT_TYPE_DISCRIMINATOR = new Uint8Array([
  231,
  38,
  39,
  228,
  103,
  4,
  229,
  19
]);
function getCreateAchievementTypeDiscriminatorBytes() {
  return fixEncoderSize10(getBytesEncoder10(), 8).encode(
    CREATE_ACHIEVEMENT_TYPE_DISCRIMINATOR
  );
}
function getCreateAchievementTypeInstructionDataEncoder() {
  return transformEncoder10(
    getStructEncoder10([
      ["discriminator", fixEncoderSize10(getBytesEncoder10(), 8)],
      [
        "achievementId",
        addEncoderSizePrefix4(getUtf8Encoder4(), getU32Encoder4())
      ],
      ["name", addEncoderSizePrefix4(getUtf8Encoder4(), getU32Encoder4())],
      ["metadataUri", addEncoderSizePrefix4(getUtf8Encoder4(), getU32Encoder4())],
      ["maxSupply", getU32Encoder4()],
      ["xpReward", getU32Encoder4()]
    ]),
    (value) => ({
      ...value,
      discriminator: CREATE_ACHIEVEMENT_TYPE_DISCRIMINATOR
    })
  );
}
function getCreateAchievementTypeInstructionDataDecoder() {
  return getStructDecoder10([
    ["discriminator", fixDecoderSize10(getBytesDecoder10(), 8)],
    ["achievementId", addDecoderSizePrefix4(getUtf8Decoder4(), getU32Decoder4())],
    ["name", addDecoderSizePrefix4(getUtf8Decoder4(), getU32Decoder4())],
    ["metadataUri", addDecoderSizePrefix4(getUtf8Decoder4(), getU32Decoder4())],
    ["maxSupply", getU32Decoder4()],
    ["xpReward", getU32Decoder4()]
  ]);
}
function getCreateAchievementTypeInstructionDataCodec() {
  return combineCodec10(
    getCreateAchievementTypeInstructionDataEncoder(),
    getCreateAchievementTypeInstructionDataDecoder()
  );
}
async function getCreateAchievementTypeInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    achievementType: { value: input.achievementType ?? null, isWritable: true },
    collection: { value: input.collection ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false },
    payer: { value: input.payer ?? null, isWritable: true },
    mplCoreProgram: { value: input.mplCoreProgram ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress3({
      programAddress,
      seeds: [
        getBytesEncoder10().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  if (!accounts.mplCoreProgram.value) {
    accounts.mplCoreProgram.value = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory4(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("achievementType", accounts.achievementType),
      getAccountMeta("collection", accounts.collection),
      getAccountMeta("authority", accounts.authority),
      getAccountMeta("payer", accounts.payer),
      getAccountMeta("mplCoreProgram", accounts.mplCoreProgram),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getCreateAchievementTypeInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getCreateAchievementTypeInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    achievementType: { value: input.achievementType ?? null, isWritable: true },
    collection: { value: input.collection ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false },
    payer: { value: input.payer ?? null, isWritable: true },
    mplCoreProgram: { value: input.mplCoreProgram ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.mplCoreProgram.value) {
    accounts.mplCoreProgram.value = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory4(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("achievementType", accounts.achievementType),
      getAccountMeta("collection", accounts.collection),
      getAccountMeta("authority", accounts.authority),
      getAccountMeta("payer", accounts.payer),
      getAccountMeta("mplCoreProgram", accounts.mplCoreProgram),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getCreateAchievementTypeInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseCreateAchievementTypeInstruction(instruction) {
  if (instruction.accounts.length < 7) {
    throw new SolanaError4(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS4,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 7
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      achievementType: getNextAccount(),
      collection: getNextAccount(),
      authority: getNextAccount(),
      payer: getNextAccount(),
      mplCoreProgram: getNextAccount(),
      systemProgram: getNextAccount()
    },
    data: getCreateAchievementTypeInstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/createCourse.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix5,
  addEncoderSizePrefix as addEncoderSizePrefix5,
  combineCodec as combineCodec11,
  fixDecoderSize as fixDecoderSize11,
  fixEncoderSize as fixEncoderSize11,
  getAddressDecoder as getAddressDecoder7,
  getAddressEncoder as getAddressEncoder8,
  getBytesDecoder as getBytesDecoder11,
  getBytesEncoder as getBytesEncoder11,
  getOptionDecoder as getOptionDecoder3,
  getOptionEncoder as getOptionEncoder3,
  getProgramDerivedAddress as getProgramDerivedAddress4,
  getStructDecoder as getStructDecoder11,
  getStructEncoder as getStructEncoder11,
  getU16Decoder as getU16Decoder2,
  getU16Encoder as getU16Encoder2,
  getU32Decoder as getU32Decoder5,
  getU32Encoder as getU32Encoder5,
  getU8Decoder as getU8Decoder8,
  getU8Encoder as getU8Encoder8,
  getUtf8Decoder as getUtf8Decoder5,
  getUtf8Encoder as getUtf8Encoder5,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS5,
  SolanaError as SolanaError5,
  transformEncoder as transformEncoder11
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory5
} from "@solana/program-client-core";
var CREATE_COURSE_DISCRIMINATOR = new Uint8Array([
  120,
  121,
  154,
  164,
  107,
  180,
  167,
  241
]);
function getCreateCourseDiscriminatorBytes() {
  return fixEncoderSize11(getBytesEncoder11(), 8).encode(
    CREATE_COURSE_DISCRIMINATOR
  );
}
function getCreateCourseInstructionDataEncoder() {
  return transformEncoder11(
    getStructEncoder11([
      ["discriminator", fixEncoderSize11(getBytesEncoder11(), 8)],
      ["courseId", addEncoderSizePrefix5(getUtf8Encoder5(), getU32Encoder5())],
      ["creator", getAddressEncoder8()],
      ["contentTxId", fixEncoderSize11(getBytesEncoder11(), 32)],
      ["lessonCount", getU8Encoder8()],
      ["difficulty", getU8Encoder8()],
      ["xpPerLesson", getU32Encoder5()],
      ["trackId", getU16Encoder2()],
      ["trackLevel", getU8Encoder8()],
      ["prerequisite", getOptionEncoder3(getAddressEncoder8())],
      ["creatorRewardXp", getU32Encoder5()],
      ["minCompletionsForReward", getU16Encoder2()]
    ]),
    (value) => ({ ...value, discriminator: CREATE_COURSE_DISCRIMINATOR })
  );
}
function getCreateCourseInstructionDataDecoder() {
  return getStructDecoder11([
    ["discriminator", fixDecoderSize11(getBytesDecoder11(), 8)],
    ["courseId", addDecoderSizePrefix5(getUtf8Decoder5(), getU32Decoder5())],
    ["creator", getAddressDecoder7()],
    ["contentTxId", fixDecoderSize11(getBytesDecoder11(), 32)],
    ["lessonCount", getU8Decoder8()],
    ["difficulty", getU8Decoder8()],
    ["xpPerLesson", getU32Decoder5()],
    ["trackId", getU16Decoder2()],
    ["trackLevel", getU8Decoder8()],
    ["prerequisite", getOptionDecoder3(getAddressDecoder7())],
    ["creatorRewardXp", getU32Decoder5()],
    ["minCompletionsForReward", getU16Decoder2()]
  ]);
}
function getCreateCourseInstructionDataCodec() {
  return combineCodec11(
    getCreateCourseInstructionDataEncoder(),
    getCreateCourseInstructionDataDecoder()
  );
}
async function getCreateCourseInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    course: { value: input.course ?? null, isWritable: true },
    config: { value: input.config ?? null, isWritable: false },
    authority: { value: input.authority ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress4({
      programAddress,
      seeds: [
        getBytesEncoder11().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory5(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("course", accounts.course),
      getAccountMeta("config", accounts.config),
      getAccountMeta("authority", accounts.authority),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getCreateCourseInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getCreateCourseInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    course: { value: input.course ?? null, isWritable: true },
    config: { value: input.config ?? null, isWritable: false },
    authority: { value: input.authority ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory5(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("course", accounts.course),
      getAccountMeta("config", accounts.config),
      getAccountMeta("authority", accounts.authority),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getCreateCourseInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseCreateCourseInstruction(instruction) {
  if (instruction.accounts.length < 4) {
    throw new SolanaError5(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS5,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 4
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      course: getNextAccount(),
      config: getNextAccount(),
      authority: getNextAccount(),
      systemProgram: getNextAccount()
    },
    data: getCreateCourseInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/deactivateAchievementType.ts
import {
  combineCodec as combineCodec12,
  fixDecoderSize as fixDecoderSize12,
  fixEncoderSize as fixEncoderSize12,
  getBytesDecoder as getBytesDecoder12,
  getBytesEncoder as getBytesEncoder12,
  getProgramDerivedAddress as getProgramDerivedAddress5,
  getStructDecoder as getStructDecoder12,
  getStructEncoder as getStructEncoder12,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS6,
  SolanaError as SolanaError6,
  transformEncoder as transformEncoder12
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory6
} from "@solana/program-client-core";
var DEACTIVATE_ACHIEVEMENT_TYPE_DISCRIMINATOR = new Uint8Array([
  185,
  21,
  222,
  243,
  192,
  118,
  71,
  191
]);
function getDeactivateAchievementTypeDiscriminatorBytes() {
  return fixEncoderSize12(getBytesEncoder12(), 8).encode(
    DEACTIVATE_ACHIEVEMENT_TYPE_DISCRIMINATOR
  );
}
function getDeactivateAchievementTypeInstructionDataEncoder() {
  return transformEncoder12(
    getStructEncoder12([["discriminator", fixEncoderSize12(getBytesEncoder12(), 8)]]),
    (value) => ({
      ...value,
      discriminator: DEACTIVATE_ACHIEVEMENT_TYPE_DISCRIMINATOR
    })
  );
}
function getDeactivateAchievementTypeInstructionDataDecoder() {
  return getStructDecoder12([
    ["discriminator", fixDecoderSize12(getBytesDecoder12(), 8)]
  ]);
}
function getDeactivateAchievementTypeInstructionDataCodec() {
  return combineCodec12(
    getDeactivateAchievementTypeInstructionDataEncoder(),
    getDeactivateAchievementTypeInstructionDataDecoder()
  );
}
async function getDeactivateAchievementTypeInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    achievementType: { value: input.achievementType ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress5({
      programAddress,
      seeds: [
        getBytesEncoder12().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  const getAccountMeta = getAccountMetaFactory6(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("achievementType", accounts.achievementType),
      getAccountMeta("authority", accounts.authority)
    ],
    data: getDeactivateAchievementTypeInstructionDataEncoder().encode({}),
    programAddress
  });
}
function getDeactivateAchievementTypeInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    achievementType: { value: input.achievementType ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const getAccountMeta = getAccountMetaFactory6(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("achievementType", accounts.achievementType),
      getAccountMeta("authority", accounts.authority)
    ],
    data: getDeactivateAchievementTypeInstructionDataEncoder().encode({}),
    programAddress
  });
}
function parseDeactivateAchievementTypeInstruction(instruction) {
  if (instruction.accounts.length < 3) {
    throw new SolanaError6(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS6,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 3
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      achievementType: getNextAccount(),
      authority: getNextAccount()
    },
    data: getDeactivateAchievementTypeInstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/enroll.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix6,
  addEncoderSizePrefix as addEncoderSizePrefix6,
  combineCodec as combineCodec13,
  fixDecoderSize as fixDecoderSize13,
  fixEncoderSize as fixEncoderSize13,
  getAddressEncoder as getAddressEncoder9,
  getBytesDecoder as getBytesDecoder13,
  getBytesEncoder as getBytesEncoder13,
  getProgramDerivedAddress as getProgramDerivedAddress6,
  getStructDecoder as getStructDecoder13,
  getStructEncoder as getStructEncoder13,
  getU32Decoder as getU32Decoder6,
  getU32Encoder as getU32Encoder6,
  getUtf8Decoder as getUtf8Decoder6,
  getUtf8Encoder as getUtf8Encoder6,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS7,
  SolanaError as SolanaError7,
  transformEncoder as transformEncoder13
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory7,
  getAddressFromResolvedInstructionAccount as getAddressFromResolvedInstructionAccount2,
  getNonNullResolvedInstructionInput
} from "@solana/program-client-core";
var ENROLL_DISCRIMINATOR = new Uint8Array([
  58,
  12,
  36,
  3,
  142,
  28,
  1,
  43
]);
function getEnrollDiscriminatorBytes() {
  return fixEncoderSize13(getBytesEncoder13(), 8).encode(ENROLL_DISCRIMINATOR);
}
function getEnrollInstructionDataEncoder() {
  return transformEncoder13(
    getStructEncoder13([
      ["discriminator", fixEncoderSize13(getBytesEncoder13(), 8)],
      ["courseId", addEncoderSizePrefix6(getUtf8Encoder6(), getU32Encoder6())]
    ]),
    (value) => ({ ...value, discriminator: ENROLL_DISCRIMINATOR })
  );
}
function getEnrollInstructionDataDecoder() {
  return getStructDecoder13([
    ["discriminator", fixDecoderSize13(getBytesDecoder13(), 8)],
    ["courseId", addDecoderSizePrefix6(getUtf8Decoder6(), getU32Decoder6())]
  ]);
}
function getEnrollInstructionDataCodec() {
  return combineCodec13(
    getEnrollInstructionDataEncoder(),
    getEnrollInstructionDataDecoder()
  );
}
async function getEnrollInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    course: { value: input.course ?? null, isWritable: true },
    enrollment: { value: input.enrollment ?? null, isWritable: true },
    learner: { value: input.learner ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.course.value) {
    accounts.course.value = await getProgramDerivedAddress6({
      programAddress,
      seeds: [
        getBytesEncoder13().encode(new Uint8Array([99, 111, 117, 114, 115, 101])),
        getUtf8Encoder6().encode(
          getNonNullResolvedInstructionInput("courseId", args.courseId)
        )
      ]
    });
  }
  if (!accounts.enrollment.value) {
    accounts.enrollment.value = await getProgramDerivedAddress6({
      programAddress,
      seeds: [
        getBytesEncoder13().encode(
          new Uint8Array([101, 110, 114, 111, 108, 108, 109, 101, 110, 116])
        ),
        getUtf8Encoder6().encode(
          getNonNullResolvedInstructionInput("courseId", args.courseId)
        ),
        getAddressEncoder9().encode(
          getAddressFromResolvedInstructionAccount2(
            "learner",
            accounts.learner.value
          )
        )
      ]
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory7(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("course", accounts.course),
      getAccountMeta("enrollment", accounts.enrollment),
      getAccountMeta("learner", accounts.learner),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getEnrollInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getEnrollInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    course: { value: input.course ?? null, isWritable: true },
    enrollment: { value: input.enrollment ?? null, isWritable: true },
    learner: { value: input.learner ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory7(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("course", accounts.course),
      getAccountMeta("enrollment", accounts.enrollment),
      getAccountMeta("learner", accounts.learner),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getEnrollInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseEnrollInstruction(instruction) {
  if (instruction.accounts.length < 4) {
    throw new SolanaError7(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS7,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 4
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      course: getNextAccount(),
      enrollment: getNextAccount(),
      learner: getNextAccount(),
      systemProgram: getNextAccount()
    },
    data: getEnrollInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/finalizeCourse.ts
import {
  combineCodec as combineCodec14,
  fixDecoderSize as fixDecoderSize14,
  fixEncoderSize as fixEncoderSize14,
  getBytesDecoder as getBytesDecoder14,
  getBytesEncoder as getBytesEncoder14,
  getProgramDerivedAddress as getProgramDerivedAddress7,
  getStructDecoder as getStructDecoder14,
  getStructEncoder as getStructEncoder14,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS8,
  SolanaError as SolanaError8,
  transformEncoder as transformEncoder14
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory8
} from "@solana/program-client-core";
var FINALIZE_COURSE_DISCRIMINATOR = new Uint8Array([
  68,
  189,
  122,
  239,
  39,
  121,
  16,
  218
]);
function getFinalizeCourseDiscriminatorBytes() {
  return fixEncoderSize14(getBytesEncoder14(), 8).encode(
    FINALIZE_COURSE_DISCRIMINATOR
  );
}
function getFinalizeCourseInstructionDataEncoder() {
  return transformEncoder14(
    getStructEncoder14([["discriminator", fixEncoderSize14(getBytesEncoder14(), 8)]]),
    (value) => ({ ...value, discriminator: FINALIZE_COURSE_DISCRIMINATOR })
  );
}
function getFinalizeCourseInstructionDataDecoder() {
  return getStructDecoder14([
    ["discriminator", fixDecoderSize14(getBytesDecoder14(), 8)]
  ]);
}
function getFinalizeCourseInstructionDataCodec() {
  return combineCodec14(
    getFinalizeCourseInstructionDataEncoder(),
    getFinalizeCourseInstructionDataDecoder()
  );
}
async function getFinalizeCourseInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    course: { value: input.course ?? null, isWritable: true },
    enrollment: { value: input.enrollment ?? null, isWritable: true },
    learner: { value: input.learner ?? null, isWritable: false },
    learnerTokenAccount: {
      value: input.learnerTokenAccount ?? null,
      isWritable: true
    },
    creatorTokenAccount: {
      value: input.creatorTokenAccount ?? null,
      isWritable: true
    },
    creator: { value: input.creator ?? null, isWritable: false },
    xpMint: { value: input.xpMint ?? null, isWritable: true },
    backendSigner: { value: input.backendSigner ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress7({
      programAddress,
      seeds: [
        getBytesEncoder14().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory8(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("course", accounts.course),
      getAccountMeta("enrollment", accounts.enrollment),
      getAccountMeta("learner", accounts.learner),
      getAccountMeta("learnerTokenAccount", accounts.learnerTokenAccount),
      getAccountMeta("creatorTokenAccount", accounts.creatorTokenAccount),
      getAccountMeta("creator", accounts.creator),
      getAccountMeta("xpMint", accounts.xpMint),
      getAccountMeta("backendSigner", accounts.backendSigner),
      getAccountMeta("tokenProgram", accounts.tokenProgram)
    ],
    data: getFinalizeCourseInstructionDataEncoder().encode({}),
    programAddress
  });
}
function getFinalizeCourseInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    course: { value: input.course ?? null, isWritable: true },
    enrollment: { value: input.enrollment ?? null, isWritable: true },
    learner: { value: input.learner ?? null, isWritable: false },
    learnerTokenAccount: {
      value: input.learnerTokenAccount ?? null,
      isWritable: true
    },
    creatorTokenAccount: {
      value: input.creatorTokenAccount ?? null,
      isWritable: true
    },
    creator: { value: input.creator ?? null, isWritable: false },
    xpMint: { value: input.xpMint ?? null, isWritable: true },
    backendSigner: { value: input.backendSigner ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory8(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("course", accounts.course),
      getAccountMeta("enrollment", accounts.enrollment),
      getAccountMeta("learner", accounts.learner),
      getAccountMeta("learnerTokenAccount", accounts.learnerTokenAccount),
      getAccountMeta("creatorTokenAccount", accounts.creatorTokenAccount),
      getAccountMeta("creator", accounts.creator),
      getAccountMeta("xpMint", accounts.xpMint),
      getAccountMeta("backendSigner", accounts.backendSigner),
      getAccountMeta("tokenProgram", accounts.tokenProgram)
    ],
    data: getFinalizeCourseInstructionDataEncoder().encode({}),
    programAddress
  });
}
function parseFinalizeCourseInstruction(instruction) {
  if (instruction.accounts.length < 10) {
    throw new SolanaError8(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS8,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 10
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      course: getNextAccount(),
      enrollment: getNextAccount(),
      learner: getNextAccount(),
      learnerTokenAccount: getNextAccount(),
      creatorTokenAccount: getNextAccount(),
      creator: getNextAccount(),
      xpMint: getNextAccount(),
      backendSigner: getNextAccount(),
      tokenProgram: getNextAccount()
    },
    data: getFinalizeCourseInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/initialize.ts
import {
  combineCodec as combineCodec15,
  fixDecoderSize as fixDecoderSize15,
  fixEncoderSize as fixEncoderSize15,
  getAddressEncoder as getAddressEncoder10,
  getBytesDecoder as getBytesDecoder15,
  getBytesEncoder as getBytesEncoder15,
  getProgramDerivedAddress as getProgramDerivedAddress8,
  getStructDecoder as getStructDecoder15,
  getStructEncoder as getStructEncoder15,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS9,
  SolanaError as SolanaError9,
  transformEncoder as transformEncoder15
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory9,
  getAddressFromResolvedInstructionAccount as getAddressFromResolvedInstructionAccount3
} from "@solana/program-client-core";
var INITIALIZE_DISCRIMINATOR = new Uint8Array([
  175,
  175,
  109,
  31,
  13,
  152,
  155,
  237
]);
function getInitializeDiscriminatorBytes() {
  return fixEncoderSize15(getBytesEncoder15(), 8).encode(INITIALIZE_DISCRIMINATOR);
}
function getInitializeInstructionDataEncoder() {
  return transformEncoder15(
    getStructEncoder15([["discriminator", fixEncoderSize15(getBytesEncoder15(), 8)]]),
    (value) => ({ ...value, discriminator: INITIALIZE_DISCRIMINATOR })
  );
}
function getInitializeInstructionDataDecoder() {
  return getStructDecoder15([
    ["discriminator", fixDecoderSize15(getBytesDecoder15(), 8)]
  ]);
}
function getInitializeInstructionDataCodec() {
  return combineCodec15(
    getInitializeInstructionDataEncoder(),
    getInitializeInstructionDataDecoder()
  );
}
async function getInitializeInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: true },
    xpMint: { value: input.xpMint ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: true },
    backendMinterRole: {
      value: input.backendMinterRole ?? null,
      isWritable: true
    },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress8({
      programAddress,
      seeds: [
        getBytesEncoder15().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  if (!accounts.backendMinterRole.value) {
    accounts.backendMinterRole.value = await getProgramDerivedAddress8({
      programAddress,
      seeds: [
        getBytesEncoder15().encode(
          new Uint8Array([109, 105, 110, 116, 101, 114])
        ),
        getAddressEncoder10().encode(
          getAddressFromResolvedInstructionAccount3(
            "authority",
            accounts.authority.value
          )
        )
      ]
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory9(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("xpMint", accounts.xpMint),
      getAccountMeta("authority", accounts.authority),
      getAccountMeta("backendMinterRole", accounts.backendMinterRole),
      getAccountMeta("systemProgram", accounts.systemProgram),
      getAccountMeta("tokenProgram", accounts.tokenProgram)
    ],
    data: getInitializeInstructionDataEncoder().encode({}),
    programAddress
  });
}
function getInitializeInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: true },
    xpMint: { value: input.xpMint ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: true },
    backendMinterRole: {
      value: input.backendMinterRole ?? null,
      isWritable: true
    },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory9(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("xpMint", accounts.xpMint),
      getAccountMeta("authority", accounts.authority),
      getAccountMeta("backendMinterRole", accounts.backendMinterRole),
      getAccountMeta("systemProgram", accounts.systemProgram),
      getAccountMeta("tokenProgram", accounts.tokenProgram)
    ],
    data: getInitializeInstructionDataEncoder().encode({}),
    programAddress
  });
}
function parseInitializeInstruction(instruction) {
  if (instruction.accounts.length < 6) {
    throw new SolanaError9(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS9,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 6
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      xpMint: getNextAccount(),
      authority: getNextAccount(),
      backendMinterRole: getNextAccount(),
      systemProgram: getNextAccount(),
      tokenProgram: getNextAccount()
    },
    data: getInitializeInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/issueCredential.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix7,
  addEncoderSizePrefix as addEncoderSizePrefix7,
  combineCodec as combineCodec16,
  fixDecoderSize as fixDecoderSize16,
  fixEncoderSize as fixEncoderSize16,
  getBytesDecoder as getBytesDecoder16,
  getBytesEncoder as getBytesEncoder16,
  getProgramDerivedAddress as getProgramDerivedAddress9,
  getStructDecoder as getStructDecoder16,
  getStructEncoder as getStructEncoder16,
  getU32Decoder as getU32Decoder7,
  getU32Encoder as getU32Encoder7,
  getU64Decoder as getU64Decoder3,
  getU64Encoder as getU64Encoder3,
  getUtf8Decoder as getUtf8Decoder7,
  getUtf8Encoder as getUtf8Encoder7,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS10,
  SolanaError as SolanaError10,
  transformEncoder as transformEncoder16
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory10
} from "@solana/program-client-core";
var ISSUE_CREDENTIAL_DISCRIMINATOR = new Uint8Array([
  255,
  193,
  171,
  224,
  68,
  171,
  194,
  87
]);
function getIssueCredentialDiscriminatorBytes() {
  return fixEncoderSize16(getBytesEncoder16(), 8).encode(
    ISSUE_CREDENTIAL_DISCRIMINATOR
  );
}
function getIssueCredentialInstructionDataEncoder() {
  return transformEncoder16(
    getStructEncoder16([
      ["discriminator", fixEncoderSize16(getBytesEncoder16(), 8)],
      [
        "credentialName",
        addEncoderSizePrefix7(getUtf8Encoder7(), getU32Encoder7())
      ],
      ["metadataUri", addEncoderSizePrefix7(getUtf8Encoder7(), getU32Encoder7())],
      ["coursesCompleted", getU32Encoder7()],
      ["totalXp", getU64Encoder3()]
    ]),
    (value) => ({ ...value, discriminator: ISSUE_CREDENTIAL_DISCRIMINATOR })
  );
}
function getIssueCredentialInstructionDataDecoder() {
  return getStructDecoder16([
    ["discriminator", fixDecoderSize16(getBytesDecoder16(), 8)],
    ["credentialName", addDecoderSizePrefix7(getUtf8Decoder7(), getU32Decoder7())],
    ["metadataUri", addDecoderSizePrefix7(getUtf8Decoder7(), getU32Decoder7())],
    ["coursesCompleted", getU32Decoder7()],
    ["totalXp", getU64Decoder3()]
  ]);
}
function getIssueCredentialInstructionDataCodec() {
  return combineCodec16(
    getIssueCredentialInstructionDataEncoder(),
    getIssueCredentialInstructionDataDecoder()
  );
}
async function getIssueCredentialInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    course: { value: input.course ?? null, isWritable: false },
    enrollment: { value: input.enrollment ?? null, isWritable: true },
    learner: { value: input.learner ?? null, isWritable: false },
    credentialAsset: { value: input.credentialAsset ?? null, isWritable: true },
    trackCollection: { value: input.trackCollection ?? null, isWritable: true },
    payer: { value: input.payer ?? null, isWritable: true },
    backendSigner: { value: input.backendSigner ?? null, isWritable: false },
    mplCoreProgram: { value: input.mplCoreProgram ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress9({
      programAddress,
      seeds: [
        getBytesEncoder16().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  if (!accounts.mplCoreProgram.value) {
    accounts.mplCoreProgram.value = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory10(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("course", accounts.course),
      getAccountMeta("enrollment", accounts.enrollment),
      getAccountMeta("learner", accounts.learner),
      getAccountMeta("credentialAsset", accounts.credentialAsset),
      getAccountMeta("trackCollection", accounts.trackCollection),
      getAccountMeta("payer", accounts.payer),
      getAccountMeta("backendSigner", accounts.backendSigner),
      getAccountMeta("mplCoreProgram", accounts.mplCoreProgram),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getIssueCredentialInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getIssueCredentialInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    course: { value: input.course ?? null, isWritable: false },
    enrollment: { value: input.enrollment ?? null, isWritable: true },
    learner: { value: input.learner ?? null, isWritable: false },
    credentialAsset: { value: input.credentialAsset ?? null, isWritable: true },
    trackCollection: { value: input.trackCollection ?? null, isWritable: true },
    payer: { value: input.payer ?? null, isWritable: true },
    backendSigner: { value: input.backendSigner ?? null, isWritable: false },
    mplCoreProgram: { value: input.mplCoreProgram ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.mplCoreProgram.value) {
    accounts.mplCoreProgram.value = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory10(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("course", accounts.course),
      getAccountMeta("enrollment", accounts.enrollment),
      getAccountMeta("learner", accounts.learner),
      getAccountMeta("credentialAsset", accounts.credentialAsset),
      getAccountMeta("trackCollection", accounts.trackCollection),
      getAccountMeta("payer", accounts.payer),
      getAccountMeta("backendSigner", accounts.backendSigner),
      getAccountMeta("mplCoreProgram", accounts.mplCoreProgram),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getIssueCredentialInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseIssueCredentialInstruction(instruction) {
  if (instruction.accounts.length < 10) {
    throw new SolanaError10(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS10,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 10
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      course: getNextAccount(),
      enrollment: getNextAccount(),
      learner: getNextAccount(),
      credentialAsset: getNextAccount(),
      trackCollection: getNextAccount(),
      payer: getNextAccount(),
      backendSigner: getNextAccount(),
      mplCoreProgram: getNextAccount(),
      systemProgram: getNextAccount()
    },
    data: getIssueCredentialInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/registerMinter.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix8,
  addEncoderSizePrefix as addEncoderSizePrefix8,
  combineCodec as combineCodec17,
  fixDecoderSize as fixDecoderSize17,
  fixEncoderSize as fixEncoderSize17,
  getAddressDecoder as getAddressDecoder8,
  getAddressEncoder as getAddressEncoder11,
  getBytesDecoder as getBytesDecoder17,
  getBytesEncoder as getBytesEncoder17,
  getProgramDerivedAddress as getProgramDerivedAddress10,
  getStructDecoder as getStructDecoder17,
  getStructEncoder as getStructEncoder17,
  getU32Decoder as getU32Decoder8,
  getU32Encoder as getU32Encoder8,
  getU64Decoder as getU64Decoder4,
  getU64Encoder as getU64Encoder4,
  getUtf8Decoder as getUtf8Decoder8,
  getUtf8Encoder as getUtf8Encoder8,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS11,
  SolanaError as SolanaError11,
  transformEncoder as transformEncoder17
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory11
} from "@solana/program-client-core";
var REGISTER_MINTER_DISCRIMINATOR = new Uint8Array([
  58,
  224,
  74,
  142,
  170,
  95,
  116,
  191
]);
function getRegisterMinterDiscriminatorBytes() {
  return fixEncoderSize17(getBytesEncoder17(), 8).encode(
    REGISTER_MINTER_DISCRIMINATOR
  );
}
function getRegisterMinterInstructionDataEncoder() {
  return transformEncoder17(
    getStructEncoder17([
      ["discriminator", fixEncoderSize17(getBytesEncoder17(), 8)],
      ["minter", getAddressEncoder11()],
      ["label", addEncoderSizePrefix8(getUtf8Encoder8(), getU32Encoder8())],
      ["maxXpPerCall", getU64Encoder4()]
    ]),
    (value) => ({ ...value, discriminator: REGISTER_MINTER_DISCRIMINATOR })
  );
}
function getRegisterMinterInstructionDataDecoder() {
  return getStructDecoder17([
    ["discriminator", fixDecoderSize17(getBytesDecoder17(), 8)],
    ["minter", getAddressDecoder8()],
    ["label", addDecoderSizePrefix8(getUtf8Decoder8(), getU32Decoder8())],
    ["maxXpPerCall", getU64Decoder4()]
  ]);
}
function getRegisterMinterInstructionDataCodec() {
  return combineCodec17(
    getRegisterMinterInstructionDataEncoder(),
    getRegisterMinterInstructionDataDecoder()
  );
}
async function getRegisterMinterInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    minterRole: { value: input.minterRole ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: true },
    payer: { value: input.payer ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress10({
      programAddress,
      seeds: [
        getBytesEncoder17().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory11(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("minterRole", accounts.minterRole),
      getAccountMeta("authority", accounts.authority),
      getAccountMeta("payer", accounts.payer),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getRegisterMinterInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getRegisterMinterInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    minterRole: { value: input.minterRole ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: true },
    payer: { value: input.payer ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory11(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("minterRole", accounts.minterRole),
      getAccountMeta("authority", accounts.authority),
      getAccountMeta("payer", accounts.payer),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getRegisterMinterInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseRegisterMinterInstruction(instruction) {
  if (instruction.accounts.length < 5) {
    throw new SolanaError11(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS11,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 5
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      minterRole: getNextAccount(),
      authority: getNextAccount(),
      payer: getNextAccount(),
      systemProgram: getNextAccount()
    },
    data: getRegisterMinterInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/revokeMinter.ts
import {
  combineCodec as combineCodec18,
  fixDecoderSize as fixDecoderSize18,
  fixEncoderSize as fixEncoderSize18,
  getBytesDecoder as getBytesDecoder18,
  getBytesEncoder as getBytesEncoder18,
  getProgramDerivedAddress as getProgramDerivedAddress11,
  getStructDecoder as getStructDecoder18,
  getStructEncoder as getStructEncoder18,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS12,
  SolanaError as SolanaError12,
  transformEncoder as transformEncoder18
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory12
} from "@solana/program-client-core";
var REVOKE_MINTER_DISCRIMINATOR = new Uint8Array([
  33,
  91,
  131,
  167,
  62,
  37,
  38,
  105
]);
function getRevokeMinterDiscriminatorBytes() {
  return fixEncoderSize18(getBytesEncoder18(), 8).encode(
    REVOKE_MINTER_DISCRIMINATOR
  );
}
function getRevokeMinterInstructionDataEncoder() {
  return transformEncoder18(
    getStructEncoder18([["discriminator", fixEncoderSize18(getBytesEncoder18(), 8)]]),
    (value) => ({ ...value, discriminator: REVOKE_MINTER_DISCRIMINATOR })
  );
}
function getRevokeMinterInstructionDataDecoder() {
  return getStructDecoder18([
    ["discriminator", fixDecoderSize18(getBytesDecoder18(), 8)]
  ]);
}
function getRevokeMinterInstructionDataCodec() {
  return combineCodec18(
    getRevokeMinterInstructionDataEncoder(),
    getRevokeMinterInstructionDataDecoder()
  );
}
async function getRevokeMinterInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    minterRole: { value: input.minterRole ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: true }
  };
  const accounts = originalAccounts;
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress11({
      programAddress,
      seeds: [
        getBytesEncoder18().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  const getAccountMeta = getAccountMetaFactory12(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("minterRole", accounts.minterRole),
      getAccountMeta("authority", accounts.authority)
    ],
    data: getRevokeMinterInstructionDataEncoder().encode({}),
    programAddress
  });
}
function getRevokeMinterInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    minterRole: { value: input.minterRole ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: true }
  };
  const accounts = originalAccounts;
  const getAccountMeta = getAccountMetaFactory12(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("minterRole", accounts.minterRole),
      getAccountMeta("authority", accounts.authority)
    ],
    data: getRevokeMinterInstructionDataEncoder().encode({}),
    programAddress
  });
}
function parseRevokeMinterInstruction(instruction) {
  if (instruction.accounts.length < 3) {
    throw new SolanaError12(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS12,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 3
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      minterRole: getNextAccount(),
      authority: getNextAccount()
    },
    data: getRevokeMinterInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/rewardXp.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix9,
  addEncoderSizePrefix as addEncoderSizePrefix9,
  combineCodec as combineCodec19,
  fixDecoderSize as fixDecoderSize19,
  fixEncoderSize as fixEncoderSize19,
  getAddressEncoder as getAddressEncoder12,
  getBytesDecoder as getBytesDecoder19,
  getBytesEncoder as getBytesEncoder19,
  getProgramDerivedAddress as getProgramDerivedAddress12,
  getStructDecoder as getStructDecoder19,
  getStructEncoder as getStructEncoder19,
  getU32Decoder as getU32Decoder9,
  getU32Encoder as getU32Encoder9,
  getU64Decoder as getU64Decoder5,
  getU64Encoder as getU64Encoder5,
  getUtf8Decoder as getUtf8Decoder9,
  getUtf8Encoder as getUtf8Encoder9,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS13,
  SolanaError as SolanaError13,
  transformEncoder as transformEncoder19
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory13,
  getAddressFromResolvedInstructionAccount as getAddressFromResolvedInstructionAccount4
} from "@solana/program-client-core";
var REWARD_XP_DISCRIMINATOR = new Uint8Array([
  144,
  187,
  117,
  238,
  89,
  118,
  224,
  145
]);
function getRewardXpDiscriminatorBytes() {
  return fixEncoderSize19(getBytesEncoder19(), 8).encode(REWARD_XP_DISCRIMINATOR);
}
function getRewardXpInstructionDataEncoder() {
  return transformEncoder19(
    getStructEncoder19([
      ["discriminator", fixEncoderSize19(getBytesEncoder19(), 8)],
      ["amount", getU64Encoder5()],
      ["memo", addEncoderSizePrefix9(getUtf8Encoder9(), getU32Encoder9())]
    ]),
    (value) => ({ ...value, discriminator: REWARD_XP_DISCRIMINATOR })
  );
}
function getRewardXpInstructionDataDecoder() {
  return getStructDecoder19([
    ["discriminator", fixDecoderSize19(getBytesDecoder19(), 8)],
    ["amount", getU64Decoder5()],
    ["memo", addDecoderSizePrefix9(getUtf8Decoder9(), getU32Decoder9())]
  ]);
}
function getRewardXpInstructionDataCodec() {
  return combineCodec19(
    getRewardXpInstructionDataEncoder(),
    getRewardXpInstructionDataDecoder()
  );
}
async function getRewardXpInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    minterRole: { value: input.minterRole ?? null, isWritable: true },
    xpMint: { value: input.xpMint ?? null, isWritable: true },
    recipientTokenAccount: {
      value: input.recipientTokenAccount ?? null,
      isWritable: true
    },
    minter: { value: input.minter ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress12({
      programAddress,
      seeds: [
        getBytesEncoder19().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  if (!accounts.minterRole.value) {
    accounts.minterRole.value = await getProgramDerivedAddress12({
      programAddress,
      seeds: [
        getBytesEncoder19().encode(
          new Uint8Array([109, 105, 110, 116, 101, 114])
        ),
        getAddressEncoder12().encode(
          getAddressFromResolvedInstructionAccount4(
            "minter",
            accounts.minter.value
          )
        )
      ]
    });
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory13(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("minterRole", accounts.minterRole),
      getAccountMeta("xpMint", accounts.xpMint),
      getAccountMeta("recipientTokenAccount", accounts.recipientTokenAccount),
      getAccountMeta("minter", accounts.minter),
      getAccountMeta("tokenProgram", accounts.tokenProgram)
    ],
    data: getRewardXpInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getRewardXpInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    minterRole: { value: input.minterRole ?? null, isWritable: true },
    xpMint: { value: input.xpMint ?? null, isWritable: true },
    recipientTokenAccount: {
      value: input.recipientTokenAccount ?? null,
      isWritable: true
    },
    minter: { value: input.minter ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory13(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("minterRole", accounts.minterRole),
      getAccountMeta("xpMint", accounts.xpMint),
      getAccountMeta("recipientTokenAccount", accounts.recipientTokenAccount),
      getAccountMeta("minter", accounts.minter),
      getAccountMeta("tokenProgram", accounts.tokenProgram)
    ],
    data: getRewardXpInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseRewardXpInstruction(instruction) {
  if (instruction.accounts.length < 6) {
    throw new SolanaError13(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS13,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 6
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      minterRole: getNextAccount(),
      xpMint: getNextAccount(),
      recipientTokenAccount: getNextAccount(),
      minter: getNextAccount(),
      tokenProgram: getNextAccount()
    },
    data: getRewardXpInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/updateConfig.ts
import {
  combineCodec as combineCodec20,
  fixDecoderSize as fixDecoderSize20,
  fixEncoderSize as fixEncoderSize20,
  getAddressDecoder as getAddressDecoder9,
  getAddressEncoder as getAddressEncoder13,
  getBytesDecoder as getBytesDecoder20,
  getBytesEncoder as getBytesEncoder20,
  getOptionDecoder as getOptionDecoder4,
  getOptionEncoder as getOptionEncoder4,
  getProgramDerivedAddress as getProgramDerivedAddress13,
  getStructDecoder as getStructDecoder20,
  getStructEncoder as getStructEncoder20,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS14,
  SolanaError as SolanaError14,
  transformEncoder as transformEncoder20
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory14
} from "@solana/program-client-core";
var UPDATE_CONFIG_DISCRIMINATOR = new Uint8Array([
  29,
  158,
  252,
  191,
  10,
  83,
  219,
  99
]);
function getUpdateConfigDiscriminatorBytes() {
  return fixEncoderSize20(getBytesEncoder20(), 8).encode(
    UPDATE_CONFIG_DISCRIMINATOR
  );
}
function getUpdateConfigInstructionDataEncoder() {
  return transformEncoder20(
    getStructEncoder20([
      ["discriminator", fixEncoderSize20(getBytesEncoder20(), 8)],
      ["newBackendSigner", getOptionEncoder4(getAddressEncoder13())]
    ]),
    (value) => ({ ...value, discriminator: UPDATE_CONFIG_DISCRIMINATOR })
  );
}
function getUpdateConfigInstructionDataDecoder() {
  return getStructDecoder20([
    ["discriminator", fixDecoderSize20(getBytesDecoder20(), 8)],
    ["newBackendSigner", getOptionDecoder4(getAddressDecoder9())]
  ]);
}
function getUpdateConfigInstructionDataCodec() {
  return combineCodec20(
    getUpdateConfigInstructionDataEncoder(),
    getUpdateConfigInstructionDataDecoder()
  );
}
async function getUpdateConfigInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress13({
      programAddress,
      seeds: [
        getBytesEncoder20().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  const getAccountMeta = getAccountMetaFactory14(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("authority", accounts.authority)
    ],
    data: getUpdateConfigInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getUpdateConfigInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  const getAccountMeta = getAccountMetaFactory14(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("authority", accounts.authority)
    ],
    data: getUpdateConfigInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseUpdateConfigInstruction(instruction) {
  if (instruction.accounts.length < 2) {
    throw new SolanaError14(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS14,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 2
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: { config: getNextAccount(), authority: getNextAccount() },
    data: getUpdateConfigInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/updateCourse.ts
import {
  combineCodec as combineCodec21,
  fixDecoderSize as fixDecoderSize21,
  fixEncoderSize as fixEncoderSize21,
  getBooleanDecoder as getBooleanDecoder4,
  getBooleanEncoder as getBooleanEncoder4,
  getBytesDecoder as getBytesDecoder21,
  getBytesEncoder as getBytesEncoder21,
  getOptionDecoder as getOptionDecoder5,
  getOptionEncoder as getOptionEncoder5,
  getProgramDerivedAddress as getProgramDerivedAddress14,
  getStructDecoder as getStructDecoder21,
  getStructEncoder as getStructEncoder21,
  getU16Decoder as getU16Decoder3,
  getU16Encoder as getU16Encoder3,
  getU32Decoder as getU32Decoder10,
  getU32Encoder as getU32Encoder10,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS15,
  SolanaError as SolanaError15,
  transformEncoder as transformEncoder21
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory15
} from "@solana/program-client-core";
var UPDATE_COURSE_DISCRIMINATOR = new Uint8Array([
  81,
  217,
  18,
  192,
  129,
  233,
  129,
  231
]);
function getUpdateCourseDiscriminatorBytes() {
  return fixEncoderSize21(getBytesEncoder21(), 8).encode(
    UPDATE_COURSE_DISCRIMINATOR
  );
}
function getUpdateCourseInstructionDataEncoder() {
  return transformEncoder21(
    getStructEncoder21([
      ["discriminator", fixEncoderSize21(getBytesEncoder21(), 8)],
      [
        "newContentTxId",
        getOptionEncoder5(fixEncoderSize21(getBytesEncoder21(), 32))
      ],
      ["newIsActive", getOptionEncoder5(getBooleanEncoder4())],
      ["newXpPerLesson", getOptionEncoder5(getU32Encoder10())],
      ["newCreatorRewardXp", getOptionEncoder5(getU32Encoder10())],
      ["newMinCompletionsForReward", getOptionEncoder5(getU16Encoder3())]
    ]),
    (value) => ({ ...value, discriminator: UPDATE_COURSE_DISCRIMINATOR })
  );
}
function getUpdateCourseInstructionDataDecoder() {
  return getStructDecoder21([
    ["discriminator", fixDecoderSize21(getBytesDecoder21(), 8)],
    ["newContentTxId", getOptionDecoder5(fixDecoderSize21(getBytesDecoder21(), 32))],
    ["newIsActive", getOptionDecoder5(getBooleanDecoder4())],
    ["newXpPerLesson", getOptionDecoder5(getU32Decoder10())],
    ["newCreatorRewardXp", getOptionDecoder5(getU32Decoder10())],
    ["newMinCompletionsForReward", getOptionDecoder5(getU16Decoder3())]
  ]);
}
function getUpdateCourseInstructionDataCodec() {
  return combineCodec21(
    getUpdateCourseInstructionDataEncoder(),
    getUpdateCourseInstructionDataDecoder()
  );
}
async function getUpdateCourseInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    course: { value: input.course ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress14({
      programAddress,
      seeds: [
        getBytesEncoder21().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  const getAccountMeta = getAccountMetaFactory15(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("course", accounts.course),
      getAccountMeta("authority", accounts.authority)
    ],
    data: getUpdateCourseInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getUpdateCourseInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    course: { value: input.course ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  const getAccountMeta = getAccountMetaFactory15(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("course", accounts.course),
      getAccountMeta("authority", accounts.authority)
    ],
    data: getUpdateCourseInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseUpdateCourseInstruction(instruction) {
  if (instruction.accounts.length < 3) {
    throw new SolanaError15(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS15,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 3
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      course: getNextAccount(),
      authority: getNextAccount()
    },
    data: getUpdateCourseInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/upgradeCredential.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix10,
  addEncoderSizePrefix as addEncoderSizePrefix10,
  combineCodec as combineCodec22,
  fixDecoderSize as fixDecoderSize22,
  fixEncoderSize as fixEncoderSize22,
  getBytesDecoder as getBytesDecoder22,
  getBytesEncoder as getBytesEncoder22,
  getProgramDerivedAddress as getProgramDerivedAddress15,
  getStructDecoder as getStructDecoder22,
  getStructEncoder as getStructEncoder22,
  getU32Decoder as getU32Decoder11,
  getU32Encoder as getU32Encoder11,
  getU64Decoder as getU64Decoder6,
  getU64Encoder as getU64Encoder6,
  getUtf8Decoder as getUtf8Decoder10,
  getUtf8Encoder as getUtf8Encoder10,
  SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS as SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS16,
  SolanaError as SolanaError16,
  transformEncoder as transformEncoder22
} from "@solana/kit";
import {
  getAccountMetaFactory as getAccountMetaFactory16
} from "@solana/program-client-core";
var UPGRADE_CREDENTIAL_DISCRIMINATOR = new Uint8Array([
  2,
  121,
  77,
  255,
  103,
  187,
  252,
  169
]);
function getUpgradeCredentialDiscriminatorBytes() {
  return fixEncoderSize22(getBytesEncoder22(), 8).encode(
    UPGRADE_CREDENTIAL_DISCRIMINATOR
  );
}
function getUpgradeCredentialInstructionDataEncoder() {
  return transformEncoder22(
    getStructEncoder22([
      ["discriminator", fixEncoderSize22(getBytesEncoder22(), 8)],
      [
        "credentialName",
        addEncoderSizePrefix10(getUtf8Encoder10(), getU32Encoder11())
      ],
      ["metadataUri", addEncoderSizePrefix10(getUtf8Encoder10(), getU32Encoder11())],
      ["coursesCompleted", getU32Encoder11()],
      ["totalXp", getU64Encoder6()]
    ]),
    (value) => ({ ...value, discriminator: UPGRADE_CREDENTIAL_DISCRIMINATOR })
  );
}
function getUpgradeCredentialInstructionDataDecoder() {
  return getStructDecoder22([
    ["discriminator", fixDecoderSize22(getBytesDecoder22(), 8)],
    ["credentialName", addDecoderSizePrefix10(getUtf8Decoder10(), getU32Decoder11())],
    ["metadataUri", addDecoderSizePrefix10(getUtf8Decoder10(), getU32Decoder11())],
    ["coursesCompleted", getU32Decoder11()],
    ["totalXp", getU64Decoder6()]
  ]);
}
function getUpgradeCredentialInstructionDataCodec() {
  return combineCodec22(
    getUpgradeCredentialInstructionDataEncoder(),
    getUpgradeCredentialInstructionDataDecoder()
  );
}
async function getUpgradeCredentialInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    course: { value: input.course ?? null, isWritable: false },
    enrollment: { value: input.enrollment ?? null, isWritable: false },
    learner: { value: input.learner ?? null, isWritable: false },
    credentialAsset: { value: input.credentialAsset ?? null, isWritable: true },
    trackCollection: { value: input.trackCollection ?? null, isWritable: true },
    payer: { value: input.payer ?? null, isWritable: true },
    backendSigner: { value: input.backendSigner ?? null, isWritable: false },
    mplCoreProgram: { value: input.mplCoreProgram ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.config.value) {
    accounts.config.value = await getProgramDerivedAddress15({
      programAddress,
      seeds: [
        getBytesEncoder22().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))
      ]
    });
  }
  if (!accounts.mplCoreProgram.value) {
    accounts.mplCoreProgram.value = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory16(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("course", accounts.course),
      getAccountMeta("enrollment", accounts.enrollment),
      getAccountMeta("learner", accounts.learner),
      getAccountMeta("credentialAsset", accounts.credentialAsset),
      getAccountMeta("trackCollection", accounts.trackCollection),
      getAccountMeta("payer", accounts.payer),
      getAccountMeta("backendSigner", accounts.backendSigner),
      getAccountMeta("mplCoreProgram", accounts.mplCoreProgram),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getUpgradeCredentialInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getUpgradeCredentialInstruction(input, config) {
  const programAddress = config?.programAddress ?? ONCHAIN_ACADEMY_PROGRAM_ADDRESS;
  const originalAccounts = {
    config: { value: input.config ?? null, isWritable: false },
    course: { value: input.course ?? null, isWritable: false },
    enrollment: { value: input.enrollment ?? null, isWritable: false },
    learner: { value: input.learner ?? null, isWritable: false },
    credentialAsset: { value: input.credentialAsset ?? null, isWritable: true },
    trackCollection: { value: input.trackCollection ?? null, isWritable: true },
    payer: { value: input.payer ?? null, isWritable: true },
    backendSigner: { value: input.backendSigner ?? null, isWritable: false },
    mplCoreProgram: { value: input.mplCoreProgram ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.mplCoreProgram.value) {
    accounts.mplCoreProgram.value = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory16(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta("config", accounts.config),
      getAccountMeta("course", accounts.course),
      getAccountMeta("enrollment", accounts.enrollment),
      getAccountMeta("learner", accounts.learner),
      getAccountMeta("credentialAsset", accounts.credentialAsset),
      getAccountMeta("trackCollection", accounts.trackCollection),
      getAccountMeta("payer", accounts.payer),
      getAccountMeta("backendSigner", accounts.backendSigner),
      getAccountMeta("mplCoreProgram", accounts.mplCoreProgram),
      getAccountMeta("systemProgram", accounts.systemProgram)
    ],
    data: getUpgradeCredentialInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseUpgradeCredentialInstruction(instruction) {
  if (instruction.accounts.length < 10) {
    throw new SolanaError16(
      SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS16,
      {
        actualAccountMetas: instruction.accounts.length,
        expectedAccountMetas: 10
      }
    );
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      config: getNextAccount(),
      course: getNextAccount(),
      enrollment: getNextAccount(),
      learner: getNextAccount(),
      credentialAsset: getNextAccount(),
      trackCollection: getNextAccount(),
      payer: getNextAccount(),
      backendSigner: getNextAccount(),
      mplCoreProgram: getNextAccount(),
      systemProgram: getNextAccount()
    },
    data: getUpgradeCredentialInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/programs/onchainAcademy.ts
var ONCHAIN_ACADEMY_PROGRAM_ADDRESS = "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf";
var OnchainAcademyAccount = /* @__PURE__ */ ((OnchainAcademyAccount2) => {
  OnchainAcademyAccount2[OnchainAcademyAccount2["AchievementReceipt"] = 0] = "AchievementReceipt";
  OnchainAcademyAccount2[OnchainAcademyAccount2["AchievementType"] = 1] = "AchievementType";
  OnchainAcademyAccount2[OnchainAcademyAccount2["Config"] = 2] = "Config";
  OnchainAcademyAccount2[OnchainAcademyAccount2["Course"] = 3] = "Course";
  OnchainAcademyAccount2[OnchainAcademyAccount2["Enrollment"] = 4] = "Enrollment";
  OnchainAcademyAccount2[OnchainAcademyAccount2["MinterRole"] = 5] = "MinterRole";
  return OnchainAcademyAccount2;
})(OnchainAcademyAccount || {});
function identifyOnchainAcademyAccount(account) {
  const data = "data" in account ? account.data : account;
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([149, 5, 79, 178, 116, 231, 43, 248])
    ),
    0
  )) {
    return 0 /* AchievementReceipt */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([13, 187, 114, 66, 217, 154, 85, 137])
    ),
    0
  )) {
    return 1 /* AchievementType */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([155, 12, 170, 224, 30, 250, 204, 130])
    ),
    0
  )) {
    return 2 /* Config */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([206, 6, 78, 228, 163, 138, 241, 106])
    ),
    0
  )) {
    return 3 /* Course */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([249, 210, 64, 145, 197, 241, 57, 51])
    ),
    0
  )) {
    return 4 /* Enrollment */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([21, 246, 6, 133, 142, 211, 33, 193])
    ),
    0
  )) {
    return 5 /* MinterRole */;
  }
  throw new SolanaError17(
    SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_ACCOUNT,
    { accountData: data, programName: "onchainAcademy" }
  );
}
var OnchainAcademyInstruction = /* @__PURE__ */ ((OnchainAcademyInstruction2) => {
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["AwardAchievement"] = 0] = "AwardAchievement";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["CloseEnrollment"] = 1] = "CloseEnrollment";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["CompleteLesson"] = 2] = "CompleteLesson";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["CreateAchievementType"] = 3] = "CreateAchievementType";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["CreateCourse"] = 4] = "CreateCourse";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["DeactivateAchievementType"] = 5] = "DeactivateAchievementType";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["Enroll"] = 6] = "Enroll";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["FinalizeCourse"] = 7] = "FinalizeCourse";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["Initialize"] = 8] = "Initialize";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["IssueCredential"] = 9] = "IssueCredential";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["RegisterMinter"] = 10] = "RegisterMinter";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["RevokeMinter"] = 11] = "RevokeMinter";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["RewardXp"] = 12] = "RewardXp";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["UpdateConfig"] = 13] = "UpdateConfig";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["UpdateCourse"] = 14] = "UpdateCourse";
  OnchainAcademyInstruction2[OnchainAcademyInstruction2["UpgradeCredential"] = 15] = "UpgradeCredential";
  return OnchainAcademyInstruction2;
})(OnchainAcademyInstruction || {});
function identifyOnchainAcademyInstruction(instruction) {
  const data = "data" in instruction ? instruction.data : instruction;
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([75, 47, 156, 253, 124, 231, 84, 12])
    ),
    0
  )) {
    return 0 /* AwardAchievement */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([236, 137, 133, 253, 91, 138, 217, 91])
    ),
    0
  )) {
    return 1 /* CloseEnrollment */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([77, 217, 53, 132, 204, 150, 169, 58])
    ),
    0
  )) {
    return 2 /* CompleteLesson */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([231, 38, 39, 228, 103, 4, 229, 19])
    ),
    0
  )) {
    return 3 /* CreateAchievementType */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([120, 121, 154, 164, 107, 180, 167, 241])
    ),
    0
  )) {
    return 4 /* CreateCourse */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([185, 21, 222, 243, 192, 118, 71, 191])
    ),
    0
  )) {
    return 5 /* DeactivateAchievementType */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([58, 12, 36, 3, 142, 28, 1, 43])
    ),
    0
  )) {
    return 6 /* Enroll */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([68, 189, 122, 239, 39, 121, 16, 218])
    ),
    0
  )) {
    return 7 /* FinalizeCourse */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([175, 175, 109, 31, 13, 152, 155, 237])
    ),
    0
  )) {
    return 8 /* Initialize */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([255, 193, 171, 224, 68, 171, 194, 87])
    ),
    0
  )) {
    return 9 /* IssueCredential */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([58, 224, 74, 142, 170, 95, 116, 191])
    ),
    0
  )) {
    return 10 /* RegisterMinter */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([33, 91, 131, 167, 62, 37, 38, 105])
    ),
    0
  )) {
    return 11 /* RevokeMinter */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([144, 187, 117, 238, 89, 118, 224, 145])
    ),
    0
  )) {
    return 12 /* RewardXp */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([29, 158, 252, 191, 10, 83, 219, 99])
    ),
    0
  )) {
    return 13 /* UpdateConfig */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([81, 217, 18, 192, 129, 233, 129, 231])
    ),
    0
  )) {
    return 14 /* UpdateCourse */;
  }
  if (containsBytes(
    data,
    fixEncoderSize23(getBytesEncoder23(), 8).encode(
      new Uint8Array([2, 121, 77, 255, 103, 187, 252, 169])
    ),
    0
  )) {
    return 15 /* UpgradeCredential */;
  }
  throw new SolanaError17(
    SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_INSTRUCTION,
    { instructionData: data, programName: "onchainAcademy" }
  );
}
function parseOnchainAcademyInstruction(instruction) {
  const instructionType = identifyOnchainAcademyInstruction(instruction);
  switch (instructionType) {
    case 0 /* AwardAchievement */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 0 /* AwardAchievement */,
        ...parseAwardAchievementInstruction(instruction)
      };
    }
    case 1 /* CloseEnrollment */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 1 /* CloseEnrollment */,
        ...parseCloseEnrollmentInstruction(instruction)
      };
    }
    case 2 /* CompleteLesson */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 2 /* CompleteLesson */,
        ...parseCompleteLessonInstruction(instruction)
      };
    }
    case 3 /* CreateAchievementType */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 3 /* CreateAchievementType */,
        ...parseCreateAchievementTypeInstruction(instruction)
      };
    }
    case 4 /* CreateCourse */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 4 /* CreateCourse */,
        ...parseCreateCourseInstruction(instruction)
      };
    }
    case 5 /* DeactivateAchievementType */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 5 /* DeactivateAchievementType */,
        ...parseDeactivateAchievementTypeInstruction(instruction)
      };
    }
    case 6 /* Enroll */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 6 /* Enroll */,
        ...parseEnrollInstruction(instruction)
      };
    }
    case 7 /* FinalizeCourse */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 7 /* FinalizeCourse */,
        ...parseFinalizeCourseInstruction(instruction)
      };
    }
    case 8 /* Initialize */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 8 /* Initialize */,
        ...parseInitializeInstruction(instruction)
      };
    }
    case 9 /* IssueCredential */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 9 /* IssueCredential */,
        ...parseIssueCredentialInstruction(instruction)
      };
    }
    case 10 /* RegisterMinter */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 10 /* RegisterMinter */,
        ...parseRegisterMinterInstruction(instruction)
      };
    }
    case 11 /* RevokeMinter */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 11 /* RevokeMinter */,
        ...parseRevokeMinterInstruction(instruction)
      };
    }
    case 12 /* RewardXp */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 12 /* RewardXp */,
        ...parseRewardXpInstruction(instruction)
      };
    }
    case 13 /* UpdateConfig */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 13 /* UpdateConfig */,
        ...parseUpdateConfigInstruction(instruction)
      };
    }
    case 14 /* UpdateCourse */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 14 /* UpdateCourse */,
        ...parseUpdateCourseInstruction(instruction)
      };
    }
    case 15 /* UpgradeCredential */: {
      assertIsInstructionWithAccounts(instruction);
      return {
        instructionType: 15 /* UpgradeCredential */,
        ...parseUpgradeCredentialInstruction(instruction)
      };
    }
    default:
      throw new SolanaError17(
        SOLANA_ERROR__PROGRAM_CLIENTS__UNRECOGNIZED_INSTRUCTION_TYPE,
        {
          instructionType,
          programName: "onchainAcademy"
        }
      );
  }
}
function onchainAcademyProgram() {
  return (client) => {
    return {
      ...client,
      onchainAcademy: {
        accounts: {
          achievementReceipt: addSelfFetchFunctions(
            client,
            getAchievementReceiptCodec()
          ),
          achievementType: addSelfFetchFunctions(
            client,
            getAchievementTypeCodec()
          ),
          config: addSelfFetchFunctions(client, getConfigCodec()),
          course: addSelfFetchFunctions(client, getCourseCodec()),
          enrollment: addSelfFetchFunctions(client, getEnrollmentCodec()),
          minterRole: addSelfFetchFunctions(client, getMinterRoleCodec())
        },
        instructions: {
          awardAchievement: (input) => addSelfPlanAndSendFunctions(
            client,
            getAwardAchievementInstructionAsync({
              ...input,
              payer: input.payer ?? client.payer
            })
          ),
          closeEnrollment: (input) => addSelfPlanAndSendFunctions(
            client,
            getCloseEnrollmentInstruction(input)
          ),
          completeLesson: (input) => addSelfPlanAndSendFunctions(
            client,
            getCompleteLessonInstructionAsync(input)
          ),
          createAchievementType: (input) => addSelfPlanAndSendFunctions(
            client,
            getCreateAchievementTypeInstructionAsync({
              ...input,
              payer: input.payer ?? client.payer
            })
          ),
          createCourse: (input) => addSelfPlanAndSendFunctions(
            client,
            getCreateCourseInstructionAsync(input)
          ),
          deactivateAchievementType: (input) => addSelfPlanAndSendFunctions(
            client,
            getDeactivateAchievementTypeInstructionAsync(input)
          ),
          enroll: (input) => addSelfPlanAndSendFunctions(
            client,
            getEnrollInstructionAsync(input)
          ),
          finalizeCourse: (input) => addSelfPlanAndSendFunctions(
            client,
            getFinalizeCourseInstructionAsync(input)
          ),
          initialize: (input) => addSelfPlanAndSendFunctions(
            client,
            getInitializeInstructionAsync(input)
          ),
          issueCredential: (input) => addSelfPlanAndSendFunctions(
            client,
            getIssueCredentialInstructionAsync({
              ...input,
              payer: input.payer ?? client.payer
            })
          ),
          registerMinter: (input) => addSelfPlanAndSendFunctions(
            client,
            getRegisterMinterInstructionAsync({
              ...input,
              payer: input.payer ?? client.payer
            })
          ),
          revokeMinter: (input) => addSelfPlanAndSendFunctions(
            client,
            getRevokeMinterInstructionAsync(input)
          ),
          rewardXp: (input) => addSelfPlanAndSendFunctions(
            client,
            getRewardXpInstructionAsync(input)
          ),
          updateConfig: (input) => addSelfPlanAndSendFunctions(
            client,
            getUpdateConfigInstructionAsync(input)
          ),
          updateCourse: (input) => addSelfPlanAndSendFunctions(
            client,
            getUpdateCourseInstructionAsync(input)
          ),
          upgradeCredential: (input) => addSelfPlanAndSendFunctions(
            client,
            getUpgradeCredentialInstructionAsync({
              ...input,
              payer: input.payer ?? client.payer
            })
          )
        }
      }
    };
  };
}

// src/generated/errors/onchainAcademy.ts
var ONCHAIN_ACADEMY_ERROR__UNAUTHORIZED = 6e3;
var ONCHAIN_ACADEMY_ERROR__COURSE_NOT_ACTIVE = 6001;
var ONCHAIN_ACADEMY_ERROR__LESSON_OUT_OF_BOUNDS = 6002;
var ONCHAIN_ACADEMY_ERROR__LESSON_ALREADY_COMPLETED = 6003;
var ONCHAIN_ACADEMY_ERROR__COURSE_NOT_COMPLETED = 6004;
var ONCHAIN_ACADEMY_ERROR__COURSE_ALREADY_FINALIZED = 6005;
var ONCHAIN_ACADEMY_ERROR__COURSE_NOT_FINALIZED = 6006;
var ONCHAIN_ACADEMY_ERROR__PREREQUISITE_NOT_MET = 6007;
var ONCHAIN_ACADEMY_ERROR__UNENROLL_COOLDOWN = 6008;
var ONCHAIN_ACADEMY_ERROR__ENROLLMENT_COURSE_MISMATCH = 6009;
var ONCHAIN_ACADEMY_ERROR__OVERFLOW = 6010;
var ONCHAIN_ACADEMY_ERROR__COURSE_ID_EMPTY = 6011;
var ONCHAIN_ACADEMY_ERROR__COURSE_ID_TOO_LONG = 6012;
var ONCHAIN_ACADEMY_ERROR__INVALID_LESSON_COUNT = 6013;
var ONCHAIN_ACADEMY_ERROR__INVALID_DIFFICULTY = 6014;
var ONCHAIN_ACADEMY_ERROR__CREDENTIAL_ASSET_MISMATCH = 6015;
var ONCHAIN_ACADEMY_ERROR__CREDENTIAL_ALREADY_ISSUED = 6016;
var ONCHAIN_ACADEMY_ERROR__MINTER_NOT_ACTIVE = 6017;
var ONCHAIN_ACADEMY_ERROR__MINTER_AMOUNT_EXCEEDED = 6018;
var ONCHAIN_ACADEMY_ERROR__LABEL_TOO_LONG = 6019;
var ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_NOT_ACTIVE = 6020;
var ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_SUPPLY_EXHAUSTED = 6021;
var ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_ID_TOO_LONG = 6022;
var ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_NAME_TOO_LONG = 6023;
var ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_URI_TOO_LONG = 6024;
var ONCHAIN_ACADEMY_ERROR__INVALID_AMOUNT = 6025;
var ONCHAIN_ACADEMY_ERROR__INVALID_XP_REWARD = 6026;
var onchainAcademyErrorMessages;
if (process.env.NODE_ENV !== "production") {
  onchainAcademyErrorMessages = {
    [ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_ID_TOO_LONG]: `Achievement ID exceeds max length`,
    [ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_NAME_TOO_LONG]: `Achievement name exceeds max length`,
    [ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_NOT_ACTIVE]: `Achievement type is not active`,
    [ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_SUPPLY_EXHAUSTED]: `Achievement max supply reached`,
    [ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_URI_TOO_LONG]: `Achievement URI exceeds max length`,
    [ONCHAIN_ACADEMY_ERROR__COURSE_ALREADY_FINALIZED]: `Course already finalized`,
    [ONCHAIN_ACADEMY_ERROR__COURSE_ID_EMPTY]: `Course ID is empty`,
    [ONCHAIN_ACADEMY_ERROR__COURSE_ID_TOO_LONG]: `Course ID exceeds max length`,
    [ONCHAIN_ACADEMY_ERROR__COURSE_NOT_ACTIVE]: `Course not active`,
    [ONCHAIN_ACADEMY_ERROR__COURSE_NOT_COMPLETED]: `Not all lessons completed`,
    [ONCHAIN_ACADEMY_ERROR__COURSE_NOT_FINALIZED]: `Course not finalized`,
    [ONCHAIN_ACADEMY_ERROR__CREDENTIAL_ALREADY_ISSUED]: `Credential already issued for this enrollment`,
    [ONCHAIN_ACADEMY_ERROR__CREDENTIAL_ASSET_MISMATCH]: `Credential asset does not match enrollment record`,
    [ONCHAIN_ACADEMY_ERROR__ENROLLMENT_COURSE_MISMATCH]: `Enrollment/course mismatch`,
    [ONCHAIN_ACADEMY_ERROR__INVALID_AMOUNT]: `Amount must be greater than zero`,
    [ONCHAIN_ACADEMY_ERROR__INVALID_DIFFICULTY]: `Difficulty must be 1, 2, or 3`,
    [ONCHAIN_ACADEMY_ERROR__INVALID_LESSON_COUNT]: `Lesson count must be at least 1`,
    [ONCHAIN_ACADEMY_ERROR__INVALID_XP_REWARD]: `XP reward must be greater than zero`,
    [ONCHAIN_ACADEMY_ERROR__LABEL_TOO_LONG]: `Minter label exceeds max length`,
    [ONCHAIN_ACADEMY_ERROR__LESSON_ALREADY_COMPLETED]: `Lesson already completed`,
    [ONCHAIN_ACADEMY_ERROR__LESSON_OUT_OF_BOUNDS]: `Lesson index out of bounds`,
    [ONCHAIN_ACADEMY_ERROR__MINTER_AMOUNT_EXCEEDED]: `Amount exceeds minter's per-call limit`,
    [ONCHAIN_ACADEMY_ERROR__MINTER_NOT_ACTIVE]: `Minter role is not active`,
    [ONCHAIN_ACADEMY_ERROR__OVERFLOW]: `Arithmetic overflow`,
    [ONCHAIN_ACADEMY_ERROR__PREREQUISITE_NOT_MET]: `Prerequisite not met`,
    [ONCHAIN_ACADEMY_ERROR__UNAUTHORIZED]: `Unauthorized signer`,
    [ONCHAIN_ACADEMY_ERROR__UNENROLL_COOLDOWN]: `Close cooldown not met (24h)`
  };
}
function getOnchainAcademyErrorMessage(code) {
  if (process.env.NODE_ENV !== "production") {
    return onchainAcademyErrorMessages[code];
  }
  return "Error message not available in production bundles.";
}
function isOnchainAcademyError(error, transactionMessage, code) {
  return isProgramError(
    error,
    transactionMessage,
    ONCHAIN_ACADEMY_PROGRAM_ADDRESS,
    code
  );
}

// src/generated/types/achievementAwarded.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix11,
  addEncoderSizePrefix as addEncoderSizePrefix11,
  combineCodec as combineCodec23,
  getAddressDecoder as getAddressDecoder10,
  getAddressEncoder as getAddressEncoder14,
  getI64Decoder as getI64Decoder6,
  getI64Encoder as getI64Encoder6,
  getStructDecoder as getStructDecoder23,
  getStructEncoder as getStructEncoder23,
  getU32Decoder as getU32Decoder12,
  getU32Encoder as getU32Encoder12,
  getUtf8Decoder as getUtf8Decoder11,
  getUtf8Encoder as getUtf8Encoder11
} from "@solana/kit";
function getAchievementAwardedEncoder() {
  return getStructEncoder23([
    ["achievementId", addEncoderSizePrefix11(getUtf8Encoder11(), getU32Encoder12())],
    ["recipient", getAddressEncoder14()],
    ["asset", getAddressEncoder14()],
    ["xpReward", getU32Encoder12()],
    ["timestamp", getI64Encoder6()]
  ]);
}
function getAchievementAwardedDecoder() {
  return getStructDecoder23([
    ["achievementId", addDecoderSizePrefix11(getUtf8Decoder11(), getU32Decoder12())],
    ["recipient", getAddressDecoder10()],
    ["asset", getAddressDecoder10()],
    ["xpReward", getU32Decoder12()],
    ["timestamp", getI64Decoder6()]
  ]);
}
function getAchievementAwardedCodec() {
  return combineCodec23(
    getAchievementAwardedEncoder(),
    getAchievementAwardedDecoder()
  );
}

// src/generated/types/achievementTypeCreated.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix12,
  addEncoderSizePrefix as addEncoderSizePrefix12,
  combineCodec as combineCodec24,
  getAddressDecoder as getAddressDecoder11,
  getAddressEncoder as getAddressEncoder15,
  getI64Decoder as getI64Decoder7,
  getI64Encoder as getI64Encoder7,
  getStructDecoder as getStructDecoder24,
  getStructEncoder as getStructEncoder24,
  getU32Decoder as getU32Decoder13,
  getU32Encoder as getU32Encoder13,
  getUtf8Decoder as getUtf8Decoder12,
  getUtf8Encoder as getUtf8Encoder12
} from "@solana/kit";
function getAchievementTypeCreatedEncoder() {
  return getStructEncoder24([
    ["achievementId", addEncoderSizePrefix12(getUtf8Encoder12(), getU32Encoder13())],
    ["collection", getAddressEncoder15()],
    ["creator", getAddressEncoder15()],
    ["maxSupply", getU32Encoder13()],
    ["xpReward", getU32Encoder13()],
    ["timestamp", getI64Encoder7()]
  ]);
}
function getAchievementTypeCreatedDecoder() {
  return getStructDecoder24([
    ["achievementId", addDecoderSizePrefix12(getUtf8Decoder12(), getU32Decoder13())],
    ["collection", getAddressDecoder11()],
    ["creator", getAddressDecoder11()],
    ["maxSupply", getU32Decoder13()],
    ["xpReward", getU32Decoder13()],
    ["timestamp", getI64Decoder7()]
  ]);
}
function getAchievementTypeCreatedCodec() {
  return combineCodec24(
    getAchievementTypeCreatedEncoder(),
    getAchievementTypeCreatedDecoder()
  );
}

// src/generated/types/achievementTypeDeactivated.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix13,
  addEncoderSizePrefix as addEncoderSizePrefix13,
  combineCodec as combineCodec25,
  getI64Decoder as getI64Decoder8,
  getI64Encoder as getI64Encoder8,
  getStructDecoder as getStructDecoder25,
  getStructEncoder as getStructEncoder25,
  getU32Decoder as getU32Decoder14,
  getU32Encoder as getU32Encoder14,
  getUtf8Decoder as getUtf8Decoder13,
  getUtf8Encoder as getUtf8Encoder13
} from "@solana/kit";
function getAchievementTypeDeactivatedEncoder() {
  return getStructEncoder25([
    ["achievementId", addEncoderSizePrefix13(getUtf8Encoder13(), getU32Encoder14())],
    ["timestamp", getI64Encoder8()]
  ]);
}
function getAchievementTypeDeactivatedDecoder() {
  return getStructDecoder25([
    ["achievementId", addDecoderSizePrefix13(getUtf8Decoder13(), getU32Decoder14())],
    ["timestamp", getI64Decoder8()]
  ]);
}
function getAchievementTypeDeactivatedCodec() {
  return combineCodec25(
    getAchievementTypeDeactivatedEncoder(),
    getAchievementTypeDeactivatedDecoder()
  );
}

// src/generated/types/configUpdated.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix14,
  addEncoderSizePrefix as addEncoderSizePrefix14,
  combineCodec as combineCodec26,
  getI64Decoder as getI64Decoder9,
  getI64Encoder as getI64Encoder9,
  getStructDecoder as getStructDecoder26,
  getStructEncoder as getStructEncoder26,
  getU32Decoder as getU32Decoder15,
  getU32Encoder as getU32Encoder15,
  getUtf8Decoder as getUtf8Decoder14,
  getUtf8Encoder as getUtf8Encoder14
} from "@solana/kit";
function getConfigUpdatedEncoder() {
  return getStructEncoder26([
    ["field", addEncoderSizePrefix14(getUtf8Encoder14(), getU32Encoder15())],
    ["timestamp", getI64Encoder9()]
  ]);
}
function getConfigUpdatedDecoder() {
  return getStructDecoder26([
    ["field", addDecoderSizePrefix14(getUtf8Decoder14(), getU32Decoder15())],
    ["timestamp", getI64Decoder9()]
  ]);
}
function getConfigUpdatedCodec() {
  return combineCodec26(getConfigUpdatedEncoder(), getConfigUpdatedDecoder());
}

// src/generated/types/courseCreated.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix15,
  addEncoderSizePrefix as addEncoderSizePrefix15,
  combineCodec as combineCodec27,
  getAddressDecoder as getAddressDecoder12,
  getAddressEncoder as getAddressEncoder16,
  getI64Decoder as getI64Decoder10,
  getI64Encoder as getI64Encoder10,
  getStructDecoder as getStructDecoder27,
  getStructEncoder as getStructEncoder27,
  getU16Decoder as getU16Decoder4,
  getU16Encoder as getU16Encoder4,
  getU32Decoder as getU32Decoder16,
  getU32Encoder as getU32Encoder16,
  getU8Decoder as getU8Decoder9,
  getU8Encoder as getU8Encoder9,
  getUtf8Decoder as getUtf8Decoder15,
  getUtf8Encoder as getUtf8Encoder15
} from "@solana/kit";
function getCourseCreatedEncoder() {
  return getStructEncoder27([
    ["course", getAddressEncoder16()],
    ["courseId", addEncoderSizePrefix15(getUtf8Encoder15(), getU32Encoder16())],
    ["creator", getAddressEncoder16()],
    ["trackId", getU16Encoder4()],
    ["trackLevel", getU8Encoder9()],
    ["timestamp", getI64Encoder10()]
  ]);
}
function getCourseCreatedDecoder() {
  return getStructDecoder27([
    ["course", getAddressDecoder12()],
    ["courseId", addDecoderSizePrefix15(getUtf8Decoder15(), getU32Decoder16())],
    ["creator", getAddressDecoder12()],
    ["trackId", getU16Decoder4()],
    ["trackLevel", getU8Decoder9()],
    ["timestamp", getI64Decoder10()]
  ]);
}
function getCourseCreatedCodec() {
  return combineCodec27(getCourseCreatedEncoder(), getCourseCreatedDecoder());
}

// src/generated/types/courseFinalized.ts
import {
  combineCodec as combineCodec28,
  getAddressDecoder as getAddressDecoder13,
  getAddressEncoder as getAddressEncoder17,
  getI64Decoder as getI64Decoder11,
  getI64Encoder as getI64Encoder11,
  getStructDecoder as getStructDecoder28,
  getStructEncoder as getStructEncoder28,
  getU32Decoder as getU32Decoder17,
  getU32Encoder as getU32Encoder17,
  getU64Decoder as getU64Decoder7,
  getU64Encoder as getU64Encoder7
} from "@solana/kit";
function getCourseFinalizedEncoder() {
  return getStructEncoder28([
    ["learner", getAddressEncoder17()],
    ["course", getAddressEncoder17()],
    ["totalXp", getU32Encoder17()],
    ["bonusXp", getU64Encoder7()],
    ["creator", getAddressEncoder17()],
    ["creatorXp", getU32Encoder17()],
    ["timestamp", getI64Encoder11()]
  ]);
}
function getCourseFinalizedDecoder() {
  return getStructDecoder28([
    ["learner", getAddressDecoder13()],
    ["course", getAddressDecoder13()],
    ["totalXp", getU32Decoder17()],
    ["bonusXp", getU64Decoder7()],
    ["creator", getAddressDecoder13()],
    ["creatorXp", getU32Decoder17()],
    ["timestamp", getI64Decoder11()]
  ]);
}
function getCourseFinalizedCodec() {
  return combineCodec28(getCourseFinalizedEncoder(), getCourseFinalizedDecoder());
}

// src/generated/types/courseUpdated.ts
import {
  combineCodec as combineCodec29,
  getAddressDecoder as getAddressDecoder14,
  getAddressEncoder as getAddressEncoder18,
  getI64Decoder as getI64Decoder12,
  getI64Encoder as getI64Encoder12,
  getStructDecoder as getStructDecoder29,
  getStructEncoder as getStructEncoder29,
  getU16Decoder as getU16Decoder5,
  getU16Encoder as getU16Encoder5
} from "@solana/kit";
function getCourseUpdatedEncoder() {
  return getStructEncoder29([
    ["course", getAddressEncoder18()],
    ["version", getU16Encoder5()],
    ["timestamp", getI64Encoder12()]
  ]);
}
function getCourseUpdatedDecoder() {
  return getStructDecoder29([
    ["course", getAddressDecoder14()],
    ["version", getU16Decoder5()],
    ["timestamp", getI64Decoder12()]
  ]);
}
function getCourseUpdatedCodec() {
  return combineCodec29(getCourseUpdatedEncoder(), getCourseUpdatedDecoder());
}

// src/generated/types/credentialIssued.ts
import {
  combineCodec as combineCodec30,
  getAddressDecoder as getAddressDecoder15,
  getAddressEncoder as getAddressEncoder19,
  getI64Decoder as getI64Decoder13,
  getI64Encoder as getI64Encoder13,
  getStructDecoder as getStructDecoder30,
  getStructEncoder as getStructEncoder30,
  getU16Decoder as getU16Decoder6,
  getU16Encoder as getU16Encoder6,
  getU8Decoder as getU8Decoder10,
  getU8Encoder as getU8Encoder10
} from "@solana/kit";
function getCredentialIssuedEncoder() {
  return getStructEncoder30([
    ["learner", getAddressEncoder19()],
    ["trackId", getU16Encoder6()],
    ["credentialAsset", getAddressEncoder19()],
    ["currentLevel", getU8Encoder10()],
    ["timestamp", getI64Encoder13()]
  ]);
}
function getCredentialIssuedDecoder() {
  return getStructDecoder30([
    ["learner", getAddressDecoder15()],
    ["trackId", getU16Decoder6()],
    ["credentialAsset", getAddressDecoder15()],
    ["currentLevel", getU8Decoder10()],
    ["timestamp", getI64Decoder13()]
  ]);
}
function getCredentialIssuedCodec() {
  return combineCodec30(
    getCredentialIssuedEncoder(),
    getCredentialIssuedDecoder()
  );
}

// src/generated/types/credentialUpgraded.ts
import {
  combineCodec as combineCodec31,
  getAddressDecoder as getAddressDecoder16,
  getAddressEncoder as getAddressEncoder20,
  getI64Decoder as getI64Decoder14,
  getI64Encoder as getI64Encoder14,
  getStructDecoder as getStructDecoder31,
  getStructEncoder as getStructEncoder31,
  getU16Decoder as getU16Decoder7,
  getU16Encoder as getU16Encoder7,
  getU8Decoder as getU8Decoder11,
  getU8Encoder as getU8Encoder11
} from "@solana/kit";
function getCredentialUpgradedEncoder() {
  return getStructEncoder31([
    ["learner", getAddressEncoder20()],
    ["trackId", getU16Encoder7()],
    ["credentialAsset", getAddressEncoder20()],
    ["currentLevel", getU8Encoder11()],
    ["timestamp", getI64Encoder14()]
  ]);
}
function getCredentialUpgradedDecoder() {
  return getStructDecoder31([
    ["learner", getAddressDecoder16()],
    ["trackId", getU16Decoder7()],
    ["credentialAsset", getAddressDecoder16()],
    ["currentLevel", getU8Decoder11()],
    ["timestamp", getI64Decoder14()]
  ]);
}
function getCredentialUpgradedCodec() {
  return combineCodec31(
    getCredentialUpgradedEncoder(),
    getCredentialUpgradedDecoder()
  );
}

// src/generated/types/enrolled.ts
import {
  combineCodec as combineCodec32,
  getAddressDecoder as getAddressDecoder17,
  getAddressEncoder as getAddressEncoder21,
  getI64Decoder as getI64Decoder15,
  getI64Encoder as getI64Encoder15,
  getStructDecoder as getStructDecoder32,
  getStructEncoder as getStructEncoder32,
  getU16Decoder as getU16Decoder8,
  getU16Encoder as getU16Encoder8
} from "@solana/kit";
function getEnrolledEncoder() {
  return getStructEncoder32([
    ["learner", getAddressEncoder21()],
    ["course", getAddressEncoder21()],
    ["courseVersion", getU16Encoder8()],
    ["timestamp", getI64Encoder15()]
  ]);
}
function getEnrolledDecoder() {
  return getStructDecoder32([
    ["learner", getAddressDecoder17()],
    ["course", getAddressDecoder17()],
    ["courseVersion", getU16Decoder8()],
    ["timestamp", getI64Decoder15()]
  ]);
}
function getEnrolledCodec() {
  return combineCodec32(getEnrolledEncoder(), getEnrolledDecoder());
}

// src/generated/types/enrollmentClosed.ts
import {
  combineCodec as combineCodec33,
  getAddressDecoder as getAddressDecoder18,
  getAddressEncoder as getAddressEncoder22,
  getBooleanDecoder as getBooleanDecoder5,
  getBooleanEncoder as getBooleanEncoder5,
  getI64Decoder as getI64Decoder16,
  getI64Encoder as getI64Encoder16,
  getStructDecoder as getStructDecoder33,
  getStructEncoder as getStructEncoder33,
  getU64Decoder as getU64Decoder8,
  getU64Encoder as getU64Encoder8
} from "@solana/kit";
function getEnrollmentClosedEncoder() {
  return getStructEncoder33([
    ["learner", getAddressEncoder22()],
    ["course", getAddressEncoder22()],
    ["completed", getBooleanEncoder5()],
    ["rentReclaimed", getU64Encoder8()],
    ["timestamp", getI64Encoder16()]
  ]);
}
function getEnrollmentClosedDecoder() {
  return getStructDecoder33([
    ["learner", getAddressDecoder18()],
    ["course", getAddressDecoder18()],
    ["completed", getBooleanDecoder5()],
    ["rentReclaimed", getU64Decoder8()],
    ["timestamp", getI64Decoder16()]
  ]);
}
function getEnrollmentClosedCodec() {
  return combineCodec33(
    getEnrollmentClosedEncoder(),
    getEnrollmentClosedDecoder()
  );
}

// src/generated/types/lessonCompleted.ts
import {
  combineCodec as combineCodec34,
  getAddressDecoder as getAddressDecoder19,
  getAddressEncoder as getAddressEncoder23,
  getI64Decoder as getI64Decoder17,
  getI64Encoder as getI64Encoder17,
  getStructDecoder as getStructDecoder34,
  getStructEncoder as getStructEncoder34,
  getU32Decoder as getU32Decoder18,
  getU32Encoder as getU32Encoder18,
  getU8Decoder as getU8Decoder12,
  getU8Encoder as getU8Encoder12
} from "@solana/kit";
function getLessonCompletedEncoder() {
  return getStructEncoder34([
    ["learner", getAddressEncoder23()],
    ["course", getAddressEncoder23()],
    ["lessonIndex", getU8Encoder12()],
    ["xpEarned", getU32Encoder18()],
    ["timestamp", getI64Encoder17()]
  ]);
}
function getLessonCompletedDecoder() {
  return getStructDecoder34([
    ["learner", getAddressDecoder19()],
    ["course", getAddressDecoder19()],
    ["lessonIndex", getU8Decoder12()],
    ["xpEarned", getU32Decoder18()],
    ["timestamp", getI64Decoder17()]
  ]);
}
function getLessonCompletedCodec() {
  return combineCodec34(getLessonCompletedEncoder(), getLessonCompletedDecoder());
}

// src/generated/types/minterRegistered.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix16,
  addEncoderSizePrefix as addEncoderSizePrefix16,
  combineCodec as combineCodec35,
  getAddressDecoder as getAddressDecoder20,
  getAddressEncoder as getAddressEncoder24,
  getI64Decoder as getI64Decoder18,
  getI64Encoder as getI64Encoder18,
  getStructDecoder as getStructDecoder35,
  getStructEncoder as getStructEncoder35,
  getU32Decoder as getU32Decoder19,
  getU32Encoder as getU32Encoder19,
  getU64Decoder as getU64Decoder9,
  getU64Encoder as getU64Encoder9,
  getUtf8Decoder as getUtf8Decoder16,
  getUtf8Encoder as getUtf8Encoder16
} from "@solana/kit";
function getMinterRegisteredEncoder() {
  return getStructEncoder35([
    ["minter", getAddressEncoder24()],
    ["label", addEncoderSizePrefix16(getUtf8Encoder16(), getU32Encoder19())],
    ["maxXpPerCall", getU64Encoder9()],
    ["timestamp", getI64Encoder18()]
  ]);
}
function getMinterRegisteredDecoder() {
  return getStructDecoder35([
    ["minter", getAddressDecoder20()],
    ["label", addDecoderSizePrefix16(getUtf8Decoder16(), getU32Decoder19())],
    ["maxXpPerCall", getU64Decoder9()],
    ["timestamp", getI64Decoder18()]
  ]);
}
function getMinterRegisteredCodec() {
  return combineCodec35(
    getMinterRegisteredEncoder(),
    getMinterRegisteredDecoder()
  );
}

// src/generated/types/minterRevoked.ts
import {
  combineCodec as combineCodec36,
  getAddressDecoder as getAddressDecoder21,
  getAddressEncoder as getAddressEncoder25,
  getI64Decoder as getI64Decoder19,
  getI64Encoder as getI64Encoder19,
  getStructDecoder as getStructDecoder36,
  getStructEncoder as getStructEncoder36,
  getU64Decoder as getU64Decoder10,
  getU64Encoder as getU64Encoder10
} from "@solana/kit";
function getMinterRevokedEncoder() {
  return getStructEncoder36([
    ["minter", getAddressEncoder25()],
    ["totalXpMinted", getU64Encoder10()],
    ["timestamp", getI64Encoder19()]
  ]);
}
function getMinterRevokedDecoder() {
  return getStructDecoder36([
    ["minter", getAddressDecoder21()],
    ["totalXpMinted", getU64Decoder10()],
    ["timestamp", getI64Decoder19()]
  ]);
}
function getMinterRevokedCodec() {
  return combineCodec36(getMinterRevokedEncoder(), getMinterRevokedDecoder());
}

// src/generated/types/xpRewarded.ts
import {
  addDecoderSizePrefix as addDecoderSizePrefix17,
  addEncoderSizePrefix as addEncoderSizePrefix17,
  combineCodec as combineCodec37,
  getAddressDecoder as getAddressDecoder22,
  getAddressEncoder as getAddressEncoder26,
  getI64Decoder as getI64Decoder20,
  getI64Encoder as getI64Encoder20,
  getStructDecoder as getStructDecoder37,
  getStructEncoder as getStructEncoder37,
  getU32Decoder as getU32Decoder20,
  getU32Encoder as getU32Encoder20,
  getU64Decoder as getU64Decoder11,
  getU64Encoder as getU64Encoder11,
  getUtf8Decoder as getUtf8Decoder17,
  getUtf8Encoder as getUtf8Encoder17
} from "@solana/kit";
function getXpRewardedEncoder() {
  return getStructEncoder37([
    ["minter", getAddressEncoder26()],
    ["recipient", getAddressEncoder26()],
    ["amount", getU64Encoder11()],
    ["memo", addEncoderSizePrefix17(getUtf8Encoder17(), getU32Encoder20())],
    ["timestamp", getI64Encoder20()]
  ]);
}
function getXpRewardedDecoder() {
  return getStructDecoder37([
    ["minter", getAddressDecoder22()],
    ["recipient", getAddressDecoder22()],
    ["amount", getU64Decoder11()],
    ["memo", addDecoderSizePrefix17(getUtf8Decoder17(), getU32Decoder20())],
    ["timestamp", getI64Decoder20()]
  ]);
}
function getXpRewardedCodec() {
  return combineCodec37(getXpRewardedEncoder(), getXpRewardedDecoder());
}
export {
  ACHIEVEMENT_RECEIPT_DISCRIMINATOR,
  ACHIEVEMENT_TYPE_DISCRIMINATOR,
  AWARD_ACHIEVEMENT_DISCRIMINATOR,
  CLOSE_ENROLLMENT_DISCRIMINATOR,
  COMPLETE_LESSON_DISCRIMINATOR,
  CONFIG_DISCRIMINATOR,
  COURSE_DISCRIMINATOR,
  CREATE_ACHIEVEMENT_TYPE_DISCRIMINATOR,
  CREATE_COURSE_DISCRIMINATOR,
  DEACTIVATE_ACHIEVEMENT_TYPE_DISCRIMINATOR,
  ENROLLMENT_DISCRIMINATOR,
  ENROLL_DISCRIMINATOR,
  FINALIZE_COURSE_DISCRIMINATOR,
  INITIALIZE_DISCRIMINATOR,
  ISSUE_CREDENTIAL_DISCRIMINATOR,
  MINTER_ROLE_DISCRIMINATOR,
  ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_ID_TOO_LONG,
  ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_NAME_TOO_LONG,
  ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_NOT_ACTIVE,
  ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_SUPPLY_EXHAUSTED,
  ONCHAIN_ACADEMY_ERROR__ACHIEVEMENT_URI_TOO_LONG,
  ONCHAIN_ACADEMY_ERROR__COURSE_ALREADY_FINALIZED,
  ONCHAIN_ACADEMY_ERROR__COURSE_ID_EMPTY,
  ONCHAIN_ACADEMY_ERROR__COURSE_ID_TOO_LONG,
  ONCHAIN_ACADEMY_ERROR__COURSE_NOT_ACTIVE,
  ONCHAIN_ACADEMY_ERROR__COURSE_NOT_COMPLETED,
  ONCHAIN_ACADEMY_ERROR__COURSE_NOT_FINALIZED,
  ONCHAIN_ACADEMY_ERROR__CREDENTIAL_ALREADY_ISSUED,
  ONCHAIN_ACADEMY_ERROR__CREDENTIAL_ASSET_MISMATCH,
  ONCHAIN_ACADEMY_ERROR__ENROLLMENT_COURSE_MISMATCH,
  ONCHAIN_ACADEMY_ERROR__INVALID_AMOUNT,
  ONCHAIN_ACADEMY_ERROR__INVALID_DIFFICULTY,
  ONCHAIN_ACADEMY_ERROR__INVALID_LESSON_COUNT,
  ONCHAIN_ACADEMY_ERROR__INVALID_XP_REWARD,
  ONCHAIN_ACADEMY_ERROR__LABEL_TOO_LONG,
  ONCHAIN_ACADEMY_ERROR__LESSON_ALREADY_COMPLETED,
  ONCHAIN_ACADEMY_ERROR__LESSON_OUT_OF_BOUNDS,
  ONCHAIN_ACADEMY_ERROR__MINTER_AMOUNT_EXCEEDED,
  ONCHAIN_ACADEMY_ERROR__MINTER_NOT_ACTIVE,
  ONCHAIN_ACADEMY_ERROR__OVERFLOW,
  ONCHAIN_ACADEMY_ERROR__PREREQUISITE_NOT_MET,
  ONCHAIN_ACADEMY_ERROR__UNAUTHORIZED,
  ONCHAIN_ACADEMY_ERROR__UNENROLL_COOLDOWN,
  ONCHAIN_ACADEMY_PROGRAM_ADDRESS,
  OnchainAcademyAccount,
  OnchainAcademyInstruction,
  REGISTER_MINTER_DISCRIMINATOR,
  REVOKE_MINTER_DISCRIMINATOR,
  REWARD_XP_DISCRIMINATOR,
  UPDATE_CONFIG_DISCRIMINATOR,
  UPDATE_COURSE_DISCRIMINATOR,
  UPGRADE_CREDENTIAL_DISCRIMINATOR,
  decodeAchievementReceipt,
  decodeAchievementType,
  decodeConfig,
  decodeCourse,
  decodeEnrollment,
  decodeMinterRole,
  fetchAchievementReceipt,
  fetchAchievementType,
  fetchAllAchievementReceipt,
  fetchAllAchievementType,
  fetchAllConfig,
  fetchAllCourse,
  fetchAllEnrollment,
  fetchAllMaybeAchievementReceipt,
  fetchAllMaybeAchievementType,
  fetchAllMaybeConfig,
  fetchAllMaybeCourse,
  fetchAllMaybeEnrollment,
  fetchAllMaybeMinterRole,
  fetchAllMinterRole,
  fetchConfig,
  fetchCourse,
  fetchEnrollment,
  fetchMaybeAchievementReceipt,
  fetchMaybeAchievementType,
  fetchMaybeConfig,
  fetchMaybeCourse,
  fetchMaybeEnrollment,
  fetchMaybeMinterRole,
  fetchMinterRole,
  getAchievementAwardedCodec,
  getAchievementAwardedDecoder,
  getAchievementAwardedEncoder,
  getAchievementReceiptCodec,
  getAchievementReceiptDecoder,
  getAchievementReceiptDiscriminatorBytes,
  getAchievementReceiptEncoder,
  getAchievementReceiptSize,
  getAchievementTypeCodec,
  getAchievementTypeCreatedCodec,
  getAchievementTypeCreatedDecoder,
  getAchievementTypeCreatedEncoder,
  getAchievementTypeDeactivatedCodec,
  getAchievementTypeDeactivatedDecoder,
  getAchievementTypeDeactivatedEncoder,
  getAchievementTypeDecoder,
  getAchievementTypeDiscriminatorBytes,
  getAchievementTypeEncoder,
  getAwardAchievementDiscriminatorBytes,
  getAwardAchievementInstruction,
  getAwardAchievementInstructionAsync,
  getAwardAchievementInstructionDataCodec,
  getAwardAchievementInstructionDataDecoder,
  getAwardAchievementInstructionDataEncoder,
  getCloseEnrollmentDiscriminatorBytes,
  getCloseEnrollmentInstruction,
  getCloseEnrollmentInstructionDataCodec,
  getCloseEnrollmentInstructionDataDecoder,
  getCloseEnrollmentInstructionDataEncoder,
  getCompleteLessonDiscriminatorBytes,
  getCompleteLessonInstruction,
  getCompleteLessonInstructionAsync,
  getCompleteLessonInstructionDataCodec,
  getCompleteLessonInstructionDataDecoder,
  getCompleteLessonInstructionDataEncoder,
  getConfigCodec,
  getConfigDecoder,
  getConfigDiscriminatorBytes,
  getConfigEncoder,
  getConfigSize,
  getConfigUpdatedCodec,
  getConfigUpdatedDecoder,
  getConfigUpdatedEncoder,
  getCourseCodec,
  getCourseCreatedCodec,
  getCourseCreatedDecoder,
  getCourseCreatedEncoder,
  getCourseDecoder,
  getCourseDiscriminatorBytes,
  getCourseEncoder,
  getCourseFinalizedCodec,
  getCourseFinalizedDecoder,
  getCourseFinalizedEncoder,
  getCourseUpdatedCodec,
  getCourseUpdatedDecoder,
  getCourseUpdatedEncoder,
  getCreateAchievementTypeDiscriminatorBytes,
  getCreateAchievementTypeInstruction,
  getCreateAchievementTypeInstructionAsync,
  getCreateAchievementTypeInstructionDataCodec,
  getCreateAchievementTypeInstructionDataDecoder,
  getCreateAchievementTypeInstructionDataEncoder,
  getCreateCourseDiscriminatorBytes,
  getCreateCourseInstruction,
  getCreateCourseInstructionAsync,
  getCreateCourseInstructionDataCodec,
  getCreateCourseInstructionDataDecoder,
  getCreateCourseInstructionDataEncoder,
  getCredentialIssuedCodec,
  getCredentialIssuedDecoder,
  getCredentialIssuedEncoder,
  getCredentialUpgradedCodec,
  getCredentialUpgradedDecoder,
  getCredentialUpgradedEncoder,
  getDeactivateAchievementTypeDiscriminatorBytes,
  getDeactivateAchievementTypeInstruction,
  getDeactivateAchievementTypeInstructionAsync,
  getDeactivateAchievementTypeInstructionDataCodec,
  getDeactivateAchievementTypeInstructionDataDecoder,
  getDeactivateAchievementTypeInstructionDataEncoder,
  getEnrollDiscriminatorBytes,
  getEnrollInstruction,
  getEnrollInstructionAsync,
  getEnrollInstructionDataCodec,
  getEnrollInstructionDataDecoder,
  getEnrollInstructionDataEncoder,
  getEnrolledCodec,
  getEnrolledDecoder,
  getEnrolledEncoder,
  getEnrollmentClosedCodec,
  getEnrollmentClosedDecoder,
  getEnrollmentClosedEncoder,
  getEnrollmentCodec,
  getEnrollmentDecoder,
  getEnrollmentDiscriminatorBytes,
  getEnrollmentEncoder,
  getFinalizeCourseDiscriminatorBytes,
  getFinalizeCourseInstruction,
  getFinalizeCourseInstructionAsync,
  getFinalizeCourseInstructionDataCodec,
  getFinalizeCourseInstructionDataDecoder,
  getFinalizeCourseInstructionDataEncoder,
  getInitializeDiscriminatorBytes,
  getInitializeInstruction,
  getInitializeInstructionAsync,
  getInitializeInstructionDataCodec,
  getInitializeInstructionDataDecoder,
  getInitializeInstructionDataEncoder,
  getIssueCredentialDiscriminatorBytes,
  getIssueCredentialInstruction,
  getIssueCredentialInstructionAsync,
  getIssueCredentialInstructionDataCodec,
  getIssueCredentialInstructionDataDecoder,
  getIssueCredentialInstructionDataEncoder,
  getLessonCompletedCodec,
  getLessonCompletedDecoder,
  getLessonCompletedEncoder,
  getMinterRegisteredCodec,
  getMinterRegisteredDecoder,
  getMinterRegisteredEncoder,
  getMinterRevokedCodec,
  getMinterRevokedDecoder,
  getMinterRevokedEncoder,
  getMinterRoleCodec,
  getMinterRoleDecoder,
  getMinterRoleDiscriminatorBytes,
  getMinterRoleEncoder,
  getOnchainAcademyErrorMessage,
  getRegisterMinterDiscriminatorBytes,
  getRegisterMinterInstruction,
  getRegisterMinterInstructionAsync,
  getRegisterMinterInstructionDataCodec,
  getRegisterMinterInstructionDataDecoder,
  getRegisterMinterInstructionDataEncoder,
  getRevokeMinterDiscriminatorBytes,
  getRevokeMinterInstruction,
  getRevokeMinterInstructionAsync,
  getRevokeMinterInstructionDataCodec,
  getRevokeMinterInstructionDataDecoder,
  getRevokeMinterInstructionDataEncoder,
  getRewardXpDiscriminatorBytes,
  getRewardXpInstruction,
  getRewardXpInstructionAsync,
  getRewardXpInstructionDataCodec,
  getRewardXpInstructionDataDecoder,
  getRewardXpInstructionDataEncoder,
  getUpdateConfigDiscriminatorBytes,
  getUpdateConfigInstruction,
  getUpdateConfigInstructionAsync,
  getUpdateConfigInstructionDataCodec,
  getUpdateConfigInstructionDataDecoder,
  getUpdateConfigInstructionDataEncoder,
  getUpdateCourseDiscriminatorBytes,
  getUpdateCourseInstruction,
  getUpdateCourseInstructionAsync,
  getUpdateCourseInstructionDataCodec,
  getUpdateCourseInstructionDataDecoder,
  getUpdateCourseInstructionDataEncoder,
  getUpgradeCredentialDiscriminatorBytes,
  getUpgradeCredentialInstruction,
  getUpgradeCredentialInstructionAsync,
  getUpgradeCredentialInstructionDataCodec,
  getUpgradeCredentialInstructionDataDecoder,
  getUpgradeCredentialInstructionDataEncoder,
  getXpRewardedCodec,
  getXpRewardedDecoder,
  getXpRewardedEncoder,
  identifyOnchainAcademyAccount,
  identifyOnchainAcademyInstruction,
  isOnchainAcademyError,
  onchainAcademyProgram,
  parseAwardAchievementInstruction,
  parseCloseEnrollmentInstruction,
  parseCompleteLessonInstruction,
  parseCreateAchievementTypeInstruction,
  parseCreateCourseInstruction,
  parseDeactivateAchievementTypeInstruction,
  parseEnrollInstruction,
  parseFinalizeCourseInstruction,
  parseInitializeInstruction,
  parseIssueCredentialInstruction,
  parseOnchainAcademyInstruction,
  parseRegisterMinterInstruction,
  parseRevokeMinterInstruction,
  parseRewardXpInstruction,
  parseUpdateConfigInstruction,
  parseUpdateCourseInstruction,
  parseUpgradeCredentialInstruction
};
