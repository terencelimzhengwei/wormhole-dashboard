import axios from 'axios';
import { ethers } from 'ethers';
import { AXIOS_CONFIG_JSON, POLYGON_ROOT_CHAIN_INFO } from '../consts';
import { EVMWatcher } from './EVMWatcher';
import { Network } from '@wormhole-foundation/sdk-base';

export class PolygonWatcher extends EVMWatcher {
  constructor(network: Network) {
    super(network, 'Polygon');
  }
  async getFinalizedBlockNumber(): Promise<number> {
    this.logger.info('fetching last child block from Ethereum');
    const rootChain = new ethers.utils.Interface([
      `function getLastChildBlock() external view returns (uint256)`,
    ]);
    const callData = rootChain.encodeFunctionData('getLastChildBlock');
    const callResult = (
      await axios.post(
        POLYGON_ROOT_CHAIN_INFO[this.network].rpc,
        [
          {
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [
              { to: POLYGON_ROOT_CHAIN_INFO[this.network].address, data: callData },
              'latest', // does the guardian use latest?
            ],
          },
        ],
        AXIOS_CONFIG_JSON
      )
    )?.data?.[0]?.result;
    const block = rootChain.decodeFunctionResult('getLastChildBlock', callResult)[0].toNumber();
    this.logger.info(`rooted child block ${block}`);
    return block;
  }
}
