/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { TransactionList } from "./TransactionList";
import { Search } from "./Search";
import { TransactionDetailContext } from "../../../context/TransactionDetailContext";
const Decimal = require("decimal.js");
const DetailTransaction = ({
  currentModalAddress,
  mainNet,
  displayedAddressList,
  addressMapDict,
  addrCount,
  addressDictList,
  undisplayedAddressList,
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
    setRenderedTransaction(displayedAddressList);
    setUnrenderedTransaction(undisplayedAddressList);
  }, []);
  return (
    <>
      <div
        className="address-inquiry"
        style={{
          maxWidth: 600,
        }}
      >
        <div className="transaction-list">
          <div className="bold-title">트랜잭션</div>
          <table style={{ marginTop: "10px", width: "480px" }}>
            <tbody>
              <tr>
                <th>트랜잭션 해시</th>
                {/* Displays a truncated version of the transaction hash */}
                <td>
                  <div
                    className="regular-text"
                    style={{
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      display: "inline-block",
                      width: 350,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {currentModalAddress?.data?.txId}
                  </div>
                </td>
                <td>
                  <CopyToClipboard
                    text={currentModalAddress?.data?.txId}
                    onCopy={() => alert("클립보드에 복사되었습니다.")}
                  >
                    <div className="copy"></div>
                  </CopyToClipboard>
                </td>
              </tr>
              <tr>
                <th>블록</th>
                <td>{currentModalAddress?.data?.block} </td>
                <td> &nbsp;</td>
              </tr>
              <tr>
                <th>전송량</th>
                <td>
                  <td>
                    {currentModalAddress?.data?.value !== undefined
                      ? Decimal(currentModalAddress?.data?.value).toFixed(5)
                      : null}{" "}
                    {mainNet}
                  </td>
                </td>
                <td> &nbsp;</td>
              </tr>
            </tbody>
          </table>
          <Search setSearchContent={setSearchContent} />
          <TransactionList
            list={renderedTransaction}
            addressMapDict={addressMapDict}
            addrCount={addrCount}
            addressDictList={addressDictList}
            title={"표출 주소 "}
            isRemove={true}
          />
          <TransactionList
            list={unrenderedTransaction}
            addressMapDict={addressMapDict}
            addrCount={addrCount}
            addressDictList={addressDictList}
            title={"미표출 주소 "}
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
    </>
  );
};

export default DetailTransaction;
