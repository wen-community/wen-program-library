import {type Provider, type IdlAccounts} from '@coral-xyz/anchor';
import {type WenNewStandard} from '../programs';
import {getGroupAccountPda, getMemberAccountPda, getMetadataProgram} from '../utils';

export type GroupAccount = IdlAccounts<WenNewStandard>['tokenGroup'];

export async function getGroupAccount(provider: Provider, groupMint: string): Promise<GroupAccount | undefined> {
	const metadataProgram = getMetadataProgram(provider);
	const groupAccount = getGroupAccountPda(groupMint);
	return metadataProgram.account.tokenGroup.fetch(groupAccount)
		.then(account => account)
		.catch(() => undefined);
}

export type GroupMemberAccount = IdlAccounts<WenNewStandard>['tokenGroupMember'];

export async function getGroupMemberAccount(provider: Provider, mint: string): Promise<GroupMemberAccount | undefined> {
	const metadataProgram = getMetadataProgram(provider);
	const groupMemberAccount = getMemberAccountPda(mint);
	return metadataProgram.account.tokenGroupMember.fetch(groupMemberAccount)
		.then(account => account)
		.catch(() => undefined);
}
