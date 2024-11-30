import { AnchorProvider, BorshCoder, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { IdlAccounts } from "@coral-xyz/anchor";

import RaribleEditionsControlsIdlJson from "@rarible_int/protocol-contracts-svm-idl/lib/types/idl/rarible_editions_controls.json";
import { RaribleEditionsControls } from "@rarible_int/protocol-contracts-svm-idl/lib/types/types/rarible_editions_controls";

export const RaribleEditionsControlsIdl: RaribleEditionsControls = JSON.parse(
  JSON.stringify(RaribleEditionsControlsIdlJson)
);

export const PROGRAM_ID_EDITIONS_CONTROLS = new PublicKey(
  RaribleEditionsControlsIdl.address
);

export function getRaribleEditionsControlsProgram(
  provider: AnchorProvider
): Program<RaribleEditionsControls> {
  return new Program<RaribleEditionsControls>(
    RaribleEditionsControlsIdl,
    provider
  );
}

import RaribleEditionsIdlJson from "@rarible_int/protocol-contracts-svm-idl/lib/types/idl/rarible_editions.json";
import { RaribleEditions } from "@rarible_int/protocol-contracts-svm-idl/lib/types/types/rarible_editions";
import { PrivateKeyWallet } from "./privateKeyWallet";

export const RaribleEditionsIdl: RaribleEditions = JSON.parse(
  JSON.stringify(RaribleEditionsIdlJson)
);

export const PROGRAM_ID_EDITIONS = new PublicKey(RaribleEditionsIdl.address);

export function getRaribleEditionsProgram(
  provider: AnchorProvider
): Program<RaribleEditions> {
  return new Program<RaribleEditions>(RaribleEditionsIdl, provider);
}

export const PROGRAM_ID_GROUP_EXTENSIONS = new PublicKey(
  "RariGDYwEF1jQA4kisHxBxiv1TDuBPVHNNoXFNYriFb"
);

export function getProgramInstanceEditionsControls(connection: Connection) {
  const provider = new AnchorProvider(
    connection,
    new PrivateKeyWallet(Keypair.generate()),
    AnchorProvider.defaultOptions()
  );
  const idl = RaribleEditionsControlsIdl;
  const program = new Program<RaribleEditionsControls>(idl, provider)!;

  return program;
}

export function getProgramInstanceEditions(connection: Connection) {
  const provider = new AnchorProvider(
    connection,
    new PrivateKeyWallet(Keypair.generate()),
    AnchorProvider.defaultOptions()
  );
  const idl = RaribleEditionsIdl;
  const program = new Program<RaribleEditions>(idl, provider)!;
  return program;
}

export type RaribleEditionsIdl = IdlAccounts<RaribleEditions>["editionsDeployment"];
export type RaribleEditionsControlsIdl = IdlAccounts<RaribleEditionsControls>["editionsControls"];

export const decodeEditionsControls =
  (program: Program<RaribleEditionsControls>) =>
  (buffer: Buffer | undefined, pubkey: PublicKey) => {
    const coder = new BorshCoder(program.idl);
    const liquidity = buffer
      ? coder.accounts.decode<RaribleEditionsControlsIdl>("editionsControls", buffer)
      : null;

    return {
      item: liquidity,
      pubkey,
    };
  };
  export const decodeEditions =
  (program: Program<RaribleEditions>) =>
  (buffer: Buffer | undefined, pubkey: PublicKey) => {
    const coder = new BorshCoder(program.idl);
    const liquidity = buffer
      ? coder.accounts.decode<RaribleEditionsIdl>("editionsDeployment", buffer)
      : null;

    return {
      item: liquidity,
      pubkey,
    };
  };