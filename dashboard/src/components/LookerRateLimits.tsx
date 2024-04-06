import { Box, Card, IconButton } from '@mui/material';
import Table from './Table';
import { RateLimit } from '../utils/nttHelpers';
import { useRateLimits } from '../hooks/useRateLimits';
import {
  ExpandedState,
  Row,
  SortingState,
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import numeral from 'numeral';
import { Fragment, useState } from 'react';
import { useNetworkContext } from '../contexts/NetworkContext';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import { chainToChainId } from '@wormhole-foundation/sdk-base';
import { chainIdToName } from '@wormhole-foundation/wormhole-monitor-common';

const rateLimitColumnHelper = createColumnHelper<RateLimit>();

const rateLimitColumns = [
  rateLimitColumnHelper.accessor((row) => row.srcChain.toString(), {
    id: 'srcChain',
    header: () => 'Chain',
    cell: (info) => (
      <>
        {info.row.getCanExpand() ? (
          <IconButton
            size="small"
            sx={{ ml: -1 }}
            {...{
              onClick: info.row.getToggleExpandedHandler(),
            }}
          >
            {info.row.getIsExpanded() ? (
              <KeyboardArrowDown fontSize="inherit" />
            ) : (
              <KeyboardArrowRight fontSize="inherit" />
            )}
          </IconButton>
        ) : null}{' '}
        {info.row.original.destChain ? (
          <Box sx={{ pl: 3 }}>
            {chainIdToName(info.row.original.destChain)} (${info.row.original.destChain})
          </Box>
        ) : (
          `${chainIdToName(info.row.original.srcChain)} (${info.row.original.srcChain})`
        )}
      </>
    ),
  }),
  rateLimitColumnHelper.accessor('amount', {
    header: () => <Box order="1">Outbound Capacity</Box>,
    cell: (info) => (
      <Box textAlign="right">
        {info.row.original.destChain ? null : `$${info.row.original.amount.toLocaleString()}`}
      </Box>
    ),
  }),
  rateLimitColumnHelper.accessor('totalInboundCapacity', {
    header: () => <Box order="1">Inbound Capacity</Box>,
    cell: (info) => (
      <Box textAlign="right">
        {info.row.original.destChain
          ? `$${info.row.original.amount.toLocaleString()}`
          : `$${info.row.original.totalInboundCapacity?.toLocaleString()}`}
      </Box>
    ),
  }),
];

export function LookerRateLimits() {
  const network = useNetworkContext();
  const rateLimits = useRateLimits(network.currentNetwork);
  const [rateLimitSorting, setRateLimitSorting] = useState<SortingState>([]);
  const [rateLimitExpanded, setRateLimitExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    columns: rateLimitColumns,
    data: rateLimits,
    state: {
      expanded: rateLimitExpanded,
      sorting: rateLimitSorting,
    },
    getSubRows: (row) => row.inboundCapacity,
    getRowId: (rateLimit) => `${rateLimit.srcChain.toString()}-${rateLimit.destChain || ''}`,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setRateLimitExpanded,
    onSortingChange: setRateLimitSorting,
  });

  return (
    <Box mt={2} mx={2}>
      <Card>
        <Table<RateLimit> table={table} />
      </Card>
    </Box>
  );
}
