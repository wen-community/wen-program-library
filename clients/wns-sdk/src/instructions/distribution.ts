import {PublicKey, SystemProgram} from '@solana/web3.js';
import {getAtaAddress, getDistributionAccountPda, getDistributionProgram} from '../utils/core';
import {type Provider} from '@coral-xyz/anchor';
import {tokenProgramId} from '../utils/constants';
import {type CommonArgs} from '../utils';

export type AddDistributionArgs = {
	groupMint: string;
	paymentMint: string;
} & CommonArgs;

export const getAddDistributionIx = async (provider: Provider, args: AddDistributionArgs) => {
	const distributionProgram = getDistributionProgram(provider);
	const distributionAccount = getDistributionAccountPda(args.groupMint, args.paymentMint);

	const ix = await distributionProgram.methods
		.initializeDistribution(new PublicKey(args.paymentMint))
		.accountsStrict({
			payer: args.payer,
			groupMint: args.groupMint,
			systemProgram: SystemProgram.programId,
			distributionAccount,
		})
		.instruction();

	return ix;
};

export type ClaimDistributionArgs = {
	group: string;
	creator: string;
	mintToClaim: string;
};

export const getClaimDistributionIx = async (provider: Provider, args: ClaimDistributionArgs) => {
	const distributionProgram = getDistributionProgram(provider);
	const distributionAccount = getDistributionAccountPda(args.group, args.mintToClaim).toString();

	let creatorTokenAccount = args.creator;
	let distributionTokenAccount = distributionAccount;

	if (args.mintToClaim !== PublicKey.default.toString()) {
		creatorTokenAccount = getAtaAddress(args.mintToClaim, args.creator).toString();
		distributionTokenAccount = getAtaAddress(args.mintToClaim, distributionAccount).toString();
	}

	const ix = await distributionProgram.methods
		.claimDistribution()
		.accountsStrict({
			creator: args.creator,
			paymentMint: new PublicKey(args.mintToClaim),
			distribution: distributionAccount,
			creatorTokenAccount,
			distributionTokenAccount,
			tokenProgram: tokenProgramId,
		})
		.instruction();

	return ix;
};

