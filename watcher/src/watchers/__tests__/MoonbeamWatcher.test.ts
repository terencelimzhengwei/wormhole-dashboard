import { expect, jest, test } from '@jest/globals';
import { INITIAL_DEPLOYMENT_BLOCK_BY_NETWORK_AND_CHAIN } from '@wormhole-foundation/wormhole-monitor-common';
import { MoonbeamWatcher } from '../MoonbeamWatcher';

jest.setTimeout(60000);

const initialMoonbeamBlock = Number(
  INITIAL_DEPLOYMENT_BLOCK_BY_NETWORK_AND_CHAIN['Mainnet'].Moonbeam
);

test('getFinalizedBlockNumber', async () => {
  const watcher = new MoonbeamWatcher('Mainnet');
  const blockNumber = await watcher.getFinalizedBlockNumber();
  expect(blockNumber).toBeGreaterThan(initialMoonbeamBlock);
});
