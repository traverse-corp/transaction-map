/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  useContext,
  useMemo,
} from "react";
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  Controls,
  MiniMap,
} from "reactflow";
import AddressNode from "../nodes/AddressNode";
import TransactionNode from "../nodes/TransactionNode";
import MainNode from "../nodes/MainNode";
import BlacklistNode from "../nodes/BlacklistNode";
import mainBlackNode from "../nodes/MainBlackNode";
import whitelistNode from "../nodes/WhitelistNode";
import mainWhiteNode from "../nodes/MainWhiteNode";
import ComUtil from "../../common/ComUtil";
import TimeValueEdge from "../edges/timeValueEdge";
import {
  getGraphBTC,
  getGraphNotBTC,
  getPositionNotBTC,
  findClosestCoordinates,
  getPosition,
  setNthDataGraph,
  getTransactionList,
  getTransactionInfo,
  deleteNode,
  addNode,
  processDenyList,
} from "../../common/TransactionService";
import { TransactionContext } from "../../context/TransactionContext";
import { SlidingPanelContext } from "../../context/SlidingPanelContext";
import { TransactionDetailContext } from "../../context/TransactionDetailContext";
import {
  E_SLIDING_PANEL_TYPE,
  FLOW_MAP_DEFAULT_X,
  FLOW_MAP_DEFAULT_Y,
  FLOW_MAP_DEFAULT_Y_GAP,
} from "../../common/Constant";

// **TransactionFlowMap 컴포넌트 개요**
// 이 컴포넌트는 ReactFlow를 사용하여 트랜잭션 네트워크를 시각화.
// This component visualizes a transaction network using ReactFlow.
// 지갑 주소와 트랜잭션 데이터를 기반으로 노드와 엣지를 동적으로 렌더링.
// It dynamically renders nodes and edges based on wallet addresses and transaction data.
// 주요 기능:
// Major Features:
// - ReactFlow를 사용한 노드 및 엣지 구성
// - Visualization of nodes and edges using ReactFlow
// - 모달을 통한 상세 데이터 표시
// - Displays detailed data in a modal
// - 드래그 및 클릭 시 데이터 업데이트
// - Updates data upon drag-and-drop or node clicks

// 개선 방향:
// Improvement Suggestions:
// 2. **중복 로직 제거**: `getGraphBTC`, `getGraphNotBTC`의 공통 로직을 유틸 함수로 분리
// 2. **Remove Redundancy**: Refactor common logic in `getGraphBTC` and `getGraphNotBTC` into utility functions.

// **ReactFlow에서 사용할 커스텀 노드 타입 정의**
// **Define custom node types for ReactFlow**
const nodeTypes = {
  // 사용자 정의 노드 컴포넌트 매핑
  addressNode: AddressNode,
  transactionNode: TransactionNode,
  mainNode: MainNode,
  blacklistNode: BlacklistNode,
  mainBlackNode: mainBlackNode,
  whitelistNode: whitelistNode,
  mainWhiteNode: mainWhiteNode,
};

// **ReactFlow에서 사용할 커스텀 엣지 타입 정의**
// **Define custom edge types for ReactFlow**
const edgeTypes = {
  // 사용자 정의 엣지 컴포넌트
  timeValueEdge: TimeValueEdge,
};

// 기타 변수
// Other variables
let tempY = 0; // 새로운 노드 추가 시 Y 좌표를 임시로 저장
// Temporary Y-coordinate for adding nodes
let currentModalAddress = null; // 현재 열려 있는 모달의 주소 데이터
// Stores data for the currently open modal

