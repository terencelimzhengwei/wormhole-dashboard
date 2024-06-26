import { expect, jest, test } from '@jest/globals';
import { NTTSolanaWatcher } from '../NTTSolanaWatcher';
import {
  NativeTokenTransfer,
  NttManagerMessage,
  TrimmedAmount,
  ValidatedTransceiverMessage,
} from '../NTTPayloads';

jest.setTimeout(60_000);

// from solana
// '2B9J3WQSeEqzWtmXLsgX97TkRTbYoCHGcmShPkac5hJGGNVB7XiKxhz8ayj8MQX8DEMiG8ZfEbBDvqphq1PqH9H3', // 1/7e6436b671cce379a1fa9833783e28b36d39a00e2cdc6bfeab5d2d836eb61c7f/19
// to solana
// '4Xq6C4hwZChM6RZm8ibqXRATsqNhg1w5UaNgvWa1o8kLzPuzDUCS68tDL2d5vkxjQkLSmMKCZ7MLUhahcbb3WB47', // 10002/0000000000000000000000001fdc902e30b188fd2ba976b421cb179943f57896/9

test('deserializeValidatedTransceiverMessage', async () => {
  const data =
    '6100707d6bdc25b51227000000000000000000000000b231ad95f2301bc82ea44c515001f0f746d637e00ba50e1661e1aa0c07afdbac8349e925b1994b9c3ce2a647523704eba200985c0000000000000000000000000000000000000000000000000000000000000008000000000000000000000000bd4488ee939a63edea7d63ca7af2a713c699331d40420f0000000000080000000000000000000000001d30e78b7c7fbbcef87ae6e97b5389b2e470ca4a010049dfaf3b830ff50e1b02f3dd31218693543a19a34e39991edea250d42739b2920000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
  const transceiverMessageData = ValidatedTransceiverMessage.deserialize(
    Buffer.from(data, 'hex'),
    (a) => {
      return NttManagerMessage.deserializeAccountFormat(
        a,
        NativeTokenTransfer.deserializeAccountFormat
      );
    }
  );

  if (!transceiverMessageData) {
    console.log('transceiverMessageData is null');
    return;
  }

  expect(transceiverMessageData.chainId).toBe(10002);
  expect(transceiverMessageData.sourceNttManager.toString('hex')).toBe(
    '000000000000000000000000b231ad95f2301bc82ea44c515001f0f746d637e0'
  );
  expect(transceiverMessageData.recipientNttManager.toString('hex')).toBe(
    '0ba50e1661e1aa0c07afdbac8349e925b1994b9c3ce2a647523704eba200985c'
  );
  expect(transceiverMessageData.ntt_managerPayload.id.toString('hex')).toBe(
    '0000000000000000000000000000000000000000000000000000000000000008'
  );
  expect(transceiverMessageData.ntt_managerPayload.sender.toString('hex')).toBe(
    '000000000000000000000000bd4488ee939a63edea7d63ca7af2a713c699331d'
  );
  expect(transceiverMessageData.ntt_managerPayload.payload.recipientAddress.toString('hex')).toBe(
    '49dfaf3b830ff50e1b02f3dd31218693543a19a34e39991edea250d42739b292'
  );
  expect(transceiverMessageData.ntt_managerPayload.payload.trimmedAmount.amount).toBe(1000000n);
  expect(transceiverMessageData.ntt_managerPayload.payload.trimmedAmount.decimals).toBe(8);
  expect(transceiverMessageData.ntt_managerPayload.payload.recipientChain).toBe(1);
  expect(transceiverMessageData.ntt_managerPayload.payload.sourceToken.toString('hex')).toBe(
    '0000000000000000000000001d30e78b7c7fbbcef87ae6e97b5389b2e470ca4a'
  );
});

// This test is working, but testing it is not very useful since the return value is just the lastBlockKey.
// It is just an entrypoint to test the whole thing with a local postgres database.
test.skip('getNttMessagesForBlock', async () => {
  const watcher = new NTTSolanaWatcher('Testnet');
  const latestSlot = await watcher.getConnection().getSlot();
  await watcher.getNttMessagesForBlocks(286868903, 288234170);
});

