/* eslint-disable react-hooks/exhaustive-deps */
import CalendarEndIcon from "../../../icons/CalendarEndIcon";
import CalendarStartIcon from "../../../icons/CalendarStartIcon";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import React from "react";
import { DateTimeSelector } from "../../../common/DateTimeSelector";
import { TooltipComponent } from "../../../customTooltip/TooltipComponent";
import MaxQueryType from "../../../comSelector/MaxQueryType";
import { QueryOptionButton } from "./QueryOptionButton";
import { TransactionDetailContext } from "../../../../context/TransactionDetailContext";

dayjs.extend(utc);

const SelectTimeRange = () => {
  const {
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    setTransactionRetrieval,
    setOnQueryExecution,
  } = React.useContext(TransactionDetailContext);

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          position: "relative",
          gap: 4,
          flex: 1,
        }}
      >
        <div className="bold-title" style={{ fontSize: 15 }}>
          기간 조회(UTC)
        </div>
        <div className="time-info">
          <TooltipComponent
            content={
              "설정한 기간에 해당하는 트랜잭션을 추가로 조회합니다.<br />불러오기 시 해당 기간에 발생한 트랜잭션을 추가로<br />미표출 트랜잭션에 보여줍니다.<br />기간을 설정하지 않은 경우 최근 100개 트랜잭션을<br />추가로 불러옵니다.<br />조회하기 시 불러온 트랜잭션 중 조회 기간에 해당하는<br />트랜잭션을 선별적으로 보여줍니다."
            }
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "horizontal",
          gap: 5,
          marginTop: 4,
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "horizontal",
            gap: 5,
          }}
        >
          <DateTimeSelector
            timeValue={startTime}
            setTimeValue={setStartTime}
            Icon={CalendarStartIcon}
            label={"시작일시"}
          />
          <DateTimeSelector
            timeValue={endTime}
            setTimeValue={setEndTime}
            Icon={CalendarEndIcon}
            label={"종료일시"}
          />
        </div>
        <MaxQueryType />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <QueryOptionButton
            title={"불러오기"}
            onClick={() => {
              setTransactionRetrieval(true);
            }}
          />
          {/* <QueryOptionButton */}
          {/*   title={"조회하기"} */}
          {/*   onClick={() => { */}
          {/*     setOnQueryExecution(true); */}
          {/*   }} */}
          {/* /> */}
        </div>
      </div>
    </div>
  );
};

export default SelectTimeRange;
