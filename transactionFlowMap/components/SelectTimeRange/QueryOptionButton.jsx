import React from "react";

export const QueryOptionButton = ({ title, onClick }) => {
  return (
    <button
      style={{
        background: "#202741",
        color: "#fff",
        borderRadius: 4,
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width: 62
      }}
      onClick={onClick}
    >
      {title}
    </button>
  );
};
