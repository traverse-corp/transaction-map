/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import SelectTimeRange from "./SelectTimeRange";
import { Search } from "./Search";
import { WalletList } from "./WalletList";
import { TransactionDetailContext } from "../../../context/TransactionDetailContext";
const DetailWallet = ({
  currentModalAddress,
  mainNet,
  addressDictList,
  displayedTransactionList,
  undisplayedTransactionList,
}) => {
  const {
    setIsConfirm,
    setIsCancel,
    setSearchContent,
    setIsClose,
    renderedTransaction,
    setRenderedTransaction,
    unrenderedTransaction,
    setUnrenderedTransaction,
  } = React.useContext(TransactionDetailContext);
  useEffect(() => {
    setRenderedTransaction(displayedTransactionList);
    setUnrenderedTransaction(undisplayedTransactionList);
  }, [displayedTransactionList, undisplayedTransactionList]);
  return (
    <div>
      <div className="address-inquiry">
        <div className="transaction-list">
          <div className="bold-title">지갑주소</div>
          <div className="regular-text">
            {currentModalAddress?.data?.address}
          </div>
          <table style={{ margin: "10px", width: "480px" }}></table>
          <SelectTimeRange />
          <Search setSearchContent={setSearchContent} />
          <WalletList
            mainNet={mainNet}
            list={renderedTransaction}
            addressDictList={addressDictList}
            title={mainNet === "BTC" ? "표출 트랜잭션: " : "표출 주소: "}
            isRemove={true}
          />
          <WalletList
            mainNet={mainNet}
            list={unrenderedTransaction}
            addressDictList={addressDictList}
            title={mainNet === "BTC" ? "미표출 트랜잭션: " : "미표출 주소: "}
            isRemove={false}
          />
        </div>
      </div>
      <div className="button-frame-50" style={{ marginTop: "39px" }}>
        <button
          className="btn-solid"
          style={{ background: "#1640DB" }}
          onClick={() => {
            setIsConfirm(true);
          }}
        >
          적용
        </button>
        <button
          className="btn-outline"
          onClick={() => {
            setIsCancel(true);
            setIsClose(true);
          }}
        >
          취소
        </button>
      </div>
    </div>
  );
};

export default DetailWallet;
