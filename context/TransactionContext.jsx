/* eslint-disable react-hooks/exhaustive-deps */
import * as React from "react";
import {
  E_SLIDING_PANEL_TYPE,
  SESSION_TRANSACTION_SETTING_COUNT,
  SESSION_TRANSACTION_SETTING_END_TIME,
  SESSION_TRANSACTION_SETTING_HIGH_RISK,
  SESSION_TRANSACTION_SETTING_IS_NEW_SEARCH,
  SESSION_TRANSACTION_SETTING_START_TIME,
  // SESSION_TRANSACTION_SETTING_TRACE,
  SESSION_TRANSACTION_SETTING_VOLUME,
  TRANSACTION_MAX_COUNT,
} from "../common/Constant";
import { useState } from "react";
import ComUtil from "../common/ComUtil";
import { useReactFlow } from "reactflow";

export const TransactionContext = React.createContext(null);

export const TransactionProvider = ({ children }) => {
  // OLD
  const [volume, setVolume] = React.useState(false);
  const [count, setCount] = React.useState(TRANSACTION_MAX_COUNT);
  const [linkHighRisk, setLinkHighRisk] = React.useState(false);
  const [isNewSearch, setIsNewSearch] = React.useState(true); // new = true, add = false
  const [isSaveNewSetting, setIsSaveNewSetting] = React.useState(false);
  const [isReloadMap, setIsReloadMap] = React.useState(0);
  const [isCancel, setIsCancel] = React.useState(false);
  const [showMainNetList, setShowMainNetList] = React.useState(false);
  const [walletImg, setWalletImg] = React.useState(`/images/wallet.svg`);
  const [btnSearch, setBtnSearch] = React.useState(false);
  const [showSearchInputs, setShowSearchInputs] = useState(false);
  const [searchInputsList, setSearchInputsList] = useState([]);

  //New
  const [trace, setTrace] = React.useState(false);
  const [mainNet, setMainNet] = React.useState("BTC");
  const [walletAddress, setWalletAddress] = React.useState("");
  const [isOpenSearchOption, setIsOpenSearchOption] = useState(false);
  const [transferAmountType, setTransferAmountType] = React.useState("");
  const [minAmount, setMinAmount] = React.useState(0.0);
  const [maxAmount, setMaxAmount] = React.useState(0.0);
  const [intendedTransfer, setIntendedTransfer] = useState(false);
  const [isHighRisk, setIsHighRisk] = React.useState(false);
  const [isSaveSearchOption, setIsSaveSearchOption] = React.useState(false);
  const [isCancelSearchOption, setIsCancelSearchOption] = React.useState(false);
  const [isMapFit, setIsMapFit] = React.useState(false);
  const [errorTimeRange, setErrorTimeRange] = React.useState(false);
  const [startTime, setStartTime] = React.useState(null);
  const [endTime, setEndTime] = React.useState(null);
  const [options, setOptions] = useState([]);
  const [isSearch, setIsSearch] = useState(false);
  const [isOptionSelect, setIsOptionSelect] = React.useState();
  const reactFlowInstance = useReactFlow();
  const [isOpenDownloadModal, setIsOpenDownloadModal] = useState(false);
  const [isNewOptionTab, setIsNewOptionTab] = useState(false);
  const [type, setType] = React.useState(E_SLIDING_PANEL_TYPE.WB_DETAIL);
  const [positionDict, setPositionDict] = useState({});

  React.useEffect(() => {
    init();
  }, []);

  const init = () => {
    setStartTime(
      sessionStorage.getItem(SESSION_TRANSACTION_SETTING_START_TIME) === "NaN"
        ? null
        : sessionStorage.getItem(SESSION_TRANSACTION_SETTING_START_TIME)
    );
    setEndTime(
      sessionStorage.getItem(SESSION_TRANSACTION_SETTING_END_TIME) === "NaN"
        ? null
        : sessionStorage.getItem(SESSION_TRANSACTION_SETTING_END_TIME)
    );
    // setTrace(
    //   sessionStorage.getItem(SESSION_TRANSACTION_SETTING_TRACE) === "true"
    // );
    setVolume(
      sessionStorage.getItem(SESSION_TRANSACTION_SETTING_VOLUME) === "true"
    );
    setCount(
      !sessionStorage.getItem(SESSION_TRANSACTION_SETTING_COUNT)
        ? TRANSACTION_MAX_COUNT
        : parseInt(sessionStorage.getItem(SESSION_TRANSACTION_SETTING_COUNT))
    );
    setLinkHighRisk(
      sessionStorage.getItem(SESSION_TRANSACTION_SETTING_HIGH_RISK) === "true"
    );
    setIsNewSearch(
      !sessionStorage.getItem(SESSION_TRANSACTION_SETTING_IS_NEW_SEARCH)
        ? true
        : sessionStorage.getItem(SESSION_TRANSACTION_SETTING_IS_NEW_SEARCH) ===
            "true"
    );
  };

  React.useMemo(() => {
    if (isSaveNewSetting) {
      if (startTime > endTime) {
        setIsSaveNewSetting(false);
        return;
      }
      if (isNewSearch) {
        setIsReloadMap((prev) => prev + 1);
        setIsSaveNewSetting(false);
      }
    }
  }, [isSaveNewSetting, isNewSearch]);

  React.useMemo(() => {
    if (isCancel) {
      init();
      setIsCancel(false);
    }
  }, [isCancel]);

  React.useMemo(() => {
    if (!isSaveNewSetting) return;
    if ((startTime && endTime) || (!startTime && !endTime)) {
      sessionStorage.setItem(SESSION_TRANSACTION_SETTING_START_TIME, startTime);
      sessionStorage.setItem(SESSION_TRANSACTION_SETTING_END_TIME, endTime);
    }
    // sessionStorage.setItem(SESSION_TRANSACTION_SETTING_TRACE, trace.toString());
    sessionStorage.setItem(SESSION_TRANSACTION_SETTING_VOLUME, volume);
    sessionStorage.setItem(SESSION_TRANSACTION_SETTING_COUNT, count);
    sessionStorage.setItem(SESSION_TRANSACTION_SETTING_HIGH_RISK, linkHighRisk);
    sessionStorage.setItem(
      SESSION_TRANSACTION_SETTING_IS_NEW_SEARCH,
      isNewSearch
    );
  }, [isSaveNewSetting]);

  React.useMemo(() => {
    if (!walletAddress) return;
    setMainNet(ComUtil.inqMainNet(walletAddress));
  }, [walletAddress]);

  React.useMemo(() => {
    if (!isSearch) return;
    const index = options.findIndex((x) => x === walletAddress);
    if (index !== -1) {
      setIsOptionSelect(index);
    } else {
      const temp = options;
      if (temp.slice(-1).length > 0) {
        if (temp.slice(-1)[0].length === 0) {
          temp.pop();
        }
      }
      const final = [...temp, walletAddress];
      setOptions(final);
      setIsOptionSelect(final.length - 1);
    }
    setIsNewOptionTab(false);
    setIsSearch(false);
    setType(E_SLIDING_PANEL_TYPE.WB_DETAIL);
  }, [isSearch]);

  React.useMemo(() => {
    if (isOptionSelect === undefined) return;
    setWalletAddress(options[isOptionSelect]);
  }, [isOptionSelect]);

  React.useMemo(() => {
    if (!mainNet) {
      setWalletImg(`/images/wallet.svg`);
    } else {
      setWalletImg(`/images/${mainNet}.png`);
    }
  }, [mainNet]);

  const setViewFit = () => {
    reactFlowInstance.fitView({ includeHiddenNodes: true, duration: 800 });
  };

  React.useMemo(() => {
    setViewFit();
  }, [isMapFit, isSearch]);

  React.useMemo(() => {
    if (!isNewOptionTab) return;
    setWalletAddress("");
    setOptions((prev) => [...prev, ""]);
    setIsOptionSelect(options.length);
  }, [isNewOptionTab]);
  const data = {
    count,
    setCount,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    errorTimeRange,
    setErrorTimeRange,
    trace,
    setTrace,
    volume,
    setVolume,
    linkHighRisk,
    setLinkHighRisk,
    isNewSearch,
    setIsNewSearch,
    isSaveNewSetting,
    setIsSaveNewSetting,
    isCancel,
    setIsCancel,
    isReloadMap,
    setIsReloadMap,
    mainNet,
    setMainNet,
    walletAddress,
    setWalletAddress,
    showMainNetList,
    setShowMainNetList,
    walletImg,
    setWalletImg,
    btnSearch,
    setBtnSearch,
    showSearchInputs,
    setShowSearchInputs,
    searchInputsList,
    setSearchInputsList,
    isOpenSearchOption,
    setIsOpenSearchOption,
    transferAmountType,
    setTransferAmountType,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    intendedTransfer,
    setIntendedTransfer,
    isHighRisk,
    setIsHighRisk,
    isSaveSearchOption,
    setIsSaveSearchOption,
    isCancelSearchOption,
    setIsCancelSearchOption,
    isMapFit,
    setIsMapFit,
    options,
    setOptions,
    isSearch,
    setIsSearch,
    isOptionSelect,
    setIsOptionSelect,
    isOpenDownloadModal,
    setIsOpenDownloadModal,
    isNewOptionTab,
    setIsNewOptionTab,
    type,
    setType,
    positionDict,
    setPositionDict,
  };

  return (
    <TransactionContext.Provider value={data}>
      {children}
    </TransactionContext.Provider>
  );
};
