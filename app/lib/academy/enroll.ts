import {
  appendTransactionMessageInstruction,
  createTransactionMessage,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Rpc,
  type RpcSubscriptions,
  type SendTransactionApi,
  type SignatureNotificationsApi,
  type SlotNotificationsApi,
  type TransactionModifyingSigner,
  type GetEpochInfoApi,
  type GetLatestBlockhashApi,
  type GetSignatureStatusesApi,
  type GetAccountInfoApi,
  type Address,
} from "@solana/kit";
import {
  fetchMaybeCourse,
  fetchMaybeEnrollment,
  getEnrollInstructionAsync,
} from "@superteam/academy-sdk";
import { getCoursePda, getEnrollmentPda } from "./pdas";

type RpcLike = Rpc<
  GetAccountInfoApi &
  GetEpochInfoApi &
    GetLatestBlockhashApi &
    GetSignatureStatusesApi &
    SendTransactionApi
>;
type RpcSubscriptionsLike = RpcSubscriptions<
  SignatureNotificationsApi & SlotNotificationsApi
>;

export async function sendEnrollTransaction(input: {
  courseId: string;
  signer: TransactionModifyingSigner;
  rpc: RpcLike;
  rpcSubscriptions: RpcSubscriptionsLike;
}): Promise<string> {
  const coursePda = await getCoursePda(input.courseId);
  const maybeCourse = await fetchMaybeCourse(input.rpc, coursePda);
  if (!maybeCourse.exists) {
    throw new Error(
      `Course "${input.courseId}" is not initialized on the selected cluster/RPC.`
    );
  }

  const learnerAddress = input.signer.address as Address;
  const enrollmentPda = await getEnrollmentPda(input.courseId, learnerAddress);
  const maybeEnrollment = await fetchMaybeEnrollment(input.rpc, enrollmentPda);
  if (maybeEnrollment.exists) {
    throw new Error("You are already enrolled in this course.");
  }

  const enrollInstruction = await getEnrollInstructionAsync({
    courseId: input.courseId,
    learner: input.signer,
  });

  const { value: latestBlockhash } = await input.rpc.getLatestBlockhash().send();
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (message) => setTransactionMessageFeePayerSigner(input.signer, message),
    (message) =>
      setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
    (message) => appendTransactionMessageInstruction(enrollInstruction, message)
  );

  const signedTransaction = await signTransactionMessageWithSigners(
    transactionMessage
  );

  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc: input.rpc,
    rpcSubscriptions: input.rpcSubscriptions,
  });

  await sendAndConfirmTransaction(
    signedTransaction as Parameters<typeof sendAndConfirmTransaction>[0],
    { commitment: "confirmed" }
  );

  return getSignatureFromTransaction(signedTransaction);
}
