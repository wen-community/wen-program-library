import { Connection, Keypair, Transaction } from '@solana/web3.js';

export async function getCluster(connection: Connection): Promise<string> {
  // Get the genesis hash
  const genesisHash = await connection.getGenesisHash();

  // Compare the genesis hash with known cluster genesis hashes
  switch (genesisHash) {
    case '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d':
      return 'mainnet-beta';
    case 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG':
      return 'testnet';
    case '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY':
      return 'devnet';
    default:
      // If it doesn't match any known cluster, it's likely localhost
      return 'localhost';
  }
}


export async function estimateTransactionFee(connection: Connection, transaction: Transaction, signers: Keypair[]): Promise<number> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.sign(...signers);

  const message = transaction.compileMessage();
  const fees = await connection.getFeeForMessage(message);

  if (fees === null) {
    throw new Error('Failed to estimate fee');
  }

  return fees.value;
}