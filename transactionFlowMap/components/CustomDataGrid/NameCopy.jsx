import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import MiddleEllipsis from "react-middle-ellipsis";

export const NameCopy = (props) => {
  const { value } = props;
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  if (!displayValue) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: "90%",
        }}
      >
        <MiddleEllipsis>
          <span>{displayValue}</span>
        </MiddleEllipsis>
      </div>
      <CopyToClipboard text={displayValue}  onCopy={() => {
        alert("클립보드에 복사되었습니다.")
      }}>
        <div className="copy"></div>
      </CopyToClipboard>
    </Box>
  );
};

export function renderName(params) {
  return <NameCopy value={params.value} />;
}