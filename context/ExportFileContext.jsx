/* eslint-disable react-hooks/exhaustive-deps */
import * as React from "react";
import { E_FILE_TYPE } from "../common/Constant";

export const ExportFileContext = React.createContext(null);

export const ExportFileProvider = ({ children }) => {
  const [fileType, setFileType] = React.useState(E_FILE_TYPE.PDF);
  const [isOpenExport, setIsOpenExport] = React.useState(false);
  const [address, setAddress] = React.useState("");
  const [net, setNet] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  const data = {
    fileType,
    setFileType,
    isOpenExport,
    setIsOpenExport,
    address,
    setAddress,
    net,
    setNet,
    title,
    setTitle,
    description,
    setDescription,
  };

  return (
    <ExportFileContext.Provider value={data}>
      {children}
    </ExportFileContext.Provider>
  );
};
