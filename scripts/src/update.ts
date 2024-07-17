import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import {
  Keypair,
  Connection,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
  AddressLookupTableProgram,
  AddressLookupTableAccount,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { config } from "dotenv";

import { WenNewStandard } from "../../target/types/wen_new_standard";
import WNSIdl from "../../target/idl/wen_new_standard.json";
import { WenRoyaltyDistribution } from "../../target/types/wen_royalty_distribution";
import WenRoyaltyIdl from "../../target/idl/wen_royalty_distribution.json";

import accountsDevnet from "../devnet.json";
import accountsMainnet from "../mainnet.json";
import { filterAvailableAccounts, sleep } from "./utils";

const INSTRUCTIONS_PER_TX = 20;

(async function (isDevnet: boolean, addressTableLookupAddress?: PublicKey) {
  config({ path: "../.env" });
  try {
    const DEVNET_URL = process.env.DEVNET_URL;
    const MAINNET_URL = process.env.MAINNET_URL;
    const keypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.KEYPAIR)),
    );
    console.log(`Signing Address: ${keypair.publicKey.toString()}`);

    const connection = new Connection(isDevnet ? DEVNET_URL : MAINNET_URL, {
      commitment: "confirmed",
    });

    // To test locally
    // const connection = new Connection("http://localhost:8899");
    const wallet = new Wallet(keypair);
    const provider = new AnchorProvider(connection, wallet, {
      skipPreflight: true,
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });

    /** Airdrop only for devnet/localnet */
    if (
      isDevnet &&
      (await connection.getBalance(keypair.publicKey, "confirmed")) === 0
    ) {
      console.log(`Zero balance account. Airdropping`);
      await connection.confirmTransaction({
        ...(await connection.getLatestBlockhash("confirmed")),
        signature: await connection.requestAirdrop(
          keypair.publicKey,
          1 * LAMPORTS_PER_SOL,
        ),
      });
    }
    /** */

    const wnsProgram = new Program(WNSIdl as WenNewStandard, provider);
    const distributionProgram = new Program(
      WenRoyaltyIdl as WenRoyaltyDistribution,
      provider,
    );

    /** Address table lookup for maximum efficiency */
    let addressTableLookupAccount: AddressLookupTableAccount;
    if (!addressTableLookupAddress) {
      const slot = await provider.connection.getSlot("confirmed");
      const { blockhash, lastValidBlockHeight } =
        await provider.connection.getLatestBlockhash("confirmed");
      const [createLookupTableIx, lookupTableAccount] =
        AddressLookupTableProgram.createLookupTable({
          authority: keypair.publicKey,
          payer: keypair.publicKey,
          recentSlot: slot - 1,
        });

      console.log(
        `Created address table lookup: ${lookupTableAccount.toString()}`,
      );

      const extendLookupTableIx = AddressLookupTableProgram.extendLookupTable({
        addresses: [
          keypair.publicKey,
          wnsProgram.programId,
          distributionProgram.programId,
          SystemProgram.programId,
        ],
        authority: keypair.publicKey,
        lookupTable: lookupTableAccount,
        payer: keypair.publicKey,
      });

      const txMessage = new TransactionMessage({
        instructions: [createLookupTableIx, extendLookupTableIx],
        payerKey: keypair.publicKey,
        recentBlockhash: blockhash,
      }).compileToV0Message();

      const tx = new VersionedTransaction(txMessage);
      tx.sign([keypair]);

      const sig = await provider.connection.sendTransaction(tx, {
        skipPreflight: true,
        preflightCommitment: "confirmed",
      });
      await provider.connection.confirmTransaction(
        {
          blockhash,
          lastValidBlockHeight,
          signature: sig,
        },
        "confirmed",
      );
      const { value } = await connection.getAddressLookupTable(
        lookupTableAccount,
        { commitment: "confirmed" },
      );
      addressTableLookupAccount = value;

      console.log(`Allowing for ATL to be indexed`);
      await sleep(2000);
    } else {
      const { value } = await connection.getAddressLookupTable(
        addressTableLookupAddress,
        { commitment: "confirmed" },
      );
      addressTableLookupAccount = value;
    }
    /** */

    const wnsAccounts: Record<
      string,
      { pubkey: string; type: string; account: { data: string[] } }
    > = isDevnet ? accountsDevnet["wns"] : accountsMainnet["wns"];
    const finalAccounts = await filterAvailableAccounts(
      connection,
      wnsAccounts,
    );

    const filteredWnsAccounts = Object.values(finalAccounts).filter(
      (wnsAccount) => wnsAccount.type !== "unknown",
    );

    const totalWNSBatches = Array.from(
      {
        length: Math.round(filteredWnsAccounts.length / INSTRUCTIONS_PER_TX),
      },
      (_, i) => i + 1,
    );
    console.log(`Total Tx batches: ${totalWNSBatches.length}`);

    for (const batch of totalWNSBatches) {
      const accounts = filteredWnsAccounts.slice(
        (batch - 1) * INSTRUCTIONS_PER_TX,
        batch * INSTRUCTIONS_PER_TX,
      );

      const instructions = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 350_000 }),
      ];

      for (const { pubkey, type } of accounts) {
        console.log(`Updating account: ${pubkey}`);
        const wnsAccount = new PublicKey(pubkey);

        switch (type) {
          case "tokenGroup": {
            instructions.push(
              await wnsProgram.methods
                .updateBumpGroup()
                .accountsStrict({
                  signer: keypair.publicKey,
                  group: wnsAccount,
                })
                .instruction(),
            );
            continue;
          }
          case "tokenGroupMember": {
            instructions.push(
              await wnsProgram.methods
                .updateBumpGroupMember()
                .accountsStrict({
                  signer: keypair.publicKey,
                  member: wnsAccount,
                })
                .instruction(),
            );
            continue;
          }
          case "manager": {
            instructions.push(
              await wnsProgram.methods
                .updateBumpManager()
                .accountsStrict({
                  signer: keypair.publicKey,
                  manager: wnsAccount,
                })
                .instruction(),
            );
            continue;
          }
          case "approveAccount": {
            console.log("Account type approve. Continuing");
            continue;
          }
          default: {
            console.log("Account is extra meta account info. Continuing");
            continue;
          }
        }
      }

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      const transactionMessage = new TransactionMessage({
        instructions,
        payerKey: keypair.publicKey,
        recentBlockhash: blockhash,
      }).compileToV0Message([addressTableLookupAccount]);

      const transaction = new VersionedTransaction(transactionMessage);
      transaction.sign([keypair]);
      console.log(`Submitting batch: ${batch}`);

      let isFinished = false;
      while (!isFinished) {
        try {
          const signature = await connection.sendTransaction(transaction, {
            skipPreflight: true,
            preflightCommitment: "confirmed",
          });
          await connection.confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            "confirmed",
          );
          isFinished = true;
          console.log(
            `Batch resize success. https://explorer.solana.com/tx/${signature}/${
              isDevnet ? "?cluster=devnet" : ""
            }`,
          );
        } catch (err) {
          console.log(err);
          continue;
        }
      }
    }

    const distributionAccounts: Record<
      string,
      { pubkey: string; type: string; account: { data: string[] } }
    > = isDevnet
      ? accountsDevnet["distribution"]
      : accountsMainnet["distribution"];

    const finalDistAccounts = await filterAvailableAccounts(
      connection,
      distributionAccounts,
    );

    const totalDistributionBatches = Array.from(
      {
        length: Math.round(
          Object.keys(finalDistAccounts).length / INSTRUCTIONS_PER_TX,
        ),
      },
      (_, i) => i + 1,
    );

    for (const batch of totalDistributionBatches) {
      const accounts = Object.values(finalDistAccounts).slice(
        (batch - 1) * INSTRUCTIONS_PER_TX,
        batch * INSTRUCTIONS_PER_TX,
      );

      const instructions = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 350_000 }),
      ];
      for (const { pubkey } of accounts) {
        console.log(`Updating account: ${pubkey}`);
        const distributionAccount = new PublicKey(pubkey);

        instructions.push(
          await distributionProgram.methods
            .updateBumpDistribution()
            .accountsStrict({
              distributionAccount,
              signer: keypair.publicKey,
            })
            .instruction(),
        );
      }

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      const transactionMessage = new TransactionMessage({
        instructions,
        payerKey: keypair.publicKey,
        recentBlockhash: blockhash,
      }).compileToV0Message([addressTableLookupAccount]);

      const transaction = new VersionedTransaction(transactionMessage);
      transaction.sign([keypair]);
      console.log(`Submitting batch: ${batch}`);

      let isFinished = false;
      while (!isFinished) {
        try {
          const signature = await connection.sendTransaction(transaction, {
            skipPreflight: true,
            preflightCommitment: "confirmed",
          });
          await connection.confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            "confirmed",
          );
          isFinished = true;
          console.log(
            `Batch resize success. https://explorer.solana.com/tx/${signature}/${
              isDevnet ? "?cluster=devnet" : ""
            }`,
          );
        } catch (err) {
          console.log(err);
          continue;
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
  // Paste the ATL address generated from resize.ts
})(false, undefined);