test.skip('parseTransferLockIx should have no transfer details', async () => {
  const watcher = new NTTSolanaWatcher('Testnet');
  const txHash =
    '2B9J3WQSeEqzWtmXLsgX97TkRTbYoCHGcmShPkac5hJGGNVB7XiKxhz8ayj8MQX8DEMiG8ZfEbBDvqphq1PqH9H3';

  const tx = await watcher.getConnection().getTransaction(txHash, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    throw new Error('Unable to get transaction');
  }

  const ix = tx.transaction.message.compiledInstructions[1];
  const message = await watcher.parseInstruction(tx, ix);
  if (!message) {
    throw new Error('Message is null');
  }
  expect(message.transferTime).toBe('');
  expect(message.transferSentTxhash).toBe('');
});

test.skip('parseReleaseWormholeOutboundIx should have transfer details', async () => {
  const watcher = new NTTSolanaWatcher('Testnet');
  const txHash =
    '2B9J3WQSeEqzWtmXLsgX97TkRTbYoCHGcmShPkac5hJGGNVB7XiKxhz8ayj8MQX8DEMiG8ZfEbBDvqphq1PqH9H3';

  const tx = await watcher.getConnection().getTransaction(txHash, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    throw new Error('Unable to get transaction');
  }

  const ix = tx.transaction.message.compiledInstructions[2];
  const message = await watcher.parseInstruction(tx, ix);
  if (!message) {
    throw new Error('Message is null');
  }
  expect(message.transferTime).toBe('1710383155000');
  expect(message.transferSentTxhash).toBe(
    '2B9J3WQSeEqzWtmXLsgX97TkRTbYoCHGcmShPkac5hJGGNVB7XiKxhz8ayj8MQX8DEMiG8ZfEbBDvqphq1PqH9H3'
  );
});

test.skip('parseReceiveWormholeMessageIx', async () => {
  const watcher = new NTTSolanaWatcher('Testnet');
  const txHashes = [
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/5
    '22to1Yq258rRRDYX1UzKfH1knSH4acBzdQSYFjKrTU4vwqw98ALyPSmtpqWddPXjciwK8tEHLYzq3MRpFmd3U6x2',
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/6
    '3S3WBRjMnt1ACDRVf9uvp2osbRaRLLzAky1uzxG4ZvVVxAJ8mEvGdjUQXqRBxmPVPERvZAsh1jFQubZQfwgMtm4N',
  ];

  const digests = [
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/5
    'b716dc9a0cc692c0f59438c579c435412bfeeb2f853db8cffdafc7ddb365a353',
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/6
    'dd82e60dfb79e5776089f2d8d466e03479431739cb2af2990d1d6e5756bc1720',
  ];

  const txs = await watcher.getConnection().getTransactions(txHashes, {
    maxSupportedTransactionVersion: 0,
  });

  if (!txs) {
    throw new Error('Unable to get transaction');
  }

  let ix = txs[0]!.transaction.message.compiledInstructions[0];
  let message = await watcher.parseInstruction(txs[0]!, ix);
  expect(message?.digest).toBe(digests[0]);

  ix = txs[1]!.transaction.message.compiledInstructions[0];
  message = await watcher.parseInstruction(txs[1]!, ix);
  expect(message?.digest).toBe(digests[1]);
});

test.skip('parseReceiveWormholeMessageIx', async () => {
  const watcher = new NTTSolanaWatcher('Testnet');
  const txHashes = [
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/5
    '22to1Yq258rRRDYX1UzKfH1knSH4acBzdQSYFjKrTU4vwqw98ALyPSmtpqWddPXjciwK8tEHLYzq3MRpFmd3U6x2',
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/6
    '3S3WBRjMnt1ACDRVf9uvp2osbRaRLLzAky1uzxG4ZvVVxAJ8mEvGdjUQXqRBxmPVPERvZAsh1jFQubZQfwgMtm4N',
  ];

  const digests = [
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/5
    'b716dc9a0cc692c0f59438c579c435412bfeeb2f853db8cffdafc7ddb365a353',
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/6
    'dd82e60dfb79e5776089f2d8d466e03479431739cb2af2990d1d6e5756bc1720',
  ];

  const txs = await watcher.getConnection().getTransactions(txHashes, {
    maxSupportedTransactionVersion: 0,
  });

  if (!txs) {
    throw new Error('Unable to get transaction');
  }

  let ix = txs[0]!.transaction.message.compiledInstructions[0];
  let message = await watcher.parseInstruction(txs[0]!, ix);
  expect(message?.digest).toBe(digests[0]);

  ix = txs[1]!.transaction.message.compiledInstructions[0];
  message = await watcher.parseInstruction(txs[1]!, ix);
  expect(message?.digest).toBe(digests[1]);
});

