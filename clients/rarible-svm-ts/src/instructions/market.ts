import {
	PublicKey,
	SystemProgram,
} from '@solana/web3.js';
import {type Provider, BN} from '@coral-xyz/anchor';
import {
	getEventAuthority, getMarketPda, getMarketplaceProgram,
	getVerificationPda,
	marketplaceProgramId,
} from '../utils';

export type InitMarketParams = {
	marketIdentifier: string;
	feeRecipients: string[];
	feeBps: number[];
};

// Initialize Market
export const getInitializeMarket = async (provider: Provider, marketParams: InitMarketParams) => {
	const marketProgram = getMarketplaceProgram(provider);
	const market = getMarketPda(marketParams.marketIdentifier);
	const eventAuthority = getEventAuthority();

	let feeRecipients = marketParams.feeRecipients;
	let feeBps = marketParams.feeBps;

	if (feeRecipients.length !== 3 || feeBps.length !== 3) {
		throw Error("Invalid fee params");
	}

	const ix = await marketProgram.methods
		.initMarket({ feeBps: marketParams.feeBps.map((f) => new BN(f)), feeRecipients: marketParams.feeRecipients.map((f) => new PublicKey(f)) })
		.accountsStrict({
			initializer: provider.publicKey,
			marketIdentifier: marketParams.marketIdentifier,
			market,
			systemProgram: SystemProgram.programId,
			program: marketplaceProgramId,
			eventAuthority,
		})
		.instruction();
	return ix;
};

// Verify Mint
export const getVerifyMint = async (provider: Provider, nftMint: string, marketAddress: string) => {
	const marketProgram = getMarketplaceProgram(provider);
	const verificationPda = getVerificationPda(marketAddress, nftMint);

	const ix = await marketProgram.methods
		.verifyMint()
		.accountsStrict({
			initializer: provider.publicKey,
			market: marketAddress,
			nftMint,
			verification: verificationPda,
			systemProgram: SystemProgram.programId,
		})
		.instruction();
	return ix;
};
