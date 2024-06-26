import {
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_NEAR,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_TERRA,
  CHAIN_ID_TERRA2,
  CHAIN_ID_XPLA,
  ChainId,
  getTypeFromExternalAddress,
  hexToUint8Array,
  isEVMChain,
  queryExternalId,
  queryExternalIdInjective,
  tryHexToNativeAssetString,
  tryHexToNativeStringNear,
} from '@certusone/wormhole-sdk';
import { getTokenCoinType } from '@certusone/wormhole-sdk/lib/cjs/sui';
import { getNetworkInfo, Network } from '@injectivelabs/networks';
import { ChainGrpcWasmApi } from '@injectivelabs/sdk-ts';
import { Connection, JsonRpcProvider } from '@mysten/sui.js';
import { LCDClient } from '@terra-money/terra.js';
import { contracts } from '@wormhole-foundation/sdk-base';
import { AptosClient } from 'aptos';
import { connect } from 'near-api-js';

export const getNativeAddress = async (
  tokenChain: ChainId,
  tokenAddress: string
): Promise<string | null> => {
  try {
    if (
      isEVMChain(tokenChain) ||
      tokenChain === CHAIN_ID_SOLANA ||
      tokenChain === CHAIN_ID_ALGORAND ||
      tokenChain === CHAIN_ID_TERRA
    ) {
      return tryHexToNativeAssetString(tokenAddress, tokenChain);
    } else if (tokenChain === CHAIN_ID_XPLA) {
      const client = new LCDClient({
        URL: 'https://dimension-lcd.xpla.dev',
        chainID: 'dimension_37-1',
      });
      return (
        (await queryExternalId(client, contracts.tokenBridge('Mainnet', 'Xpla'), tokenAddress)) ||
        null
      );
    } else if (tokenChain === CHAIN_ID_TERRA2) {
      const client = new LCDClient({
        URL: 'https://lcd-terra.tfl.foundation',
        chainID: 'phoenix-1',
      });
      return (
        (await queryExternalId(client, contracts.tokenBridge('Mainnet', 'Terra2'), tokenAddress)) ||
        null
      );
    } else if (tokenChain === CHAIN_ID_INJECTIVE) {
      const client = new ChainGrpcWasmApi(getNetworkInfo(Network.MainnetK8s).grpc);
      return await queryExternalIdInjective(
        client,
        contracts.tokenBridge('Mainnet', 'Injective'),
        tokenAddress
      );
    } else if (tokenChain === CHAIN_ID_APTOS) {
      const client = new AptosClient('https://fullnode.mainnet.aptoslabs.com');
      return await getTypeFromExternalAddress(
        client,
        contracts.tokenBridge('Mainnet', 'Aptos'),
        tokenAddress
      );
    } else if (tokenChain === CHAIN_ID_NEAR) {
      const NATIVE_NEAR_WH_ADDRESS =
        '0000000000000000000000000000000000000000000000000000000000000000';
      const NATIVE_NEAR_PLACEHOLDER = 'near';
      if (tokenAddress === NATIVE_NEAR_WH_ADDRESS) {
        return NATIVE_NEAR_PLACEHOLDER;
      } else {
        const connection = await connect({
          nodeUrl: 'https://rpc.mainnet.near.org',
          networkId: 'mainnet',
        });
        return await tryHexToNativeStringNear(
          connection.connection.provider,
          contracts.tokenBridge('Mainnet', 'Near'),
          tokenAddress
        );
      }
    } else if (tokenChain === CHAIN_ID_SUI) {
      const provider = new JsonRpcProvider(
        new Connection({ fullnode: 'https://fullnode.mainnet.sui.io' })
      );
      return await getTokenCoinType(
        provider,
        contracts.tokenBridge('Mainnet', 'Sui'),
        hexToUint8Array(tokenAddress),
        CHAIN_ID_SUI
      );
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};
