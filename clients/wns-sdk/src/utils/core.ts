import {
	AnchorProvider, type Idl, Program, type Provider, utils,
} from '@coral-xyz/anchor';
import {Connection, PublicKey} from '@solana/web3.js';
import {distributionProgramId, wnsProgramId, tokenProgramId} from './constants';
import {ASSOCIATED_TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {
	distributionIdl,
	metadataIdl,
	type WenRoyaltyDistribution,
	type WenNewStandard,
} from '../programs';

export const getProvider = () => {
	const connection = new Connection(process.env.RPC_URL ?? 'https://api.devnet.solana.com', 'confirmed');
	const anchorProvider = AnchorProvider.local();
	const provider = new AnchorProvider(connection, anchorProvider.wallet, {...AnchorProvider.defaultOptions(), commitment: 'confirmed'});
	return provider;
};

export const getMetadataProgram = (provider: Provider) => new Program(
	metadataIdl as Idl,
	provider,
) as unknown as Program<WenNewStandard>;

export const getDistributionProgram = (provider: Provider) => new Program(
	distributionIdl as Idl,
	provider,
) as unknown as Program<WenRoyaltyDistribution>;

export const getProgramAddress = (seeds: Uint8Array[], programId: PublicKey) => {
	const [key] = PublicKey.findProgramAddressSync(seeds, programId);
	return key;
};

export const getAtaAddress = (mint: string, owner: string): PublicKey => getProgramAddress(
	[new PublicKey(owner).toBuffer(), tokenProgramId.toBuffer(), new PublicKey(mint).toBuffer()],
	ASSOCIATED_TOKEN_PROGRAM_ID,
);

export const getGroupAccountPda = (mint: string) => {
	const [groupAccount] = PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('group'), new PublicKey(mint).toBuffer()], wnsProgramId);

	return groupAccount;
};

export const getMemberAccountPda = (mint: string) => {
	const [groupAccount] = PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('member'), new PublicKey(mint).toBuffer()], wnsProgramId);

	return groupAccount;
};

export const getExtraMetasAccountPda = (mint: string) => {
	const [extraMetasAccount] = PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('extra-account-metas'), new PublicKey(mint).toBuffer()], wnsProgramId);

	return extraMetasAccount;
};

export const getDistributionAccountPda = (groupMint: string, paymentMint: string) => {
	const [distributionAccount] = PublicKey.findProgramAddressSync([new PublicKey(groupMint).toBuffer(), new PublicKey(paymentMint).toBuffer()], distributionProgramId);

	return distributionAccount;
};

export const getManagerAccountPda = () => {
	const [managerAccount] = PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('manager')], wnsProgramId);

	return managerAccount;
};

export const getApproveAccountPda = (mint: string) => {
	const [approveAccount] = PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('approve-account'), new PublicKey(mint).toBuffer()], wnsProgramId);

	return approveAccount;
};
