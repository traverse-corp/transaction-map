/* eslint-disable react-hooks/exhaustive-deps */
import * as React from "react";
import ComUtil from "../common/ComUtil";
import {
  TRANSACTION_DATE_ERROR_POPUP,
  TRANSACTION_MAX_DAY,
} from "../common/Constant";
import dayjs from "dayjs";

export const TransactionDetailContext = React.createContext(null);

export const TransactionDetailProvider = ({ children }) => {
  const [startTime, setStartTime] = React.useState(null);
  const [endTime, setEndTime] = React.useState(null);
  const [transactionRetrieval, setTransactionRetrieval] = React.useState(false);
  const [onQueryExecution, setOnQueryExecution] = React.useState(false);
  const [max, setMax] = React.useState(null);
  const [isConfirm, setIsConfirm] = React.useState(false);
  const [isCancel, setIsCancel] = React.useState(false);
  const [searchContent, setSearchContent] = React.useState("");
  const [waitingList, setWaitingList] = React.useState([]);
  const [isClose, setIsClose] = React.useState(false);
  const [isWallet, setIsWallet] = React.useState(false);
  const [renderedTransaction, setRenderedTransaction] = React.useState([]);
  const [unrenderedTransaction, setUnrenderedTransaction] = React.useState([]);
  const [clickNode, setClickNode] = React.useState("");
  const [tempAddressList, setTempAddressList] = React.useState([]);
  const [renderedAddress, setRenderedAddress] = React.useState([]);
  const [unrenderedAddress, setUnrenderedAddress] = React.useState([]);
  const [addressDictList, setAddressDictList] = React.useState([]);
  const [flowNodeList, setFlowNodeList] = React.useState([]);
  const [flowEdgeList, setFlowEdgeList] = React.useState([]);

  React.useMemo(() => {
    if (!transactionRetrieval && !onQueryExecution) {
      return;
    }
    // if (!(startTime && endTime)) {
    //   ComUtil.showPopUp(TRANSACTION_DATE_ERROR_POPUP);
    //   return;
    // }
    const currentDay = dayjs().unix();
    // if (currentDay < endTime) {
    //   ComUtil.showPopUp(TRANSACTION_DATE_ERROR_POPUP);
    //   return;
    // }
    if (startTime > endTime) {
      ComUtil.showPopUp(TRANSACTION_DATE_ERROR_POPUP);
      return;
    }
    const start = dayjs.unix(startTime);
    const end = dayjs.unix(endTime);
    const hours = end.diff(start, "hours");
    const days = Math.floor(hours / 24);
    // if (days > TRANSACTION_MAX_DAY) {
    //   ComUtil.showPopUp(TRANSACTION_DATE_ERROR_POPUP);
    //   return;
    // }
  }, [transactionRetrieval, onQueryExecution]);

  const init = () => {
    setEndTime(false);
    setStartTime(false);
    setMax(null);
    setSearchContent("");
    setWaitingList([]);
    setRenderedTransaction([]);
    setUnrenderedTransaction([]);
    setClickNode("");
  };

  React.useMemo(() => {
    if (isCancel) {
      init();
      setIsCancel(false);
    }
  }, [isCancel]);

  const data = {
    init,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    transactionRetrieval,
    setTransactionRetrieval,
    onQueryExecution,
    setOnQueryExecution,
    max,
    setMax,
    isConfirm,
    setIsConfirm,
    isCancel,
    setIsCancel,
    searchContent,
    setSearchContent,
    waitingList,
    setWaitingList,
    isClose,
    setIsClose,
    isWallet,
    setIsWallet,
    renderedTransaction,
    setRenderedTransaction,
    unrenderedTransaction,
    setUnrenderedTransaction,
    clickNode,
    setClickNode,
    tempAddressList,
    setTempAddressList,
    renderedAddress,
    setRenderedAddress,
    unrenderedAddress,
    setUnrenderedAddress,
    addressDictList,
    setAddressDictList,
    flowNodeList,
    setFlowNodeList,
    flowEdgeList,
    setFlowEdgeList,
  };

  return (
    <TransactionDetailContext.Provider value={data}>
      {children}
    </TransactionDetailContext.Provider>
  );
};
