import {ASSOCIATED_TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {tokenProgramId} from '../utils/constants';
import {
	getAtaAddress, getGroupAccountPda, getManagerAccountPda, getMetadataProgram,
} from '../utils/core';
import {SYSVAR_RENT_PUBKEY, SystemProgram} from '@solana/web3.js';
import {type Provider} from '@coral-xyz/anchor';
import {type CommonArgs} from '../utils';

export type CreateGroupArgs = {
	groupMint: string;
	name: string;
	symbol: string;
	uri: string;
	maxSize: number;
	receiver: string;
} & CommonArgs;

export const getCreateGroupIx = async (provider: Provider, args: CreateGroupArgs) => {
	const metadataProgram = getMetadataProgram(provider);
	const managerAccount = getManagerAccountPda();
	const groupAccount = getGroupAccountPda(args.groupMint);

	const ix = await metadataProgram.methods
		.createGroupAccount({
			name: args.name,
			symbol: args.symbol,
			uri: args.uri,
			maxSize: args.maxSize,
		})
		.accountsStrict({
			payer: args.payer,
			authority: args.authority,
			receiver: args.receiver,
			mint: args.groupMint,
			mintTokenAccount: getAtaAddress(args.groupMint, args.receiver),
			systemProgram: SystemProgram.programId,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			tokenProgram: tokenProgramId,
			group: groupAccount,
			manager: managerAccount,
		})
		.instruction();

	return ix;
};

export const getInitManagerIx = async (provider: Provider, payer: string) => {
	const metadataProgram = getMetadataProgram(provider);
	const managerAccount = getManagerAccountPda();

	const ix = await metadataProgram.methods
		.initManagerAccount()
		.accountsStrict({
			payer,
			systemProgram: SystemProgram.programId,
			manager: managerAccount,
		})
		.instruction();

	return ix;
};
