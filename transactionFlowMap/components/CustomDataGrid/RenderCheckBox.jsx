import React from "react";
import { TransactionDetailContext } from "../../../../context/TransactionDetailContext";

export const RenderCheckBox = ({ props, isRemove }) => {
  const {
    setWaitingList,
    waitingList,
    renderedTransaction,
    setRenderedTransaction,
    unrenderedTransaction,
    setUnrenderedTransaction,
  } = React.useContext(TransactionDetailContext);
  return (
    <input
      type="checkbox"
      id={props.row.id}
      checked={props.row.checkbox}
      onChange={() => {
        setWaitingList((prev) => prev.filter((l) => l.address !== props.row.address));
        if (isRemove) {
          const filterList = renderedTransaction.filter(
            (l) => l !== props.row.address
          );
          const temp = [props.row.address, ...unrenderedTransaction]
          if (filterList.length === 0) {
            setTimeout(() => setRenderedTransaction([]), 0);
          }
          setRenderedTransaction(filterList);
          setUnrenderedTransaction(temp)
        } else {
          const filterList = unrenderedTransaction.filter(
            (l) => l !== props.row.address
          );
          const temp = [props.row.address, ...renderedTransaction]
          if (filterList.length === 0) {
            setTimeout(() => setUnrenderedTransaction([]), 0);
          }
          setUnrenderedTransaction(filterList);
          setRenderedTransaction(temp)
        }
        setWaitingList((prev) => [
          ...prev,
          { address: props.row.address,  transaction: props?.row?.transaction, isRemove },
        ]);
      }}
    />
  );
};
