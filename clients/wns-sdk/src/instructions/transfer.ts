import {PublicKey, SystemProgram, type TransactionInstruction} from '@solana/web3.js';
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	createAssociatedTokenAccountInstruction,
	createTransferCheckedInstruction,
} from '@solana/spl-token';
import {
	getApproveAccountPda,
	getAtaAddress,
	getDistributionAccountPda,
	getExtraMetasAccountPda,
	getMetadataProgram,
} from '../utils/core';
import {distributionProgramId, tokenProgramId, wnsProgramId} from '../utils/constants';
import {type CommonArgs} from '../utils';
import {BN, type Provider} from '@coral-xyz/anchor';

export type ApproveTransferNftArgs = {
	buyAmount: number;
	mint: string;
	groupMint: string;
	paymentMint: string;
} & CommonArgs;

export const getNftTransferApproveIx = async (provider: Provider, args: ApproveTransferNftArgs): Promise<TransactionInstruction> => {
	const metadataProgram = getMetadataProgram(provider);
	const ix = await metadataProgram.methods
		.approveTransfer(new BN(args.buyAmount))
		.accountsStrict({
			payer: args.payer,
			authority: args.authority,
			mint: args.mint,
			systemProgram: SystemProgram.programId,
			tokenProgram: tokenProgramId,
			approveAccount: getApproveAccountPda(args.mint),
			paymentMint: args.paymentMint,
			distributionTokenAccount: getAtaAddress(args.paymentMint, getDistributionAccountPda(args.groupMint, args.paymentMint).toString()),
			authorityTokenAccount: getAtaAddress(args.mint, args.authority),
			distributionAccount: getDistributionAccountPda(args.groupMint, args.paymentMint),
			distributionProgram: distributionProgramId,
		})
		.instruction();
	return ix;
};

export type TransferNftArgs = {
	mint: string;
	sender: string;
	receiver: string;
	groupMint: string;
	paymentMint: string;
	buyAmount: number;
};

export const getNftTransferIx = async (args: TransferNftArgs) => {
	const transferIx = createTransferCheckedInstruction(
		getAtaAddress(args.mint, args.sender),
		new PublicKey(args.mint),
		getAtaAddress(args.mint, args.receiver),
		new PublicKey(args.sender),
		1,
		0,
		[],
		tokenProgramId,
	);
	// Add token hook extra keys
	transferIx.keys = transferIx.keys.concat([
		// System program
		{pubkey: getApproveAccountPda(args.mint), isSigner: false, isWritable: true},
		{pubkey: wnsProgramId, isSigner: false, isWritable: false},
		// Extra metas list account
		{pubkey: getExtraMetasAccountPda(args.mint), isSigner: false, isWritable: false},
	]);
	return transferIx;
};

export type AtaCreateIxArgs = {
	mint: string;
} & CommonArgs;

export const getAtaCreateIx = async (args: AtaCreateIxArgs) => {
	const ataIx = createAssociatedTokenAccountInstruction(
		new PublicKey(args.payer),
		getAtaAddress(args.mint, args.authority),
		new PublicKey(args.authority),
		new PublicKey(args.mint),
		tokenProgramId,
		ASSOCIATED_TOKEN_PROGRAM_ID,
	);
	return ataIx;
};
