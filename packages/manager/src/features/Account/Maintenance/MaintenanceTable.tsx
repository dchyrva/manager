/* eslint-disable jsx-a11y/anchor-is-valid */
import { Box, Paper } from '@linode/ui';
import * as React from 'react';
import { makeStyles } from 'tss-react/mui';

import { DownloadCSV } from 'src/components/DownloadCSV/DownloadCSV';
import { Hidden } from 'src/components/Hidden';
import { PaginationFooter } from 'src/components/PaginationFooter/PaginationFooter';
import { Table } from 'src/components/Table';
import { TableBody } from 'src/components/TableBody';
import { TableCell } from 'src/components/TableCell';
import { TableHead } from 'src/components/TableHead';
import { TableRow } from 'src/components/TableRow';
import { TableRowEmpty } from 'src/components/TableRowEmpty/TableRowEmpty';
import { TableRowError } from 'src/components/TableRowError/TableRowError';
import { TableRowLoading } from 'src/components/TableRowLoading/TableRowLoading';
import { TableSortCell } from 'src/components/TableSortCell';
import { Typography } from 'src/components/Typography';
import { useFormattedDate } from 'src/hooks/useFormattedDate';
import { useOrder } from 'src/hooks/useOrder';
import { usePagination } from 'src/hooks/usePagination';
import {
  useAccountMaintenanceQuery,
  useAllAccountMaintenanceQuery,
} from 'src/queries/account/maintenance';

import { MaintenanceTableRow } from './MaintenanceTableRow';
import { PENDING_MAINTENANCE_FILTER } from './utilities';

import type { AccountMaintenance, Filter } from '@linode/api-v4';

const preferenceKey = 'account-maintenance';

const headersForCSVDownload = [
  { key: 'entity.label', label: 'Entity Label' },
  { key: 'entity.type', label: 'Entity Type' },
  { key: 'entity.id', label: 'Entity ID' },
  { key: 'when', label: 'Date' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'reason', label: 'Reason' },
];

const useStyles = makeStyles()(() => ({
  cell: {
    width: '12%',
  },
}));

interface Props {
  type: 'completed' | 'pending';
}

export const MaintenanceTable = ({ type }: Props) => {
  const csvRef = React.useRef<any>();
  const { classes } = useStyles();
  const pagination = usePagination(1, `${preferenceKey}-${type}`, type);
  const formattedDate = useFormattedDate();

  const { handleOrderChange, order, orderBy } = useOrder(
    {
      order: 'desc',
      orderBy: 'status',
    },
    `${preferenceKey}-order-${type}`,
    type
  );

  /**
   * We use a different API filter depending on the table's `type`
   */
  const filters: Record<Props['type'], Filter> = {
    completed: { status: 'completed' },
    pending: PENDING_MAINTENANCE_FILTER,
  };

  const filter: Filter = {
    '+order': order,
    '+order_by': orderBy,
    ...filters[type],
  };

  const { data: csv, refetch: getCSVData } = useAllAccountMaintenanceQuery(
    {},
    filter,
    false
  );

  const { data, error, isLoading } = useAccountMaintenanceQuery(
    {
      page: pagination.page,
      page_size: pagination.pageSize,
    },
    filter
  );

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableRowLoading
          responsive={{
            2: { smDown: true },
            3: { xsDown: true },
            5: { mdDown: true },
          }}
          columns={7}
          rows={1}
        />
      );
    }

    if (error) {
      return <TableRowError colSpan={7} message={error[0].reason} />;
    }

    if (data?.results === 0) {
      return <TableRowEmpty colSpan={7} message={`No ${type} maintenance.`} />;
    }

    if (data) {
      return data.data.map((item: AccountMaintenance) => (
        <MaintenanceTableRow key={`${item.entity.id}-${item.type}`} {...item} />
      ));
    }

    return null;
  };

  const downloadCSV = async () => {
    await getCSVData();
    // This approach is not particularly elegant, but setTimeout may be the best way to make this click async without adding a lot of logic.
    setTimeout(() => {
      csvRef.current.link.click();
    }, 0);
  };

  return (
    <Box>
      <Paper
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'space-between',
          minHeight: '42px',
          padding: 0.75,
          paddingLeft: 2,
        }}
      >
        <Typography style={{ textTransform: 'capitalize' }} variant="h3">
          {type}
        </Typography>
        <Box>
          <DownloadCSV
            csvRef={csvRef}
            data={csv || []}
            filename={`${type}-maintenance-${formattedDate}.csv`}
            headers={headersForCSVDownload}
            onClick={downloadCSV}
          />
        </Box>
      </Paper>
      <Table aria-label={`List of ${type} maintenance`}>
        <TableHead>
          <TableRow>
            <TableCell className={classes.cell}>Entity</TableCell>
            <TableCell className={classes.cell}>Label</TableCell>
            <TableSortCell
              active={orderBy === 'when'}
              className={classes.cell}
              direction={order}
              handleClick={handleOrderChange}
              label="when"
            >
              Date
            </TableSortCell>
            <Hidden mdDown>
              <TableSortCell
                active={orderBy === 'when'}
                className={classes.cell}
                direction={order}
                handleClick={handleOrderChange}
                label="when"
              >
                When
              </TableSortCell>
            </Hidden>
            <Hidden smDown>
              <TableSortCell
                active={orderBy === 'type'}
                className={classes.cell}
                direction={order}
                handleClick={handleOrderChange}
                label="type"
              >
                Type
              </TableSortCell>
            </Hidden>
            <TableSortCell
              active={orderBy === 'status'}
              className={classes.cell}
              direction={order}
              handleClick={handleOrderChange}
              label="status"
            >
              Status
            </TableSortCell>
            <Hidden lgDown>
              <TableCell style={{ width: '40%' }}>Reason</TableCell>
            </Hidden>
          </TableRow>
        </TableHead>
        <TableBody>{renderTableContent()}</TableBody>
      </Table>
      <PaginationFooter
        count={data?.results || 0}
        eventCategory={`${type} Maintenance Table`}
        handlePageChange={pagination.handlePageChange}
        handleSizeChange={pagination.handlePageSizeChange}
        page={pagination.page}
        pageSize={pagination.pageSize}
      />
    </Box>
  );
};
