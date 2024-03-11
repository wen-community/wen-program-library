import {type Provider} from '@coral-xyz/anchor';
import {
	getAtaAddress, getExtraMetasAccountPda, getManagerAccountPda, getMemberAccountPda, getMetadataProgram,
} from '../utils/core';
import {type CommonArgs, type Creator} from '../utils/types';
import {PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram} from '@solana/web3.js';
import {tokenProgramId} from '../utils/constants';
import {ASSOCIATED_TOKEN_PROGRAM_ID} from '@solana/spl-token';

export type CreateNftArgs = {
	mint: string;
	name: string;
	symbol: string;
	uri: string;
	// eslint-disable-next-line @typescript-eslint/ban-types
	permanentDelegate: PublicKey | null;
	receiver: string;
} & CommonArgs;

export const getMintNftIx = async (provider: Provider, args: CreateNftArgs) => {
	const metadataProgram = getMetadataProgram(provider);

	const managerAccount = getManagerAccountPda();

	const ix = await metadataProgram.methods
		.createMintAccount(args)
		.accountsStrict({
			payer: args.payer,
			authority: args.authority,
			receiver: args.receiver,
			mint: args.mint,
			mintTokenAccount: getAtaAddress(args.mint, args.receiver),
			systemProgram: SystemProgram.programId,
			rent: SYSVAR_RENT_PUBKEY,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			tokenProgram: tokenProgramId,
			manager: managerAccount,
		})
		.instruction();
	return ix;
};

export type AddGroupArgs = {
	mint: string;
	group: string;
} & CommonArgs;

export const getAddNftToGroupIx = async (provider: Provider, args: AddGroupArgs) => {
	const metadataProgram = getMetadataProgram(provider);
	const memberAccount = getMemberAccountPda(args.mint);

	const ix = await metadataProgram.methods
		.addMintToGroup()
		.accountsStrict({
			payer: args.payer,
			authority: args.authority,
			mint: args.mint,
			systemProgram: SystemProgram.programId,
			tokenProgram: tokenProgramId,
			group: args.group,
			member: memberAccount,
			manager: getManagerAccountPda(),
		})
		.instruction();

	return ix;
};

export type AddRoyaltiesArgs = {
	mint: string;
	royaltyBasisPoints: number;
	creators: Creator[];
} & CommonArgs;

export const getAddRoyaltiesIx = async (provider: Provider, args: AddRoyaltiesArgs) => {
	const metadataProgram = getMetadataProgram(provider);

	const extraMetasAccount = getExtraMetasAccountPda(args.mint);

	const ix = await metadataProgram.methods
		.addRoyalties({
			royaltyBasisPoints: args.royaltyBasisPoints,
			creators: args.creators.map(creator => ({
				address: new PublicKey(creator.address),
				share: creator.share,
			})),
		})
		.accountsStrict({
			payer: args.payer,
			authority: args.authority,
			systemProgram: SystemProgram.programId,
			tokenProgram: tokenProgramId,
			extraMetasAccount,
			mint: args.mint,
		})
		.instruction();

	return ix;
};