test.skip('parseRedeemIx', async () => {
  const watcher = new NTTSolanaWatcher('Testnet');
  const txHashes = [
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/5
    '22to1Yq258rRRDYX1UzKfH1knSH4acBzdQSYFjKrTU4vwqw98ALyPSmtpqWddPXjciwK8tEHLYzq3MRpFmd3U6x2',
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/6
    '3S3WBRjMnt1ACDRVf9uvp2osbRaRLLzAky1uzxG4ZvVVxAJ8mEvGdjUQXqRBxmPVPERvZAsh1jFQubZQfwgMtm4N',
  ];

  const digests = [
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/5
    'b716dc9a0cc692c0f59438c579c435412bfeeb2f853db8cffdafc7ddb365a353',
    // 10005/00000000000000000000000041265eb2863bf0238081f6aeefef73549c82c3dd/6
    'dd82e60dfb79e5776089f2d8d466e03479431739cb2af2990d1d6e5756bc1720',
  ];
  const txs = await watcher.getConnection().getTransactions(txHashes, {
    maxSupportedTransactionVersion: 0,
  });

  if (!txs) {
    throw new Error('Unable to get transaction');
  }

  let ix = txs[0]!.transaction.message.compiledInstructions[1];
  let message = await watcher.parseInstruction(txs[0]!, ix);
  expect(message?.digest).toBe(digests[0]);

  ix = txs[1]!.transaction.message.compiledInstructions[1];
  message = await watcher.parseInstruction(txs[1]!, ix);
  expect(message?.digest).toBe(digests[1]);
});

test.skip('parseRequestRelay', async () => {
  const watcher = new NTTSolanaWatcher('Testnet');
  const txHashes = [
    // 1/7e6436b671cce379a1fa9833783e28b36d39a00e2cdc6bfeab5d2d836eb61c7f/29
    'uqKyFZHhZCFusb1YH9K7rzXqDLXsfzh778ZM2bQv2tDYznyktYVEzQ86FCesDCWD9B5RTkbxGNxfCjF2GN5ALL2',
  ];

  const digests = [
    // 1/7e6436b671cce379a1fa9833783e28b36d39a00e2cdc6bfeab5d2d836eb61c7f/29
    'da32304804be70175afe945ec5d55431b833a2bf0e1c5ecc5f47fdef53c80752',
  ];
  const txs = await watcher.getConnection().getTransactions(txHashes, {
    maxSupportedTransactionVersion: 0,
  });

  if (!txs) {
    throw new Error('Unable to get transaction');
  }

  // let it save outbox_item_to_lifecycle_digest in the database
  let ix = txs[0]!.transaction.message.compiledInstructions[1];
  let message = await watcher.parseInstruction(txs[0]!, ix);

  ix = txs[0]!.transaction.message.compiledInstructions[3];
  message = await watcher.parseInstruction(txs[0]!, ix);
  expect(message?.digest).toBe(digests[0]);
});

test('normalizeToDecimals', () => {
  const testCases: { name: string; trimmedAmount: TrimmedAmount; expectedAmount: bigint }[] = [
    {
      name: 'currentDecimals < targetDecimals',
      trimmedAmount: new TrimmedAmount(BigInt(1000), 6),
      expectedAmount: 100000n,
    },
    {
      name: 'currentDecimals > targetDecimals',
      trimmedAmount: new TrimmedAmount(BigInt(1000000000), 10),
      expectedAmount: 10000000n,
    },
    {
      name: 'currentDecimals = targetDecimals',
      trimmedAmount: new TrimmedAmount(BigInt(100000000), 8),
      expectedAmount: 100000000n,
    },
  ];

  for (const testCase of testCases) {
    const { trimmedAmount, expectedAmount } = testCase;
    const normalizedAmount = trimmedAmount.normalize(8);
    expect(normalizedAmount).toBe(expectedAmount);
  }
});
