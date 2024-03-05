/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
	Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionMessage, VersionedTransaction, sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
	getAddDistributionIx, getAddNftToGroupIx, getAddRoyaltiesIx, getAtaCreateIx, getClaimDistributionIx, getCreateGroupIx, getDistributionAccount, getDistributionAccountPda, getDistributionProgram, getGroupAccount,
	getGroupAccountPda,
	getGroupMemberAccount,
	getMintNftIx,
	getNftTransferApproveIx,
	getNftTransferIx,
} from '../src';
import {setupTest} from './setup';
// Import {
// 	claimDistribution, createCollectionWithRoyalties, mintNft, purchaseNft, transferNft,
// } from './util';
import {expect, test, describe} from 'vitest';

describe('e2e tests', () => {
	const setup = setupTest();
	let groupMint: string;
	let nftMint: string;

	test('setup provider', async () => {
		await setup.provider.connection.confirmTransaction(await setup.provider.connection.requestAirdrop(setup.payer.publicKey, 1000000000));
		await setup.provider.connection.confirmTransaction(await setup.provider.connection.requestAirdrop(setup.authority.publicKey, 1000000000));
		await setup.provider.connection.confirmTransaction(await setup.provider.connection.requestAirdrop(setup.user1.publicKey, 1000000000));
		await setup.provider.connection.confirmTransaction(await setup.provider.connection.requestAirdrop(setup.user2.publicKey, 1000000000));
	});

	test('create group account and distribution account', async () => {
		const groupMintKp = new Keypair();
		groupMint = groupMintKp.publicKey.toString();
		const args = {
			groupMint,
			name: 'test group',
			symbol: 'TST',
			uri: 'https://arweave.net/123',
			maxSize: 2,
			receiver: setup.payer.publicKey.toString(),
			payer: setup.payer.publicKey.toString(),
			authority: setup.authority.publicKey.toString(),
		};
		const createGroupIx = await getCreateGroupIx(setup.provider, args);
		const addDistributionArgs = {
			groupMint,
			paymentMint: PublicKey.default.toString(),
			payer: setup.payer.publicKey.toString(),
			authority: setup.authority.publicKey.toString(),
		};
		const addDistributionIx = await getAddDistributionIx(setup.provider, addDistributionArgs);
		const blockhash = await setup.provider.connection
			.getLatestBlockhash()
			.then(res => res.blockhash);
		const messageV0 = new TransactionMessage({
			payerKey: setup.payer.publicKey,
			recentBlockhash: blockhash,
			instructions: [createGroupIx, addDistributionIx],
		}).compileToV0Message();
		const txn = new VersionedTransaction(messageV0);
		txn.sign([setup.payer, groupMintKp, setup.authority]);
		const txnId = await setup.provider.connection.sendRawTransaction(txn.serialize());
		await setup.provider.connection.confirmTransaction(txnId);
		expect(txnId).toBeTruthy();
		const groupAccount = await getGroupAccount(setup.provider, groupMint);
		expect(groupAccount?.maxSize).toBe(2);
		expect(groupAccount?.mint.toString()).toBe(groupMint);
		expect(groupAccount?.size).toBe(0);
		expect(groupAccount?.updateAuthority.toString()).toBe(setup.authority.publicKey.toString());
		const distributionAccount = await getDistributionAccount(setup.provider, groupMint, PublicKey.default.toString());
		expect(distributionAccount?.groupMint.toString()).toBe(groupMint);
		expect(distributionAccount?.paymentMint.toString()).toBe(PublicKey.default.toString());
	});

	const royaltyBasisPoints = 500;
	test('create mint account, add to group and add royalties', async () => {
		const nftMintKp = new Keypair();
		nftMint = nftMintKp.publicKey.toString();
		const args = {
			mint: nftMint,
			name: 'test nft',
			symbol: 'TST',
			uri: 'https://arweave.net/123',
			creators: [
				{
					address: setup.payer.publicKey.toString(),
					share: 49,
				},
				{
					address: setup.authority.publicKey.toString(),
					share: 51,
				},
			],
			royaltyBasisPoints,
			receiver: setup.user1.publicKey.toString(),
			payer: setup.payer.publicKey.toString(),
			authority: setup.authority.publicKey.toString(),
		};
		const createIx = await getMintNftIx(setup.provider, args);
		const addArgs = {
			mint: nftMint,
			group: getGroupAccountPda(groupMint).toString(),
			payer: setup.payer.publicKey.toString(),
			authority: setup.authority.publicKey.toString(),
		};
		const addIx = await getAddNftToGroupIx(setup.provider, addArgs);
		const addRoyaltiesIx = await getAddRoyaltiesIx(setup.provider, args);
		const blockhash = await setup.provider.connection
			.getLatestBlockhash()
			.then(res => res.blockhash);
		const messageV0 = new TransactionMessage({
			payerKey: setup.payer.publicKey,
			recentBlockhash: blockhash,
			instructions: [createIx, addIx, addRoyaltiesIx],
		}).compileToV0Message();
		const txn = new VersionedTransaction(messageV0);
		txn.sign([setup.payer, nftMintKp, setup.authority]);
		const txnId = await setup.provider.connection.sendRawTransaction(txn.serialize());
		await setup.provider.connection.confirmTransaction(txnId);
		expect(txnId).toBeTruthy();
		const groupAccount = await getGroupAccount(setup.provider, groupMint);
		expect(groupAccount?.size).toBe(1);
		const groupMemberAccount = await getGroupMemberAccount(setup.provider, nftMint);
		expect(groupMemberAccount?.mint.toString()).toBe(nftMint);
		expect(groupMemberAccount?.group.toString()).toBe(getGroupAccountPda(groupMint).toString());
		expect(groupMemberAccount?.memberNumber).toBe(1);
	});

	let buyAmounts = 0;
	let minRentExemption = 0;

	test('purchase nft from 1', async () => {
		const buyAmount = LAMPORTS_PER_SOL * 15;
		const args = {
			mint: nftMint,
			sender: setup.user1.publicKey.toString(),
			receiver: setup.user2.publicKey.toString(),
			groupMint,
			paymentMint: PublicKey.default.toString(),
			buyAmount,
			payer: setup.payer.publicKey.toString(),
			authority: setup.user1.publicKey.toString(),
		};
		buyAmounts += buyAmount;
		const ataArgs = {
			mint: nftMint,
			authority: setup.user2.publicKey.toString(),
			payer: setup.payer.publicKey.toString(),
		};
		const ataIx = await getAtaCreateIx(ataArgs);
		const approveIx = await getNftTransferApproveIx(setup.provider, args);
		const ix = await getNftTransferIx(args);
		const txn = new Transaction().add(ataIx).add(approveIx).add(ix);
		const txnId = await sendAndConfirmTransaction(setup.provider.connection, txn, [setup.payer, setup.user1]);
		expect(txnId).toBeTruthy();
		minRentExemption = await setup.provider.connection.getMinimumBalanceForRentExemption(477);
		const distributionAccount = await getDistributionAccount(setup.provider, groupMint, PublicKey.default.toString());
		expect(distributionAccount?.claimData.map(d => ({address: d.address.toString(), claimAmount: d.claimAmount.toNumber()})))
			.toStrictEqual([{
				address: setup.payer.publicKey.toString(),
				claimAmount: (buyAmounts * royaltyBasisPoints * 49) / (10000 * 100),
			},
			{
				address: setup.authority.publicKey.toString(),
				claimAmount: (buyAmounts * royaltyBasisPoints * 51) / (10000 * 100),
			}]);
		const distributionBalance = await setup.provider.connection.getBalance(getDistributionAccountPda(groupMint, PublicKey.default.toString()));
		expect(distributionBalance).toBe(((buyAmounts * royaltyBasisPoints) / 10000) + minRentExemption);
	});

	test('purchase nft from 2', async () => {
		const buyAmount = LAMPORTS_PER_SOL * 20;
		const args = {
			mint: nftMint,
			sender: setup.user2.publicKey.toString(),
			receiver: setup.user1.publicKey.toString(),
			groupMint,
			paymentMint: PublicKey.default.toString(),
			buyAmount,
			payer: setup.payer.publicKey.toString(),
			authority: setup.user2.publicKey.toString(),
		};
		buyAmounts += buyAmount;
		const approveIx = await getNftTransferApproveIx(setup.provider, args);
		const ix = await getNftTransferIx(args);
		const txn = new Transaction().add(approveIx).add(ix);
		const txnId = await sendAndConfirmTransaction(setup.provider.connection, txn, [setup.payer, setup.user2]);
		expect(txnId).toBeTruthy();
		const distributionAccount = await getDistributionAccount(setup.provider, groupMint, PublicKey.default.toString());
		expect(distributionAccount?.claimData.map(d => ({address: d.address.toString(), claimAmount: d.claimAmount.toNumber()})))
			.toStrictEqual([{
				address: setup.payer.publicKey.toString(),
				claimAmount: ((buyAmounts * royaltyBasisPoints * 49) / (10000 * 100)),
			},
			{
				address: setup.authority.publicKey.toString(),
				claimAmount: ((buyAmounts * royaltyBasisPoints * 51) / (10000 * 100)),
			}]);
		const distributionBalance = await setup.provider.connection.getBalance(getDistributionAccountPda(groupMint, PublicKey.default.toString()));
		expect(distributionBalance).toBe(((buyAmounts * royaltyBasisPoints) / 10000) + minRentExemption);
	});

	test('claim payer royalties', async () => {
		const args = {
			group: groupMint,
			creator: setup.payer.publicKey.toString(),
			mintToClaim: PublicKey.default.toString(),
		};
		const payerBalanceBefore = await setup.provider.connection.getBalance(setup.payer.publicKey);
		const ix = await getClaimDistributionIx(setup.provider, args);
		const txn = new Transaction().add(ix);
		txn.feePayer = setup.payer.publicKey;
		txn.recentBlockhash = await setup.provider.connection.getLatestBlockhash().then(res => res.blockhash);
		const feeEstimation = (await txn.getEstimatedFee(setup.provider.connection))!;
		const txnId = await sendAndConfirmTransaction(setup.provider.connection, txn, [setup.payer]);
		expect(txnId).toBeTruthy();
		const payerBalanceAfter = await setup.provider.connection.getBalance(setup.payer.publicKey);
		expect(payerBalanceAfter - payerBalanceBefore).toBe(((buyAmounts * royaltyBasisPoints * 49) / (10000 * 100)) - feeEstimation);
		const distributionAccount = await getDistributionAccount(setup.provider, groupMint, PublicKey.default.toString());
		expect(distributionAccount?.claimData.map(d => ({address: d.address.toString(), claimAmount: d.claimAmount.toNumber()})))
			.toStrictEqual([
				{
					address: setup.payer.publicKey.toString(),
					claimAmount: 0,
				},
				{
					address: setup.authority.publicKey.toString(),
					claimAmount: ((buyAmounts * royaltyBasisPoints * 51) / (10000 * 100)),
				},
			]);
	});

	test('claim authority royalties', async () => {
		const args = {
			group: groupMint,
			creator: setup.authority.publicKey.toString(),
			mintToClaim: PublicKey.default.toString(),
		};
		const authorityBalanceBefore = await setup.provider.connection.getBalance(setup.authority.publicKey);
		const ix = await getClaimDistributionIx(setup.provider, args);
		const txn = new Transaction().add(ix);
		txn.feePayer = setup.authority.publicKey;
		txn.recentBlockhash = await setup.provider.connection.getLatestBlockhash().then(res => res.blockhash);
		const feeEstimation = (await txn.getEstimatedFee(setup.provider.connection))!;
		const txnId = await sendAndConfirmTransaction(setup.provider.connection, txn, [setup.authority]);
		expect(txnId).toBeTruthy();
		const authorityBalanceAfter = await setup.provider.connection.getBalance(setup.authority.publicKey);
		expect(authorityBalanceAfter - authorityBalanceBefore).toBe(((buyAmounts * royaltyBasisPoints * 51) / (10000 * 100)) - feeEstimation);
		const distributionAccount = await getDistributionAccount(setup.provider, groupMint, PublicKey.default.toString());
		expect(distributionAccount?.claimData.map(d => ({address: d.address.toString(), claimAmount: d.claimAmount.toNumber()})))
			.toStrictEqual(
				[
					{
						address: setup.payer.publicKey.toString(),
						claimAmount: 0,
					},
					{
						address: setup.authority.publicKey.toString(),
						claimAmount: 0,
					},
				],
			);
	});
});
