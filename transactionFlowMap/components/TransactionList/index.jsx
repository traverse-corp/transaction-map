import React, { useCallback, useMemo, useState } from "react";
import { TransactionDetailContext } from "../../../../context/TransactionDetailContext";
import { CustomDataGrid } from "../CustomDataGrid";
import { TRANSACTION_MAX_UNDISPLAYED } from "../../../../common/Constant";
import { RenderCheckBox } from "../CustomDataGrid/RenderCheckBox";
import { renderName } from "../CustomDataGrid/NameCopy";
const Decimal = require("decimal.js");

export const TransactionList = ({
                                  list,
                                  addressMapDict,
                                  addrCount,
                                  addressDictList,
                                  title,
                                  isRemove,
                                }) => {
  const { searchContent, setIsWallet } = React.useContext(
    TransactionDetailContext
  );

  useMemo(() => {
    setIsWallet(false);
  }, []);
  const LocalRenderCheckBox = useCallback(
    (props) => {
      return <RenderCheckBox isRemove={isRemove} props={props} />;
    },
    [isRemove]
  );

  const updateRenderName = useCallback(
    (props) => {
      return renderName(props);
    },
    []
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
      headerName: "지갑주소",
      width: 320,
      renderCell: updateRenderName,
    },
    { field: "value", headerName: "전송량", width: 130 },
    { field: "direction", headerName: "방향", width: 100 },
  ];

  const [data, setData] = useState([]);

  const [filterModel, setFilterModel] = React.useState();

  useMemo(() => {
    setFilterModel({
      items: [
        {
          field: "name",
          operator: "contains",
          value: searchContent,
        },
      ],
    });
  }, [searchContent]);

  useMemo(() => {
    const rows = [];
    if (list.length <= 0) {
      setData(rows)
      return
    }
    list.forEach((address, idx) => {
      if (idx === 0) {
        addressMapDict = {};
        addressMapDict[address] = 0;
        addrCount = 0;
      } else {
        if (addressMapDict.hasOwnProperty(address)) {
          addressMapDict[address] += 1;
          addrCount = addressMapDict[address];
        } else {
          addressMapDict[address] = 0;
          addrCount = addressMapDict[address];
        }
      }
      const id = address;

      const name = address;
      const value = Decimal(
        addressDictList.filter(
          (addressItem) => addressItem?.address?.addr === address
        )[addrCount]?.relationValue
      )?.toFixed(5);
      const direction =
        addressDictList.filter(
          (addressItem) => addressItem?.address?.addr === address
        )[addrCount]?.relationType === "OUT"
          ? "Input"
          : "Output";

      rows.push({
        id: id,
        name: name,
        value: value,
        checkbox: isRemove,
        direction: direction,
        address: address,
      });
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
      </div>
      <CustomDataGrid data={data} columns={columns} filterModel={filterModel} />
    </div>
  );
};