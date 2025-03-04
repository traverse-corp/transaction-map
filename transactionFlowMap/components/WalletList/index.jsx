/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useMemo, useState } from "react";
import { TransactionDetailContext } from "../../../../context/TransactionDetailContext";
import {
  TRANSACTION_MAX_UNDISPLAYED,
  WALLET_DATE_FORMAT,
} from "../../../../common/Constant";
import { CustomDataGrid } from "../CustomDataGrid";
import { renderName } from "../CustomDataGrid/NameCopy";
import { RenderCheckBox } from "../CustomDataGrid/RenderCheckBox";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
const Decimal = require("decimal.js");

export const WalletList = ({
  mainNet,
  list,
  addressDictList,
  title,
  isRemove,
}) => {
  const { searchContent, setIsWallet } = React.useContext(
    TransactionDetailContext
  );
  useMemo(() => {
    setIsWallet(true);
  }, []);
  const LocalRenderCheckBox = useCallback(
    (props) => {
      return <RenderCheckBox isRemove={isRemove} props={props} />;
    },
    [list]
  );
  const updateRenderName = useCallback(
    (props) => {
      return renderName(props);
    },
    [list]
  );
  const columns = [
    {
      field: "checkbox",
      headerName: "선택",
      width: 30,
      renderCell: LocalRenderCheckBox,
    },
    {
      field: "name",
      headerName: mainNet === "BTC" ? "트랜잭션 해시" : "주소",
      width: 280,
      renderCell: updateRenderName,
    },
    { field: "value", headerName: "전송량", width: 120 },
    { field: "direction", headerName: "방향", width: 80 },
    // { field: "block", headerName: "블록", width: 100 },
    { field: "time", headerName: "시간", width: 170 },

    ...(mainNet !== "BTC"
      ? [{ field: "transaction", headerName: "트랜잭션", width: 200 }]
      : []),
  ];

  const [data, setData] = useState([]);

  const [filterModel, setFilterModel] = React.useState();
  useMemo(() => {
    if(mainNet !== "BTC"){
      setFilterModel({
        items: [
          {
            field: "transaction",
            operator: "contains",
            value: searchContent,
          },
        ],
      });
    }else{
      setFilterModel({
        items: [
          {
            field: "name",
            operator: "contains",
            value: searchContent,
          },
        ],
      });

    }
  }, [searchContent]);

  React.useMemo(() => {
    const rows = [];
    if (list.length <= 0) {
      setData([]);
      return;
    }
    list.map((transaction, idx) => {
      let id = idx;
      // const checkbox = list.includes(transaction);
      const checkbox = isRemove;
      const name = transaction;
      const addressItems = mainNet === "BTC"
        ? [addressDictList.find((addressItem) => addressItem?.txId === transaction)] // BTC는 첫 번째 항목만 선택
        : addressDictList.filter((addressItem) => addressItem?.address?.addr === transaction); // BTC가 아닌 경우 전부 선택

// 모든 addressItem을 처리
      addressItems.forEach((addressItem) => {
        if (!addressItem) return; // 유효하지 않은 경우 무시

        let value, direction, block;

        if (mainNet === "BTC") {
          value = (addressItem?.value ? addressItem?.value : 0.0)?.toFixed(5);
          direction = addressItem?.relationType === "OUT" ? "OUT" : "IN";
          block = addressItem?.block;
        } else if (mainNet === "ETH") {
          value = Decimal(
            addressItem?.transaction?.value / 1000000000000000000
              ? addressItem?.transaction?.value / 1000000000000000000
              : 0.0
          )?.toFixed(5);
          direction = addressItem?.relationType === "OUT" ? "OUT" : "IN";
          block = addressItem?.transaction?.block;
        } else if (mainNet === "erc") {
          value = Decimal(
            addressItem?.value / 100000
              ? addressItem?.value / 100000
              : 0.0
          )?.toFixed(5);
          direction = addressItem?.relationType === "OUT" ? "OUT" : "IN";
          block = addressItem?.transaction?.block;
        } else if (mainNet === "TRX") {
          value = Decimal(
            addressItem?.transaction?.value / 1000000
              ? addressItem?.transaction?.value / 1000000
              : 0.0
          )?.toFixed(5);
          direction = addressItem?.relationType === "OUT" ? "OUT" : "IN";
          block = addressItem?.transaction?.block;
        } else if (mainNet === "XRP") {
          const onlyValue = (
            addressItem?.currency === "XRP"
              ? Decimal(addressItem?.value ? addressItem?.value : 0.0) / 1000000
              : Decimal(addressItem?.value ? addressItem?.value : 0.0)
          )?.toFixed(5);
          value = `${onlyValue} ${addressItem?.currency.slice(0, 4)}`;
          direction = addressItem?.relationType === "OUT" ? "OUT" : "IN";
          block = addressItem?.transaction?.block;
        }

        let timeValue = mainNet === "BTC" ? addressItem?.timestamp : addressItem?.transaction?.timestamp;
        rows.push({
          id: mainNet !== "BTC" ? addressItem?.transaction?.txHash : transaction,
          checkbox: checkbox,
          name: name,
          value: value,
          direction: direction,
          block: block,
          time: dayjs.utc(timeValue* 1000).format(WALLET_DATE_FORMAT),
          address: transaction,
          ...(mainNet !== "BTC" ? { transaction: addressItem?.transaction?.txHash } : {}),
        });
      });
      return null;
    });
    setData(rows);
  }, [list]);

  return (
    <div>
      <div
        className="bold-title"
        style={{
          marginTop: 16,
        }}
      >
        {title}
        {list.length > TRANSACTION_MAX_UNDISPLAYED
          ? TRANSACTION_MAX_UNDISPLAYED + "+"
          : list.length}
        {mainNet !== "BTC" &&
          <span>
        {' '}
            {'(트랜잭션 :'} {data.length})
        </span>}
      </div>
      <CustomDataGrid data={data} columns={columns} filterModel={filterModel} />
    </div>
  );
};
