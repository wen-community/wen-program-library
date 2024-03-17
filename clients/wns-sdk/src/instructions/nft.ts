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
	receiver: string;
	permanentDelegate?: PublicKey;
} & CommonArgs;

export const getMintNftIx = async (provider: Provider, args: CreateNftArgs) => {
	const metadataProgram = getMetadataProgram(provider);

	const managerAccount = getManagerAccountPda();

	const ix = await metadataProgram.methods
		.createMintAccount({
			...args,
			permanentDelegate: args.permanentDelegate ?? null,
		})
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

export type BurnNftArgs = {
	mint: string;
} & CommonArgs;

export const getBurnNftIx = async (provider: Provider, args: BurnNftArgs) => {
	const metadataProgram = getMetadataProgram(provider);

	const ix = await metadataProgram.methods
		.burnMintAccount()
		.accountsStrict({
			receiver: args.payer,
			user: args.authority,
			mint: args.mint,
			mintTokenAccount: getAtaAddress(args.mint, args.authority),
			manager: getManagerAccountPda(),
			tokenProgram: tokenProgramId,
		})
		.instruction();

	return ix;
};

export type ThawNftArgs = {
	mint: string;
	delegateAuthority: string;
} & CommonArgs;

export const getThawNftIx = async (provider: Provider, args: ThawNftArgs) => {
	const metadataProgram = getMetadataProgram(provider);

	const ix = await metadataProgram.methods
		.thawMintAccount()
		.accountsStrict({
			payer: args.payer,
			user: args.authority,
			delegateAuthority: args.delegateAuthority,
			mint: args.mint,
			mintTokenAccount: getAtaAddress(args.mint, args.authority),
			manager: getManagerAccountPda(),
			tokenProgram: tokenProgramId,
		})
		.instruction();

	return ix;
};

export type FreezeNftArgs = {
	mint: string;
	delegateAuthority: string;
} & CommonArgs;

export const getFreezeNftIx = async (provider: Provider, args: FreezeNftArgs) => {
	const metadataProgram = getMetadataProgram(provider);

	const ix = await metadataProgram.methods
		.freezeMintAccount()
		.accountsStrict({
			payer: args.payer,
			user: args.authority,
			delegateAuthority: args.delegateAuthority,
			mint: args.mint,
			mintTokenAccount: getAtaAddress(args.mint, args.authority),
			manager: getManagerAccountPda(),
			tokenProgram: tokenProgramId,
		})
		.instruction();

	return ix;
};
