import {type Provider, type IdlAccounts} from '@coral-xyz/anchor';
import {type WenNewStandard} from '../programs';
import {getManagerAccountPda, getMetadataProgram} from '../utils';

export type MangerAccount = IdlAccounts<WenNewStandard>['manager'];

export async function getManagerAccount(provider: Provider): Promise<MangerAccount | undefined> {
	const metadataProgram = getMetadataProgram(provider);
	const managerAccount = getManagerAccountPda();
	return metadataProgram.account.manager.fetch(managerAccount, 'confirmed')
		.then(account => account)
		.catch(() => undefined);
}