const TransactionFlowMap = forwardRef((props, ref) => {
  const { setWbAddress, setTxData } = useContext(SlidingPanelContext);
  const {
    count,
    startTime,
    endTime,
    isNewSearch,
    trace,
    setTrace,
    walletAddress,
    setType,
    mainNet,
    setMainNet,
    positionDict,
    setPositionDict,
  } = useContext(TransactionContext);

  const {
    init: initDetailContext,
    isConfirm,
    waitingList,
    setIsConfirm,
    isClose: isCloseContext,
    setIsClose: setIsCloseContext,
    isWallet,
    onQueryExecution,
    setOnQueryExecution,
    clickNode,
    setClickNode,
    startTime: startTimeModal,
    endTime: endTimeModal,
    max,
    renderedTransaction,
    setRenderedTransaction,
    unrenderedTransaction,
    setUnrenderedTransaction,
    transactionRetrieval,
    setTransactionRetrieval,
    setRenderedAddress,
    setUnrenderedAddress,
    setTempAddressList,
    addressDictList,
    setAddressDictList,
    flowNodeList,
    setFlowNodeList,
    flowEdgeList,
    setFlowEdgeList,
  } = React.useContext(TransactionDetailContext);

  const [denyList, setDenyList] = useState();

  // Edges currently displayed on the screen
  const [page, setPage] = useState(""); // 현재 페이지 상태
  const [pageNum, setPageNum] = useState(0); // 현재 페이지 상태
  // Stores the current page state (e.g., transactionMap, walletAddress)

  // 추가 상태 변수
  // Additional state variables
  const [transactionPage, setTransactionPage] = useState(0); // 트랜잭션 데이터의 현재 페이지 번호
  // Tracks the current page number of transaction allPositionDictdata
  const [prevStart, setPrevStart] = useState(0);
  const [prevEnd, setPrevEnd] = useState(0);
  const [prevMax, setPrevMax] = useState(0);

  // 기타 변수 정의
  // Define other variables
  const flowRef = useRef(null); // ReactFlow의 참조를 저장하여 직접 접근 가능
  // Stores a reference to ReactFlow for direct access
  // const defaultX = 0;
  // const defaultY = 0;
  // const defaultXGap = 300;
  // const defaultXGapNotBTC = 300;
  // const defaultYGap = 50;

  // 초기화 함수
  // Initialization function
  const init = async (walletAddress, inputNet, page, nthData, denylist) => {
    // 페이지 상태 업데이트
    // Update the page state
    setPage(page);
    setDenyList(denylist);
    let tempNet = inputNet;
    // 선택된 메인넷 설정
    // Set the selected mainnet
    let address = walletAddress;

    // - todo erc20 token 과 eth 통합 필요 / erc20 token and eth integration required

    // USDT 및 ETH의 경우 주소를 소문자로 변환
    // Convert the address to lowercase for USDT and ETH
    if (inputNet === "USDT" || inputNet === "usdt") {
      tempNet = "erc";
      address = address.toLowerCase();
    }

    if (inputNet === "ETH") {
      address = address.toLowerCase();
    }
    setMainNet(tempNet);

    // - 기존에 미리 그래프가 만들어진 데이터 있는지 확인 후 nthData를 비동기로 가져옴
    // After checking whether there is data for which a graph has already been created, nthData is imported asynchronously.
    let nth = await nthData;
    if (nth?.length > 0) {
      // todo Modifications required from DB end to backend to front.
      // Don't need to see it right now.
      const { flowNodeListTemp, flowEdgeListTemp, allPositionDict } =
        await setNthDataGraph(walletAddress, nthData, positionDict, inputNet);
      setFlowNodeList(flowNodeListTemp);
      setFlowEdgeList(flowEdgeListTemp);
      setPositionDict(allPositionDict);
    } else {
      searchAddressBtnClick(address, inputNet);
    }

    // 상태 및 변수 초기화
    // Reset states and variables
    setFlowNodeList([]);
    setFlowEdgeList([]);
    setRenderedTransaction([]);
    setUnrenderedTransaction([]);
    setRenderedAddress([]);
    setUnrenderedAddress([]);
    setAddressDictList([]);
    tempY = 0;
    currentModalAddress = null;
    setPositionDict({});
  };

  // 부모 컴포넌트에서 사용할 함수 정의
  // Define functions accessible from the parent component
  useImperativeHandle(ref, () => ({
    init,
  }));

  /**
   * handleCheckboxChange 함수 / handleCheckboxChange Function
   *
   * 특정 항목(item)의 체크박스 상태를 변경 처리
   * Handles the checkbox state change for a specific item
   *
   * @param {string} item - 체크박스 변경 대상 항목 (주소 또는 트랜잭션 ID)
   *                       The target item to be changed (address or transaction ID)
   * @param {boolean} isDisList - 현재 항목이 disList에 포함되어 있는지 여부
   *                              Whether the item is part of the displayed list (disList)
   *
   * @returns {void} - 반환값 없음 / No return value
   *
   * 설명:
   * - `isDisList`가 true이면 disList에서 제거 후 undisList로 이동
   *   If `isDisList` is true, removes the item from disList and adds it to undisList.
   * - 반대로, false이면 undisList에서 disList로 이동
   *   Conversely, if false, moves the item from undisList to disList.
   *
   * 개선 방안 / Improvement Suggestions:
   * 1. 상태 변경 로직을 유틸리티 함수로 분리하여 중복 제거
   *    Extract state update logic into utility functions to remove redundancy.
   * 2. 상태 관리 라이브러리 (예: Zustand 또는 Redux)를 도입하여 전역 상태로 관리
   *    Introduce a state management library (e.g., Zustand or Redux) to handle global states.
   */
  const handleCheckboxChange = async (item, tx, isDisList) => {
    if (isDisList) {
      // disList에서 아이템 제거 / Remove item from disList
      const updatedDisList = renderedTransaction.filter(
        (disItem) => disItem !== item
      );
      const updatedUndisList = [...unrenderedTransaction, item];
      const foundNode = flowNodeList.find((node) => node.id === item);

      let allPositionDict = positionDict;
      const returnData = deleteNode(foundNode, flowNodeList, allPositionDict); // 노드 삭제
      setFlowNodeList(returnData.flowNodeList);
      setPositionDict(allPositionDict);
      currentModalAddress.data.childNodes =
        currentModalAddress.data.childNodes.filter(
          (disItem) => disItem !== item
        );
      setRenderedTransaction([...new Set(updatedDisList)]);
      setUnrenderedTransaction([...new Set(updatedUndisList)]);
    } else {
      // undisList에서 아이템 추가 / Add item from undisList
      const updatedUndisList = unrenderedTransaction.filter(
        (undisItem) => undisItem !== item
      );
      const updatedDisList = [...renderedTransaction, item];
      const foundNode = flowNodeList.find((node) => node.id === item);
      if (foundNode === undefined) {
        if (mainNet === "BTC") {
          const returnData = await addNode(
            item,
            currentModalAddress,
            tempY,
            positionDict,
            mainNet,
            flowNodeList,
            flowEdgeList,
            "Transaction"
          ); // 트랜잭션 노드 추가 / Add transaction node
          setFlowNodeList(returnData.flowNodeList);
          setFlowEdgeList(returnData.flowEdgeList);
          setPositionDict(returnData.allPositionDict);
        } else {
          const foundAddr = addressDictList.find(
            (addr) => addr.transaction.txHash === tx
          );
          if (foundNode === undefined) {
            const returnData = await addNode(
              foundAddr,
              currentModalAddress,
              tempY,
              positionDict,
              mainNet,
              flowNodeList,
              flowEdgeList,
              "Address"
            ); // 주소 노드 추가 / Add address node
            setFlowNodeList(returnData.flowNodeList);
            setFlowEdgeList(returnData.flowEdgeList);
            setPositionDict(returnData.allPositionDict);
          }
        }
      }
      setRenderedTransaction([...new Set(updatedDisList)]);
      setUnrenderedTransaction([...new Set(updatedUndisList)]);
    }
  };

  /**
   * 사용자가 입력한 주소를 기반으로 그래프 데이터를 검색하고 노드 및 엣지를 생성.
   * Searches for graph data based on the user's input address and generates nodes and edges.
   *
   * @param {string} searchAddress - 검색할 주소 (Address to search).
   * @param {string} mainNet - 메인 네트워크 (Main network, e.g., BTC, ETH).
   */
  async function searchAddressBtnClick(searchAddress, mainNet) {
    let newNodes = [];
    let newEdges = [];
    let newAddrNodesDict = {};
    let newNodesDict = {};
    let mainNode = {};
    let isData = false;
    // 초기 위치 데이터를 설정.
    // Initialize position data
    let allPositionDict = positionDict;
    allPositionDict[FLOW_MAP_DEFAULT_X] = new Set();
    allPositionDict[FLOW_MAP_DEFAULT_X].add(FLOW_MAP_DEFAULT_Y);

    // 검색 주소가 비어 있는 경우 팝업 알림을 표시.
    // Show a popup if the search address is empty
    if (searchAddress === "") {
      ComUtil.showPopUp("주소를 입력해주세요.");
    } else {
      if (mainNet === "BTC") {
        // 메인 네트워크가 BTC인 경우
        // If the main network is BTC
        // Search a graph
        await getGraphBTC(
          mainNet,
          searchAddress,
          count,
          startTime,
          endTime
        ).then((result) => {
          if (result) {
            isData = true;
            mainNode = result["mainAddress"];
            mainNode.position = {
              x: FLOW_MAP_DEFAULT_X,
              y: FLOW_MAP_DEFAULT_Y - 8,
            };

            // 트랜잭션 및 주소 노드의 위치를 계산
            // Calculate positions of transaction and address nodes
            let positionList = getPosition(
              result["txsNodes"],
              result["addrNodes"],
              FLOW_MAP_DEFAULT_X,
              FLOW_MAP_DEFAULT_Y,
              allPositionDict,
              flowNodeList
            );
            newNodesDict = positionList[0];
            newAddrNodesDict = positionList[1];
            setPositionDict(allPositionDict);
            newEdges = result["edges"];

            // 노드 딕셔너리를 배열로 변환
            // Convert node dictionaries into arrays
            for (let key in newNodesDict) {
              newNodes.push(newNodesDict[key]);
            }
            for (let key in newAddrNodesDict) {
              newNodes.push(newAddrNodesDict[key]);
            }
          }
        });
      } else {
        // 메인 네트워크가 BTC가 아닌 경우
        // If the main network is not BTC
        const result = await getGraphNotBTC(
          mainNet,
          flowNodeList,
          flowEdgeList,
          searchAddress,
          count,
          startTime,
          endTime
        );
        if (result) {
          isData = true;
          mainNode = result["mainAddress"];
          mainNode.position = {
            x: FLOW_MAP_DEFAULT_X,
            y: FLOW_MAP_DEFAULT_Y - 8,
          };
          newEdges = result["edges"];

          // 노드의 좌/우측 위치를 계산
          // Calculate left/right positions of nodes
          let positionList = getPositionNotBTC(
            mainNode,
            result["addrNodes"],
            FLOW_MAP_DEFAULT_X,
            FLOW_MAP_DEFAULT_Y
          );
          newAddrNodesDict = positionList[0];
          mainNode.left = positionList[1];
          mainNode.right = positionList[2];
          setPositionDict(positionList[3])
          // 노드 딕셔너리를 배열로 변환
          // Convert node dictionaries into arrays
          for (let key in newAddrNodesDict) {
            newNodes.push(newAddrNodesDict[key]);
          }
        }
      }

      // 데이터가 존재하면 노드와 엣지를 추가
      // If data exists, add nodes and edges
      if (isData) {
        newNodes.push(mainNode);
        const newData = { returnNode: newNodes, returnEdge: newEdges };
        setFlowNodeList(newData.returnNode);
        setFlowEdgeList(newData.returnEdge);
        setTrace(false);
      }
    }
  }

  useMemo(async () => {
    if (!trace) return;
    const newNodes = flowNodeList;
    const newData = await processDenyList(denyList, newNodes, mainNet);
    const tempNodes = [...flowNodeList];
    newData.returnNode.map((n) => {
      const index = flowNodeList.findIndex((x) => x.id === n.id);
      if (index === -1) {
        tempNodes.push(n);
      }
      return null;
    });
    setFlowNodeList(tempNodes);

    const tempEdges = [...flowNodeList];
    newData.returnEdge.map((n) => {
      const index = flowEdgeList.findIndex((x) => x.id === n.id);
      if (index === -1) {
        tempEdges.push(n);
      }
      return null;
    });
    setFlowNodeList(tempNodes);
    setFlowEdgeList(tempEdges);
    setTrace(false);
  }, [trace]);

  /**
   * 노드 변경 사항을 처리하고 상태를 업데이트.
   * Handles node changes and updates the state.
   */
  const onNodesChange = useCallback(
    (changes) => {
      setFlowNodeList((nds) => applyNodeChanges(changes, nds));
    },
    [setFlowNodeList]
  );

  /**
   * 엣지 변경 사항을 처리하고 상태를 업데이트.
   * Handles edge changes and updates the state.
   */
  const onEdgesChange = useCallback(
    (changes) => setFlowEdgeList((eds) => applyEdgeChanges(changes, eds)),
    [setFlowEdgeList]
  );

  /**
   * 노드 클릭 이벤트를 처리하는 함수. 클릭된 노드의 상태를 기반으로 적절한 작업을 수행.
   * Handles node click events and performs actions based on the clicked node's state.
   *
   * @param {Event} event - 클릭 이벤트 (Click event).
   * @param {Object} element - 클릭된 노드 객체 (Clicked node object).
   */
  const onClickNode = useCallback(
    async (event, element) => {
      // console.log("element: ", element, mainNet);
      currentModalAddress = element;
      setWbAddress(element.id);
      // 변경된 항목들을 추적하기 위해 초기화
      // 노드가 삭제 상태인지 확인
      // Check if the node is marked for deletion
      if (element.data.hasOwnProperty("isDeleteClicked")) {
        let allPositionDict = positionDict;
        const returnData = deleteNode(element, flowNodeList, allPositionDict); // 노드 삭제
        setFlowNodeList(returnData.flowNodeList);
        setPositionDict(allPositionDict);
        setFlowNodeList(returnData.flowNodeList);
      } else if (element.data?.isDetailClicked === true) {
        // 노드의 상세 정보를 조회
        // View details of the node
        setTransactionPage(0); // 페이지 초기화
        currentModalAddress = element; // 현재 모달 주소 설정
        tempY = element.positionAbsolute.y; // 노드의 절대 위치 저장
        if (element.type === "transactionNode") {
          setType(E_SLIDING_PANEL_TYPE.TX_TRANSFER);
          setClickNode(element.data.txId);
          // 트랜잭션 노드일 경우
          // displayedAddressList = [];
          const returnData = await getTransactionInfo(
            element.data.txId,
            flowNodeList,
            addressDictList,
            setTransactionPage
          ); // 트랜잭션 정보 가져오기
          // console.log("returnData: ", returnData);
          setRenderedAddress(returnData.displayedAddressList);
          setUnrenderedAddress(returnData.undisplayedAddressList);
          setAddressDictList(returnData.addressDictList);
          const temp = [];
          returnData.addressList.map((a) => {
            let t = a;
            t.checkbox = returnData.displayedAddressList.includes(
              a.address.addr
            );
            temp.push(t);
            return null;
          });
          setTempAddressList(temp);
          setTxData(currentModalAddress?.data);
        } else {
          setType(E_SLIDING_PANEL_TYPE.WB_TRANSFER);
          // 주소 노드일 경우
          // displayedTransactionList = [];
          setClickNode(element.data.address);
          const returnData = await getTransactionList(
            unrenderedTransaction,
            renderedTransaction,
            element.data.address,
            mainNet,
            addressDictList,
            flowNodeList,
            setTransactionPage,
            startTime,
            endTime
          ); // 트랜잭션 목록 가져오기
          setUnrenderedTransaction(returnData.undisplayedTransactionList);
          setRenderedTransaction(returnData.displayedTransactionList);
          setAddressDictList(returnData.addressDictList);
        }
        element.data.isDetailClicked = false; // 상세 클릭 상태 초기화
      } else if (element.data?.isClicked === true) {
        // 노드가 클릭 상태일 경우 확장 작업 수행
        // Expand node's data if it is clicked
        if (mainNet === "BTC") {
          let direction = element.data.isRight ? "RIGHT" : "LEFT"; // 방향 설정
          const page = element.data.clickNum; // 클릭 횟수
          // console.log(">>");
          // Click >> expand button
          let result = await getGraphBTC(
            mainNet,
            element.data.address,
            count,
            startTime,
            endTime,
            direction,
            page
          );
          // console.log("result: ", result);
          if (result) {
            // 결과 처리 및 노드 확장
            // Process result and expand node
            let mainNode = result["mainAddress"];
            let newNodesList = flowNodeList;
            const foundElement = newNodesList.find(
              (node) => node.id === element.id
            );

            if (foundElement) {
              // 노드 위치 및 자식 노드 업데이트
              // Update node position and child nodes
              foundElement.position = element.positionAbsolute;
              foundElement.data.childNodes = mainNode.data.childNodes;
            }
            // Calculate new node positions
            // 새로운 노드 위치 계산
            let allPositionDict = positionDict;
            let plusPositionResult = getPosition(
              result["txsNodes"],
              result["addrNodes"],
              element.positionAbsolute.x,
              element.positionAbsolute.y,
              allPositionDict,
              flowNodeList
            );

            const positionDictData = {
              ...plusPositionResult[0],
              ...plusPositionResult[1],
            };
            setPositionDict(allPositionDict);

            // Add new nodes to the list
            // 새 노드 리스트에 추가
            let newNodeId = foundElement.childNodes
              ? foundElement.childNodes
              : [];
            const nodeIdSet = flowNodeList.map((element) => element.id);

            for (let key in positionDictData) {
              if (!nodeIdSet.includes(key)) {
                newNodesList.push(positionDictData[key]);
                newNodeId.push(key);
              }
            }
            // Update node's child nodes
            // 노드 자식 노드 업데이트
            foundElement.childNodes = newNodeId;
            element.data.childNodes = newNodeId;

            // Add edges from API result
            // API 결과에서 엣지 추가
            setFlowNodeList(newNodesList);
            const edgeIdSet = flowEdgeList.map((element) => element.id);

            for (const edge of result["edges"]) {
              const edgeId = edge.id;
              if (!edgeIdSet.includes(edgeId)) {
                // flowEdgeList.push(edge);
                setFlowEdgeList((prev) => [...prev, edge]);
              }
            }
            element.data.isClicked = false;
          }
        } else {
          // Non-BTC 그래프 처리
          // Process Non-BTC graph
          let direction = "LEFT";
          if (element.data.isRight) {
            direction = "RIGHT";
          }
          const page = element.data.clickNum;
          let result = await getGraphNotBTC(
            mainNet,
            flowNodeList,
            flowEdgeList,
            element.data.address,
            count,
            startTime,
            endTime,
            direction,
            page
          );
          if (result) {
            let mainNode = result["mainAddress"];
            let newNodesList = flowNodeList;
            const foundElement = newNodesList.find(
              (node) => node.id === element.id
            );
            let yCorrection = 0;
            yCorrection = element.data.childNodes?.length
              ? element.data.childNodes?.length * FLOW_MAP_DEFAULT_Y_GAP
              : 0;
            if (foundElement) {
              foundElement.position = element.positionAbsolute;
              foundElement.data.childNodes = mainNode.data.childNodes;
            }
            let plusPositionResult = getPositionNotBTC(
              mainNode,
              result["addrNodes"],
              element.positionAbsolute.x,
              element.positionAbsolute.y + yCorrection,
              positionDict
            );
            foundElement.left = plusPositionResult[1];
            foundElement.right = plusPositionResult[2];
            const positionDict = plusPositionResult[0];
            setPositionDict(plusPositionResult[3])

            let changedNode = [];
            let newNodeId = foundElement.childNodes
              ? foundElement.childNodes
              : [];
            const nodeIdSet = flowNodeList.map((element) => element.id);

            for (let key in positionDict) {
              if (!nodeIdSet.includes(key)) {
                newNodesList.push(positionDict[key]);
                newNodeId.push(key);
                changedNode.push(positionDict[key]);
              }
            }

            foundElement.childNodes = newNodeId;
            element.data.childNodes = newNodeId;
            setFlowNodeList(newNodesList);

            for (const edge of result["edges"]) {
              setFlowEdgeList((prev) => [...prev, edge]);
            }
            element.data.isClicked = false;
          }
        }
      }
    },
    [isNewSearch, startTime, endTime, flowNodeList, positionDict]
  );

  /**
   * Callback function triggered when the user stops dragging a node.
   * 사용자가 노드 드래그를 중지했을 때 호출되는 콜백 함수.
   *
   * @param {Event} event - Drag event (드래그 이벤트).
   * @param {Object} element - The node being dragged (드래그 중인 노드).
   * @param {Array} nodes - All nodes in the current flow (현재 플로우의 모든 노드).
   */
  const onNodesDragStop = useCallback(
    async (event, element, nodes) => {
      if (!element.dragging) return;
      // Calculate the nearest valid coordinates for the node
      // 노드의 가장 가까운 유효 좌표를 계산.
      let xyFixedPosition = findClosestCoordinates(
        element.positionAbsolute.x,
        element.positionAbsolute.y
      );

      // Update the position of the dragged node in the state
      // 드래그된 노드의 위치를 상태에 업데이트.
      setFlowNodeList((nds) =>
        nds.map((node) => {
          // If the node matches the dragged node, update its position
          // 드래그된 노드와 일치하면 위치를 업데이트.
          if (node.id === element.id) {
            node.position = xyFixedPosition;
            node.positionAbsolute = xyFixedPosition;
          }

          return node;
        })
      );

      // Update the flowNodeList with the new position of the dragged node
      // flowNodeList를 드래그된 노드의 새 위치로 업데이트.
      let newNodesList = flowNodeList;
      const foundElement = newNodesList.find((node) => node.id === element.id);
      if (foundElement) {
        foundElement.position = xyFixedPosition;
      }

      // Ensure allPositionDict has an entry for the x-coordinate of the dragged node
      // 드래그된 노드의 x좌표에 대해 allPositionDict가 항목을 가지도록 보장.
      let allPositionDict = positionDict;
      if (allPositionDict[xyFixedPosition.x] === undefined) {
        allPositionDict[xyFixedPosition.x] = new Set();
      }
      if (allPositionDict[xyFixedPosition.x] instanceof Set) {
        // Adjust y-coordinate for special node types
        // 특정 노드 유형에 대해 y좌표를 조정
        if (
          element.type === "mainWhiteNode" ||
          element.type === "mainBlackNode" ||
          element.type === "mainNode"
        ) {
          xyFixedPosition.y -= 8;
        }
        allPositionDict[xyFixedPosition.x].add(xyFixedPosition.y);
      }
      setPositionDict(allPositionDict);
    },
    [positionDict]
  );

  /**
   * Callback function triggered when the user starts dragging a node.
   * 사용자가 노드 드래그를 시작했을 때 호출되는 콜백 함수.
   *
   * @param {Event} event - Drag event (드래그 이벤트).
   * @param {Object} element - The node being dragged (드래그 중인 노드).
   * @param {Array} nodes - All nodes in the current flow (현재 플로우의 모든 노드).
   */
  const onNodesDragStart = useCallback(
    async (event, element, nodes) => {
      // Extract the x and y coordinates of the node being dragged
      // 드래그 중인 노드의 x 및 y 좌표를 추출.
      if (!element.dragging) return;
      const xPosition = element.positionAbsolute.x;
      const yPosition = element.positionAbsolute.y;

      // Remove the y-coordinate from the corresponding x-coordinate entry in allPositionDict
      // allPositionDict에서 해당 x좌표 항목에서 y좌표를 제거.
      let allPositionDict = positionDict;
      if (allPositionDict[xPosition] instanceof Set) {
        allPositionDict[xPosition].delete(yPosition);
        setPositionDict(allPositionDict);
      }
    },
    [positionDict]
  );

  const onCloseModal = () => {
    // Resets the modal state when closed
    setUnrenderedTransaction([]); // Clear undisplayed transactions
    setRenderedTransaction([]); // Clear displayed transactions
    setUnrenderedAddress([]); // Clear undisplayed addresses
    setRenderedAddress([]); // Clear displayed addresses
    setAddressDictList([]); // Reset the address dictionary
    tempY = 0; // Reset the Y-coordinate position
  };

  useMemo(() => {
    setPageNum(0)
    if (isCloseContext) {
      onCloseModal();
      setIsCloseContext(false);
      initDetailContext();
    }
  }, [isCloseContext]);

  const getTransactionListLocal = async (id, start, end, limit, isAppend) => {
    let l = 100;
    let pageNumber;
    if(start === prevStart && end === prevEnd && max === prevMax) {
      setPageNum(pageNum + 1);
      pageNumber = pageNum + 1;
    }else{
      setPage(0);
      pageNumber = 0
    }
    setPrevEnd(end)
    setPrevStart(start)
    setPrevMax(max)
    if (!start && !end) {
      l = 100;
    }
    if (limit) {
      l = limit;
    }
    const returnData = await getTransactionList(
      unrenderedTransaction,
      renderedTransaction,
      id,
      mainNet,
      addressDictList,
      flowNodeList,
      setTransactionPage,
      start,
      end,
      pageNumber,
      l,
      isAppend
    );
    setUnrenderedTransaction(returnData.undisplayedTransactionList);
    setRenderedTransaction(returnData.displayedTransactionList);
    setAddressDictList(returnData.addressDictList);
  };

  React.useMemo(() => {
    if (onQueryExecution) {
      getTransactionListLocal(
        clickNode,
        startTimeModal,
        endTimeModal,
        max,
        true
      );
      setOnQueryExecution(false);
    }
  }, [onQueryExecution]);

  React.useMemo(() => {
    if (transactionRetrieval) {
      getTransactionListLocal(
        clickNode,
        startTimeModal,
        endTimeModal,
        max,
        true
      );
      setTransactionRetrieval(false);
    }
  }, [transactionRetrieval]);

  React.useMemo(() => {
    if (isConfirm) {
      waitingList.map(async (l, idx) => {
        handleCheckboxChange(l.address, l.transaction, l.isRemove);
        if (isWallet) {
          const returnData = await getTransactionList(
            unrenderedTransaction,
            renderedTransaction,
            l.address,
            mainNet,
            addressDictList,
            flowNodeList,
            setTransactionPage,
            startTime,
            endTime,
            transactionPage
          );
          setAddressDictList(returnData.addressDictList);
          setUnrenderedTransaction(returnData.undisplayedTransactionList);
          setRenderedTransaction(returnData.displayedTransactionList);
        } else {
          const returnData = await getTransactionInfo(
            clickNode,
            flowNodeList,
            addressDictList,
            setTransactionPage
          );
          // console.log("returnData: ", returnData);
          setRenderedAddress(returnData.displayedAddressList);
          setUnrenderedAddress(returnData.undisplayedAddressList);
          setAddressDictList(returnData.addressDictList);
        }
        return null;
      });
      setIsConfirm(false);
      setIsCloseContext(true);
    }
  }, [isConfirm]);

  const onPaneClick = () => {
    setWbAddress(walletAddress);
    setType(E_SLIDING_PANEL_TYPE.WB_DETAIL);
  };

  const onEdgeClick = useCallback(async (event, element) => {
    console.log("onEdgeClick element: ", element);
  }, []);

  return (
    <>
      <div className="flex flex-1">
        <ReactFlow
          ref={flowRef}
          nodes={flowNodeList}
          edges={flowEdgeList}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          proOptions={{ hideAttribution: true }}
          onNodeClick={onClickNode}
          onNodeDragStop={onNodesDragStop}
          onNodeDragStart={onNodesDragStart}
          onPaneClick={onPaneClick}
        >
          {page === "pdf" && <></>}
          {page === "transactionMap" && (
            <>
              <MiniMap zoomable pannable />
            </>
          )}
          {page === "walletAddress" && (
            <>
              <Controls
                style={{ position: "absolute", bottom: 80, left: 100 }}
                position="bottom-center"
                showInteractive={false}
              />
              <MiniMap
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: "calc( -100vw + 285px)",
                }}
                zoomable
                pannable
              />
            </>
          )}
        </ReactFlow>
      </div>
    </>
  );
});

export default TransactionFlowMap;
