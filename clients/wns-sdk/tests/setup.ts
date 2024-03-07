import {Keypair} from '@solana/web3.js';
import {getProvider} from '../src';
import 'dotenv/config';

export function setupTest() {
	const payer = Keypair.generate();
	const authority = Keypair.generate();
	const provider = getProvider();
	const user1 = Keypair.generate();
	const user2 = Keypair.generate();
	return {
		payer,
		authority,
		provider,
		user1,
		user2,
	};
}
