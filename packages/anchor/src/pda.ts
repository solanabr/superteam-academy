import { PublicKey } from "@solana/web3.js";
import { PDA_SEEDS } from "./idl";

export function findConfigPDA(programId: PublicKey): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([...PDA_SEEDS.config], programId);
}

export function findCoursePDA(courseId: string, programId: PublicKey): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([...PDA_SEEDS.course(courseId)], programId);
}

export function findEnrollmentPDA(
	courseId: string,
	learner: PublicKey,
	programId: PublicKey
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[...PDA_SEEDS.enrollment(courseId, learner)],
		programId
	);
}

export function findMinterRolePDA(minterKey: PublicKey, programId: PublicKey): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([...PDA_SEEDS.minter(minterKey)], programId);
}

export function findAchievementTypePDA(
	achievementId: string,
	programId: PublicKey
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([...PDA_SEEDS.achievement(achievementId)], programId);
}

export function findAchievementReceiptPDA(
	achievementId: string,
	recipient: PublicKey,
	programId: PublicKey
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[...PDA_SEEDS.achievementReceipt(achievementId, recipient)],
		programId
	);
}
