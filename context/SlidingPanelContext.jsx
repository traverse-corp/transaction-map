/* eslint-disable react-hooks/exhaustive-deps */
import * as React from "react";
import { SLIDER_MAX_WIDTH } from "../common/Constant";
import { getDenylistData } from "../common/TransactionService";

export const SlidingPanelContext = React.createContext(null);

export const SlidingPanelProvider = ({ children }) => {
  const [sliderWidth, setSliderWidth] = React.useState(SLIDER_MAX_WIDTH);
  const [tagInfo, setTagInfo] = React.useState("");
  const [isCollapse, setIsCollapse] = React.useState(true);
  const [wbAddress, setWbAddress] = React.useState("");
  const [wbNet, setWbNet] = React.useState("");
  const [denyData, setDenyData] = React.useState();
  const [isOpenSearchOption, setIsOpenSearchOption] = React.useState(false);

  //Search option
  const [startTime, setStartTime] = React.useState(null);
  const [endTime, setEndTime] = React.useState(null);
  const [errorTimeRange, setErrorTimeRange] = React.useState(false);
  const [isHighRisk, setIsHighRisk] = React.useState(false);
  const [minAmount, setMinAmount] = React.useState(0.0);
  const [maxAmount, setMaxAmount] = React.useState(0.0);
  const [searchContent, setSearchContent] = React.useState("");
  const [txData, setTxData] = React.useState(null);

  React.useMemo(() => {
    if (!denyData || !denyData.denylistDetail || !denyData.denyList) return;
    setTagInfo(denyData.denylistDetail.riskAnalysisType);
  }, [denyData]);

  React.useMemo(async () => {
    if (!wbAddress || wbAddress.length === 0) return;
    const result = await getDenylistData(wbAddress);
    setDenyData(result);
  }, [wbAddress]);

  const data = {
    sliderWidth,
    setSliderWidth,
    tagInfo,
    setTagInfo,
    isCollapse,
    setIsCollapse,
    wbAddress,
    setWbAddress,
    wbNet,
    setWbNet,
    denyData,
    setDenyData,
    isOpenSearchOption,
    setIsOpenSearchOption,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    errorTimeRange,
    setErrorTimeRange,
    isHighRisk,
    setIsHighRisk,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    searchContent,
    setSearchContent,
    txData,
    setTxData,
  };

  return (
    <SlidingPanelContext.Provider value={data}>
      {children}
    </SlidingPanelContext.Provider>
  );
};
