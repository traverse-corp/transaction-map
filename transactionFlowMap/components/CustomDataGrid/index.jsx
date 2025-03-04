import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React from "react";
import { ArrowDropDown, ArrowDropUp, Remove } from "@mui/icons-material";

export const CustomDataGrid = ({ data, columns, filterModel }) => {
  const ColumnSortedDescendingIcon = () => {
    return <ArrowDropUp fontSize="large" />;
  };
  const ColumnSortedAscendingIcon = () => {
    return <ArrowDropDown fontSize="large" />;
  };
  const ColumnUnsortedIcon = () => {
    return <Remove fontSize="medium" />;
  };
  return (
    <>
      <Box
        sx={{
          height: 240,
          overflowY: "scroll",
          "&, [class^=MuiDataGrid]": { border: "none" },
        }}
      >
        <DataGrid
          sx={{
            ".MuiDataGrid-iconButtonContainer": {
              visibility: "visible",
            },
            ".MuiDataGrid-sortIcon": {
              opacity: "inherit !important",
            },
          }}
          slots={{
            columnSortedDescendingIcon: ColumnSortedDescendingIcon,
            columnSortedAscendingIcon: ColumnSortedAscendingIcon,
            columnUnsortedIcon: ColumnUnsortedIcon,
          }}
          rows={data}
          columns={columns}
          hideFooter
          filterModel={filterModel}
          rowHeight={36}
        />
      </Box>
    </>
  );
};
