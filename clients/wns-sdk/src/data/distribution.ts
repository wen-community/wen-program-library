import {type Provider, type IdlAccounts} from '@coral-xyz/anchor';
import {type WenRoyaltyDistribution} from '../programs';
import {getDistributionAccountPda, getDistributionProgram} from '../utils';

export type DistributionAccount = IdlAccounts<WenRoyaltyDistribution>['distributionAccount'];

export async function getDistributionAccount(provider: Provider, groupMint: string, paymentMint: string): Promise<DistributionAccount | undefined> {
	const distributionProgram = getDistributionProgram(provider);
	const distributionAccount = getDistributionAccountPda(groupMint, paymentMint);
	return distributionProgram.account.distributionAccount.fetch(distributionAccount)
		.then(account => account)
		.catch(() => undefined);
}
