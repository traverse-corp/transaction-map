/* eslint-disable react-hooks/exhaustive-deps */
import "./wallet.scss";
import Header from "../../components/header/Header";
import React, { useEffect, useMemo, useRef, useState } from "react";

import "reactflow/dist/style.css";
import "../../components/nodes/nodes.scss";
import ApiService from "../../common/ApiService";
import WalletSummary from "../modal/WalletSummary";
import { useNodesInitialized, useReactFlow } from "reactflow";
import TransactionSetting from "../modal/TransactionSetting";
import { TransactionContext } from "../../context/TransactionContext";
import { SearchAddress } from "./components/SearchAddress";
import SearchOption from "./components/SearchAddress/SearchBar/SearchOption";
import { E_SLIDING_PANEL_TYPE } from "../../common/Constant";
import { SlidingPanelContext } from "../../context/SlidingPanelContext";

const TransactionMap = () => {
  const {
    isReloadMap,
    mainNet,
    setMainNet,
    walletAddress,
    setShowMainNetList,
    setBtnSearch,
    setShowSearchInputs,
    setSearchInputsList,
    isOpenSearchOption,
    setIsOpenSearchOption,
    setIsSearch,
    options,
    isOptionSelect,
    isNewOptionTab,
    isSearch,
    setType,
  } = React.useContext(TransactionContext);
  const { setWbAddress, setWbNet } = React.useContext(SlidingPanelContext);

  //지갑주소 검색 최근검색
  //화면창 확대/축소
  const [btnScale, setBtnScale] = useState(false);

  //클릭시 이동
  const topRef = useRef();
  const transactionMapRef = useRef();
  //고위험 모달
  const [openDanger, setOpenDanger] = useState(false);
  const [selectedCrimed, setSelectedCrimed] = useState(null);

  //추가, 메인넷 선택

  const childComponentRef1 = useRef();

  // 화면 조정 관련
  const [nodeInit, setNodeInit] = useState(false);
  const flowRef = useRef(null);
  const reactFlowInstance = useReactFlow();
  const nodesChanged = useNodesInitialized();

  const setViewFit = () => {
    reactFlowInstance.fitView({ includeHiddenNodes: true, duration: 800 });
  };

  useEffect(() => {
    setViewFit();
  }, [btnScale]);

  useEffect(() => {
    if (!nodeInit) {
      setNodeInit(true);
      setViewFit();
    }
  }, [nodesChanged]);

  // 날짜 포맷 변경 함수
  const date = new Date();
  const currentTime = date
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const scaleBtnClick = () => {
    if (!btnScale) {
      transactionMapRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setBtnScale((btnScale) => !btnScale);
  };
  let toggleClassCheck = btnScale ? "scale-active" : "";

  function settingSearchInputList(item) {
    if (item) {
      setSearchInputsList((prevSearchInputsList) => {
        const updatedList = [...prevSearchInputsList];

        if (updatedList.includes(item)) {
          const index = updatedList.indexOf(item);
          if (index !== -1) {
            updatedList.splice(index, 1);
          }
        }

        if (updatedList.length < 10) {
          updatedList.unshift(item);
        } else {
          updatedList.pop();
          updatedList.unshift(item);
        }

        return updatedList;
      });
    } else {
      setSearchInputsList((prevSearchInputsList) => {
        const updatedList = [...prevSearchInputsList];

        if (updatedList.includes(walletAddress)) {
          const index = updatedList.indexOf(walletAddress);
          if (index !== -1) {
            updatedList.splice(index, 1);
          }
        }

        if (updatedList.length < 10) {
          updatedList.unshift(walletAddress);
        } else {
          updatedList.pop();
          updatedList.unshift(walletAddress);
        }

        return updatedList;
      });
    }
  }
  function searchAddressBtnClick() {
    setIsSearch(true);
  }

  function searchMainNetBtnClick(e) {
    e.stopPropagation();
    setShowMainNetList((showMainNetList) => !showMainNetList);
  }

  /*주요 트랜잭션, 연관된 지갑주소 조회 */
  const searchTransaction = (searchAddres) => {
    let params = {
      address: searchAddres,
      offset: 0,
      limit: 50,
      mainNet: mainNet,
      count: 10,
      direction: 'ALL'
    };
    ApiService.sendPostToGraph("map/transaction-map/major", params).then(
      function a(response) {
        if (response) {
          if (response.data && response.data.transactionList) {
            setTransacted(response.data.transactionList);

            let objectArray = [];
            // eslint-disable-next-line array-callback-return
            objectArray = response.data.transactionList.reduce((prev, now) => {
              if (
                !prev.find((item) => item.sendAddrs === now.sendAddrs) ||
                !prev.find((item) => item.recvAddrs === now.recvAddrs)
              ) {
                return prev.concat([now]);
              } else {
                return prev;
              }
            }, []);
            setRelatedAdrs(objectArray);
          }
        }
      }
    );
  };
  /**
   * 서버로부터 데이터 조회
   */
  const getDenylistData = async (address) => {
    const body = {
      walletAddress: address,
      tranDtm: currentTime,
      tranNo: "transight_web_page",
    };
    setShowSearchInputs(false);
    settingSearchInputList();
    return ApiService.sendPost("wallet/highRiskSearch1", body).then(function a(
      response
    ) {
      if (response) {
        let denyList;
        if (
          response.data.rspCode === "0000" ||
          response.data.rspCode === "A0000"
        ) {
          let data = response.data;

          // 블랙리스트면 데이터 세팅
          if (data.isDenylist === "Y" && response.data.nthList) {
            if (data.denylistDetail.walletType === "ERC-20(USDT)") {
              setMainNet("USDT");
            } else {
              setMainNet(data.denylistDetail.walletType);
            }
          } else {
            // 메인넷 로고 이미지 초기화
            // setMainNet("");
          }

          if (data.isDenylist === "Y") {
            var blk = data.denylistDetail;
            denyList = {
              walletAddress: blk.walletAddress || "-",
              walletType: blk.walletType || "-",
              riskLevel: blk.riskLevel || "-",
              raCode1KOR: blk.raCode1KOR || "-",
              raCode2KOR: blk.raCode2KOR || "-",
              raCode3: blk.raCode3 || "-",
              dataType: blk.dataType || "-",
              exchange: blk.exchange || "-",
              extractSource1: blk.extractSource1 || "-",
              extractSource2: blk.extractSource2 || "-",
              addedDate:
                blk.addedDate[0] +
                "." +
                blk.addedDate[1].toString().padStart(2, "0") +
                "." +
                blk.addedDate[2].toString().padStart(2, "0"),
              comment: blk.comment || "-",
              riskAnalType: blk.riskAnalysisType || "-",
              sourceAddress: blk.sourceAddress || "-",
              sourceDetails: blk.sourceDetails || "-",
              hopCnt: blk.hopCount || "-",
            };
          }
        }
        return {
          denylistDetail: response.data.denylistDetail,
          denyList: denyList,
          imgIds: response.data.imgIds,
        };
      } else {
        return [];
      }
    });
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      searchAddressBtnClick();
    }
  };

  const [isOpenSetting, setIsOpenSetting] = useState(false);
  const openSetting = () => {
    setIsOpenSearchOption(true);
  };

  useMemo(() => {
    isReloadMap > 0 && searchAddressBtnClick();
  }, [isReloadMap]);

  useMemo(() => {
    if (
      isOptionSelect === undefined ||
      isNewOptionTab ||
      childComponentRef1.current === null
    )
      return;
    const address = options[isOptionSelect];
    getDenylistData(address).then((result) => {
      setShowSearchInputs(false);
      setNodeInit(false);
      // console.log("result: ", result);
      childComponentRef1.current.init(
        address,
        mainNet,
        "transactionMap",
        result.denylistDetail,
        result.denyList
      );
    });
  }, [isOptionSelect, options, childComponentRef1]);

  React.useMemo(() => {
    setWbAddress(walletAddress);
    setWbNet(mainNet);
    setType(E_SLIDING_PANEL_TYPE.WB_DETAIL);
  }, [isSearch, mainNet]);

  return (
    <div
      className="transactionMap"
      ref={topRef}
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <Header />
      <div
        className="transactionMap-container"
        onClick={() => setBtnSearch(false)}
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
        }}
      >
        <SearchAddress
          searchMainNetBtnClick={searchMainNetBtnClick}
          handleKeyPress={handleKeyPress}
          searchAddressBtnClick={searchAddressBtnClick}
          settingSearchInputList={settingSearchInputList}
          getDenylistData={getDenylistData}
          toggleClassCheck={toggleClassCheck}
          transactionMapRef={transactionMapRef}
          openSetting={openSetting}
          scaleBtnClick={scaleBtnClick}
          btnScale={btnScale}
          flowRef={flowRef}
          childComponentRef1={childComponentRef1}
        />
      </div>
      {/* 고위험지갑 요약정보 모달 */}
      {openDanger && (
        <WalletSummary
          crimed={selectedCrimed}
          open={openDanger}
          onClose={() => {
            setSelectedCrimed(null);
            setOpenDanger(false);
          }}
          onButtonClick={() => {}}
        />
      )}
      <TransactionSetting
        open={isOpenSetting}
        onClose={() => {
          setIsOpenSetting(false);
        }}
      />
      <SearchOption
        open={isOpenSearchOption}
        onClose={() => {
          setIsOpenSearchOption(false);
        }}
      />
    </div>
  );
};

export default TransactionMap;
