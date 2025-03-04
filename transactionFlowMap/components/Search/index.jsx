import { Input } from "@mui/joy";
import React, { useState } from "react";

export const Search = ({ setSearchContent }) => {
  const [searchInput, setSearchInput] = useState("");

  const handleChange = (event) => {
    const inputValue = event.target.value.trim();
    setSearchInput(inputValue);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      searchAddressBtnClick();
    }
  };

  const searchAddressBtnClick = () => {
    setSearchContent(searchInput);
  };
  return (
    <div
      style={{
        marginTop: 16,
      }}
    >
      <div className="bold-title">트랜잭션 조회</div>
      <div
        style={{
          position: "relative",
        }}
      >
        <Input
          style={{
            marginTop: 4,
          }}
          placeholder="트랜잭션주소"
          value={searchInput}
          onInput={handleChange}
          onKeyUp={handleKeyPress}
          sx={{
            "--Input-focusedThickness": "0",
            "--Input-placeholderOpacity": 1,
            "--Input-gap": "15px",
            "--Input-minHeight": "60px",
            "--Input-paddingInline": "20px",
            "--Input-decoratorChildHeight": "0px",
          }}
        ></Input>
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 0,
          }}
        >
          <button onClick={searchAddressBtnClick}>
            <img
              src={process.env.PUBLIC_URL + "/images/search.svg"}
              alt="검색"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
