import {
  Commitment,
  Connection,
  SignatureStatus,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";

const DEFAULT_TIMEOUT = 120_000;

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      resolve();
    }, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      resolve();
    }, { once: true });
  });
}

export async function sendSignedTransaction({
  signedTransaction,
  connection,
  timeout = DEFAULT_TIMEOUT,
  skipPreflight = true,
}: {
  signedTransaction: Transaction;
  connection: Connection;
  timeout?: number;
  skipPreflight?: boolean;
}): Promise<{ txid: string; }> {
  console.log("Raw transaction start: ", signedTransaction.nonceInfo?.nonce);
  const rawTransaction = signedTransaction.serialize();
  console.log("Raw transaction length:", rawTransaction.length);

  const txid: TransactionSignature = await connection.sendRawTransaction(rawTransaction, { skipPreflight });
  console.log("Transaction ID:", txid);

  const abortCtrl = new AbortController();
  const { signal } = abortCtrl;

  let done = false;

  (async () => {
    while (!done && !signal.aborted) {
      try {
        await connection.sendRawTransaction(rawTransaction, { skipPreflight: true });
      } catch (e) {
        console.error("Error resending transaction:", e);
      }
      await sleep(6000, signal);
    }
  })();

  try {
    const confirmation = await awaitTransactionSignatureConfirmation(txid, timeout, connection, "confirmed", true, signal);

    if (!confirmation) {
      throw new Error("Transaction confirmation failed");
    }

    if (confirmation.err) {
      console.error("Transaction failed:", confirmation.err);
      throw new Error("Transaction failed: Custom instruction error");
    }

    return { txid };
  } catch (error: any) {
    if (error.message == "Transaction confirmation timeout") {
      console.error("Transaction confirmation timed out");
    }
    throw error;
  } finally {
    done = true;
    abortCtrl.abort();
  }
}

export const awaitTransactionSignatureConfirmation = async (
  txid: TransactionSignature,
  timeout: number,
  connection: Connection,
  commitment: Commitment = "confirmed",
  queryStatus = false,
  signal?: AbortSignal
): Promise<SignatureStatus | null | void> => {
  let done = false;
  let status: SignatureStatus | null | void = { slot: 0, confirmations: 0, err: null };
  let subId: number | undefined;

  const statusPromise = new Promise(async (resolve, reject) => {
    try {
      subId = connection.onSignature(
        txid,
        (result, context) => {
          done = true;
          status = {
            err: result.err,
            slot: context.slot,
            confirmations: 0,
          };
          if (result.err) {
            console.log("Rejected via websocket", result.err);
            reject(status);
          } else {
            console.log("Resolved via websocket", result);
            resolve(status);
          }
        },
        commitment
      );
    } catch (e) {
      done = true;
      console.error("WS error in setup", txid, e);
    }

    while (!done && queryStatus) {
      try {
        const signatureStatuses = await connection.getSignatureStatuses([txid]);
        status = signatureStatuses && signatureStatuses.value[0];
        if (!done) {
          if (!status) {
            console.log("REST null result for", txid, status);
          } else if (status.err) {
            console.log("REST error for", txid, status);
            done = true;
            reject(status.err);
          } else if (!status.confirmations && !status.confirmationStatus) {
            console.log("REST no confirmations for", txid, status);
          } else {
            console.log("REST confirmation for", txid, status);
            if (!status.confirmationStatus || status.confirmationStatus === commitment) {
              done = true;
              resolve(status);
            }
          }
        }
      } catch (e) {
        if (!done) {
          console.log("REST connection error: txid", txid, e);
        }
      }
      if (!done) {
        await sleep(5000, signal);
      }
    }
  });

  try {
    await Promise.race([
      statusPromise,
      sleep(timeout, signal).then(() => {
        if (!done) {
          console.log("Timed out awaiting confirmation on transaction");
          done = true;
        }
      })
    ]);
  } catch (e) {
    console.error("Unexpected error in transaction confirmation:", e);
    throw e;
  } finally {
    if (subId) connection.removeSignatureListener(subId);
  }

  if (done) {
    console.log("Returning status", status);
  }

  return status;
};
