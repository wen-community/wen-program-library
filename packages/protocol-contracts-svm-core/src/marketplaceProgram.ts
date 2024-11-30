import { AnchorProvider, BorshCoder, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { IdlAccounts } from "@coral-xyz/anchor";

import RaribleMarketplaceIdlJson from "@rarible_int/protocol-contracts-svm-idl/lib/types/idl/marketplace.json";
import { Marketplace as RaribleMarketplace } from "@rarible_int/protocol-contracts-svm-idl/lib/types/types/marketplace";
import { PrivateKeyWallet } from "./privateKeyWallet";

export const RaribleMarketplaceIdl: RaribleMarketplace = JSON.parse(
  JSON.stringify(RaribleMarketplaceIdlJson)
);

export const PROGRAM_ID_MARKETPLACE = new PublicKey(
    RaribleMarketplaceIdl.address
);

export function getRaribleMarketplaceProgram(
  provider: AnchorProvider
): Program<RaribleMarketplace> {
  return new Program<RaribleMarketplace>(
    RaribleMarketplaceIdl,
    provider
  );
}

export function getProgramInstanceRaribleMarketplace(connection: Connection): Program<RaribleMarketplace> {
    const provider = new AnchorProvider(
      connection,
      new PrivateKeyWallet(Keypair.generate()),
      AnchorProvider.defaultOptions()
    );
    const idl = RaribleMarketplaceIdl;
    const program = new Program<RaribleMarketplace>(idl, provider)!;
  
    return program;
  }