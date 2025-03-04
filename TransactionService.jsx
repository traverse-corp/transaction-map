/* eslint-disable array-callback-return */
/* eslint-disable import/no-anonymous-default-export */
import ApiService from "./ApiService";
import GraphApiService from "./ApiService";
import ComUtil from "./ComUtil";
import { MarkerType } from "reactflow";
import {
  FLOW_MAP_DEFAULT_X,
  FLOW_MAP_DEFAULT_X_GAP,
  FLOW_MAP_DEFAULT_X_GAP_NOT_BTC,
  FLOW_MAP_DEFAULT_Y,
  FLOW_MAP_DEFAULT_Y_GAP,
} from "./Constant";

export function calAddressValueList(addressList) {
  const result = {}; // 결과를 저장할 객체 / Object to store results
  addressList.forEach((entry) => {
    const addr = entry.address.addr;
    const direction = entry.relationType; // 전송 방향 (IN/OUT) / Transaction direction (IN/OUT)
    const value = entry.relationValue;
    if (!result[addr]) {
      result[addr] = 0;
    }
    if (direction === "OUT") {
      result[addr] += value; // OUT일 경우 값을 증가 / Increment value for OUT
    } else {
      result[addr] -= value; // IN일 경우 값을 감소 / Decrement value for IN
    }
  });

  return result; // 계산된 결과 반환 / Return the calculated results
}

/**
 * getGraphBTC
 * BTC 주소 기반으로 트랜잭션 그래프를 생성하는 함수
 * Generates a transaction graph based on a BTC address
 *
 * @param {number} net - Currently selected mainnet (e.g., BTC, ETH, USDT)
 *                        선택된 메인넷 (BTC, ETH 등)
 * @param {number} nodeIdSet - Set to prevent duplicate node IDs
 *                        중복된 노드를 방지하기 위한 노드 ID 집합
 * @param {string} address - BTC 주소
 *                         BTC address
 * @param {string} direction - 방향 (LEFT, RIGHT, ALL) 기본값: 'ALL'
 *                            Direction (LEFT, RIGHT, ALL) default: 'ALL'
 * @param {number} page - 페이징 처리에 사용될 페이지 번호 (기본값: 0)
 *                       Page number for pagination (default: 0)
 * @return {Object} - 생성된 그래프의 노드와 엣지 데이터
 *                  Graph data containing nodes and edges
 */
export async function getGraphBTC(
  net,
  address,
  count,
  startTime,
  endTime,
  direction = "ALL",
  page = 0
) {
  // 초기화
  // Initialize
  let params = {
    address: address,
    offset: page * 50,
    limit: 50,
    count: count,
    start: startTime,
    end: endTime,
    direction: direction,
  };
  let mainAddress = {
    id: address,
    data: { address: address, mainNet: net },
  };
  let edges = [];
  let txDict = {};
  let addrDict = {};

  const params1 = { address: address };
  let coin = net.toLowerCase();

  // 화이트리스트/블랙리스트 여부 확인
  // Check if the address is whitelisted/blacklisted
  const addressInfo = await GraphApiService.sendPostToGraph(
    coin + "/address",
    params1
  );
  if (addressInfo?.data?.adrsData?.whitelistYn) {
    mainAddress.type = "mainWhiteNode";
  } else if (addressInfo?.data?.adrsData?.blacklistYn) {
    mainAddress.type = "mainBlackNode";
  } else {
    mainAddress.type = "mainNode";
  }

  // 트랜잭션 맵 데이터 가져오기
  // Fetch transaction map data
  const transactionMapResponse = await GraphApiService.sendPostToGraph(
    "btc/transaction-map",
    params
  );
  if (!transactionMapResponse || !transactionMapResponse.data) {
    // 조건에 맞는 트랜잭션이 없을 경우 팝업 메시지 표시 / Show a popup message if no transactions match the criteria
    const message =
      page > 0
        ? "추가 노드가 존재하지 않습니다."
        : "조건에 해당하는 트랜잭션이 없습니다.";
    ComUtil.showPopUp(message);
    return false;
  }
  // 트랜잭션이 존재하는 경우 데이터 처리
  // Process data if transactions exist
  if (transactionMapResponse?.data?.transactionList?.length > 0) {
    let txList = [];
    transactionMapResponse.data.transactionList.map((val, idx) => {
      let r = {};
      let txDirection = true;
      const txId = val.transaction.txId;
      const txValue = val.transaction.value;
      const txTimestamp = val.transaction.timestamp;

      // 우측일시 엣지 및 노드 처리 / Processing edges and nodes when right
      if (val.motherValue > 0 && direction !== "LEFT") {
        const receiveAddress = val.address.addr;
        r = {
          id: `${address}-${txId}-${idx}`,
          source: address,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          target: txId,
          data: {
            value: Math.abs(val.motherValue),
            time: txTimestamp,
            token: net,
          },
          type: "timeValueEdge",
        };
        txDirection = true;
        edges.push(r);

        let addrType = "addressNode";
        if (val.address.blacklistYn === "Y") {
          addrType = "blacklistNode";
        }
        if (val.address.whitelistYn === "Y") {
          addrType = "whitelistNode";
        }
        addrDict[receiveAddress] = {
          id: receiveAddress,
          type: addrType,
          data: {
            address: receiveAddress,
            isRight: txDirection,
            motherNode: txId,
            mainNet: net,
          },
        };
        let rel = {
          id: `${txId}-${receiveAddress}-${idx}`,
          source: txId,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          target: receiveAddress,
          data: {
            value: Math.abs(val.childValue),
            time: txTimestamp,
            token: net,
          },
          type: "timeValueEdge",
        };
        edges.push(rel);
        if (!txList.includes(txId)) {
          txDict[txId] = {
            id: txId,
            type: "transactionNode",
            data: {
              txId: txId,
              isRight: txDirection,
              block: val.transaction.block,
              value: txValue,
              time: txTimestamp,
              childNodes: [receiveAddress],
              motherNode: address,
            },
          };
          txList.push(txId);
        } else {
          if (!txDict[txId]?.data?.childNodes?.includes(receiveAddress)) {
            txDict[txId].data.childNodes.push(receiveAddress);
          }
        }
      }
      // 우측일때 처리 / Processing on the right side
      if (val.motherValue < 0 && direction !== "RIGHT") {
        const sendAddress = val.address.addr;
        r = {
          id: `${txId}-${address}-${idx}`,
          source: txId,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          target: address,
          data: {
            value: Math.abs(val.motherValue),
            time: txTimestamp,
            token: net,
          },
          type: "timeValueEdge",
        };
        txDirection = false;
        edges.push(r);

        let addrType = "addressNode";
        if (val.address.blacklistYn === "Y") {
          addrType = "blacklistNode";
        }
        if (val.address.whitelistYn === "Y") {
          addrType = "whitelistNode";
        }
        addrDict[sendAddress] = {
          id: sendAddress,
          type: addrType,
          data: {
            address: sendAddress,
            isRight: txDirection,
            motherNode: txId,
            mainNet: net,
          },
        };

        let rel = {
          id: `${sendAddress}-${txId}-${idx}`,
          source: sendAddress,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          target: txId,
          data: {
            value: Math.abs(val.childValue),
            time: txTimestamp,
            token: net,
          },
          type: "timeValueEdge",
        };
        edges.push(rel);
        if (!txList.includes(txId)) {
          txDict[txId] = {
            id: txId,
            type: "transactionNode",
            data: {
              txId: txId,
              isRight: txDirection,
              block: val.transaction.block,
              value: txValue,
              time: txTimestamp,
              childNodes: [sendAddress],
              motherNode: address,
            },
          };
          txList.push(txId);
        } else {
          if (!txDict[txId]?.data?.childNodes?.includes(sendAddress)) {
            txDict[txId].data.childNodes.push(sendAddress);
          }
        }
      }
    });
    txList = [...new Set(txList)];
    mainAddress.data.childNodes = txList;
  }
  return {
    mainAddress: mainAddress,
    txsNodes: txDict,
    addrNodes: addrDict,
    edges: edges,
  };
}

/**
 * getNodePosition
 * 부모 노드의 위치와 방향을 기반으로 새로운 노드의 위치를 계산하는 함수
 * Calculates the position of a new node based on the parent node's position and direction
 *
 * @param {number} defaultXGap
 * @param {number} defaultYGap
 * @param {number} defaultYGap - Tracks all node positions (x, y) to avoid overlaps
 *                                모든 노드의 위치(x, y)를 관리
 * @param {Object} motherPosition - 부모 노드의 위치 (x, y)
 *                                 Parent node's position (x, y)
 * @param {number} direction - 방향 (1 또는 -1)
 *                            Direction (1 for right, -1 for left)
 * @return {Object} - 새로운 노드의 위치 (x, y)
 *                  New node's position (x, y)
 */
function getNodePosition(allPositionDict, motherPosition, direction) {
  // 방향에 따라 새로운 x 위치 계산
  // Calculate the new x position based on direction
  let xPosition = motherPosition.x + direction * FLOW_MAP_DEFAULT_X_GAP;

  // 새로운 y 위치 초기화
  // Initialize the new y position
  let yPosition = motherPosition.y;
  // x 위치에 겹치는 노드가 있는 경우 y 값을 조정
  // Adjust the y value if there are overlapping nodes at the x position
  if (allPositionDict[xPosition]) {
    while (allPositionDict[xPosition].has(yPosition)) {
      yPosition += FLOW_MAP_DEFAULT_Y_GAP;
    }
    allPositionDict[xPosition].add(yPosition);
  } else {
    allPositionDict[xPosition] = new Set();
    allPositionDict[xPosition].add(yPosition);
  }
  return { x: xPosition, y: yPosition };
}

/**
 * getGraphNotBTC
 * 비트코인이 아닌 다른 코인들에 대해 트랜잭션 그래프를 생성하는 함수
 * Generates a transaction graph for non-BTC cryptocurrencies
 *
 * @param {number} net - Currently selected mainnet (e.g., BTC, ETH, USDT)
 *                        선택된 메인넷 (BTC, ETH 등)
 * @param {number} nodeIdSet - Set to prevent duplicate node IDs
 *                        중복된 노드를 방지하기 위한 노드 ID 집합
 * @param {number} edgeIdSet - Set to prevent duplicate edge IDs
 *                        중복된 엣지를 방지하기 위한 엣지 ID 집합
 * @param {string} address - 암호화폐 주소
 *                         Cryptocurrency address
 * @param {string} direction - 방향 (LEFT, RIGHT, ALL) 기본값: 'ALL'
 *                            Direction (LEFT, RIGHT, ALL) default: 'ALL'
 * @param {number} page - 페이징 처리에 사용될 페이지 번호 (기본값: 0)
 *                       Page number for pagination (default: 0)
 * @return {Object} - 생성된 그래프의 노드와 엣지 데이터
 *                  Graph data containing nodes and edges
 */
export async function getGraphNotBTC(
  mainNet,
  flowNodeList,
  flowEdgeList,
  address,
  count,
  startTime,
  endTime,
  direction = "ALL",
  page = 0
) {
  let edgeIdSetTemp = flowEdgeList.map((element) => element.id);
  let nodeIdSet = flowNodeList.map((element) => element.id);
  // 비트 외 코인들 처리 (트랜잭션 관계가 one to one 구조) / Processing of non-bit coins (transaction relationship is one to one structure)
  // 코인 네트워크 별로 속성에 대해 처리 필요 / Need to process properties per coin network
  let params = {
    address: address,
    offset: page * 50,
    limit: 50,
    count: count,
    start: startTime,
    end: endTime,
    direction: direction,
  };
  let mainAddress = {
    id: address,
    data: { address: address, mainNet: mainNet },
  };
  let edges = [];
  let addrDict = {};

  const params1 = { address: address };
  let coin = mainNet.toLowerCase();

  if (coin === "usdt") {
    coin = "eth";
  }
  if (coin === "erc") {
    coin = "eth";
  }
  const addressInfo = await GraphApiService.sendPostToGraph(
    coin + "/address",
    params1
  );
  if (addressInfo?.data?.adrsData?.whitelistYn) {
    mainAddress.type = "mainWhiteNode";
  } else if (addressInfo?.data?.adrsData?.blacklistYn) {
    mainAddress.type = "mainBlackNode";
  } else {
    mainAddress.type = "mainNode";
  }

  let endpoint = "";
  if (mainNet === "ETH") {
    endpoint = "eth/map";
  } else if (mainNet === "erc") {
    endpoint = "eth/map/internal";
    params.tokenId = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  } else if (mainNet === "TRX") {
    endpoint = "trx/map";
  } else if (mainNet === "XRP") {
    endpoint = "xrp/map";
  } else {
    return false;
  }
  const transactionMapResponse = await GraphApiService.sendPostToGraph(
    endpoint,
    params
  );
  if (
    transactionMapResponse.status === 200 &&
    transactionMapResponse.data &&
    transactionMapResponse.data.addressList &&
    transactionMapResponse.data.addressList.length === 0
  ) {
    if(direction === "ALL"){
      const message =
        page > 0
          ? "추가 노드가 존재하지 않습니다."
          : "조건에 해당하는 트랜잭션이 없습니다.";
      ComUtil.showPopUp(message);
    }
    return false;
  } else if (
    transactionMapResponse.status === 200 &&
    transactionMapResponse.data &&
    transactionMapResponse.data.addressList &&
    transactionMapResponse.data.addressList.length > 0
  ) {
    let adList = [];
    for (let val of transactionMapResponse.data.addressList) {
      let r = {};
      let txDirection = val.relationType === "OUT";
      const addressId = val.address.addr;
      let addrType = "addressNode";
      const isWhiteList = val.address.whitelistYn;
      const isBlacklist = val.address.blacklistYn;
      if (isBlacklist === "Y") {
        addrType = "blacklistNode";
      }
      if (isWhiteList === "Y") {
        addrType = "whitelistNode";
      }

      let txValue = 0;
      let txBlock = 0;
      let txTime = 0;
      let txId = "";
      let tkId = "";
      let logIndex = "";
      let internal = false;
      let curruncy = "";
      let dt = 0;
      let data = {};
      if (mainNet === "ETH") {
        txDirection = val.relationType === "OUT";
        txValue = val?.transaction?.value;
        txBlock = val?.transaction?.block;
        txTime = val?.transaction?.timestamp;
        txId = val?.transaction?.txHash;
        data = {
          value: txValue,
          block: txBlock,
          time: txTime,
          txHash: txId,
          token: mainNet,
        };
      }
      if (mainNet === "erc") {
        txDirection = val.relationType === "OUT";
        txValue = val?.value;
        txBlock = val?.transaction?.block;
        txTime = val?.transaction?.timestamp;
        txId = val?.transaction?.txHash;
        tkId = val?.tokenId;
        logIndex = val?.logIndex;
        internal = true;
        data = {
          value: txValue,
          block: txBlock,
          time: txTime,
          txHash: txId,
          txId: tkId,
          logIndex: logIndex,
          internal: internal,
          token: mainNet,
        };
      }
      if (mainNet === "TRX") {
        txValue = val?.transaction?.value;
        txBlock = val?.transaction?.block;
        txId = val?.transaction?.txHash;
        txTime = val?.transaction?.timestamp;
        data = {
          value: txValue,
          block: txBlock,
          txHash: txId,
          time: txTime,
          token: mainNet,
        };
      }
      if (mainNet === "XRP") {
        txValue = val?.value;
        txBlock = val?.transaction?.block;
        curruncy = val?.transaction?.curruncy;
        txTime = val?.transaction?.timestamp;
        dt = val?.transaction?.dt;
        txId = txDirection
          ? address + "-" + addressId
          : addressId + "-" + address;
        data = {
          value: txValue,
          block: txBlock,
          curruncy: curruncy,
          dt: dt,
          txHash: txId,
          time: txTime,
          token: mainNet,
        };
      }

      if (
        !address.hasOwnProperty("motherNode") ||
        (address.hasOwnProperty("motherNode") &&
          addressId !== address.motherNode)
      ) {
        if (txDirection && direction !== "LEFT") {
          r = {
            id: txId,
            source: address,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
            target: addressId,
            data: data,
            type: "timeValueEdge",
          };
        } else if (!txDirection && direction !== "RIGHT") {
          r = {
            id: txId,
            source: addressId,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
            target: address,
            data: data,
            type: "timeValueEdge",
          };
        }
        if (mainNet === "erc") {
          if (txDirection && direction !== "LEFT") {
            r = {
              id: address + "-" + addressId,
              source: address,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
              },
              target: addressId,
              data: data,
              type: "timeValueEdge",
            };
          } else if (!txDirection && direction !== "RIGHT") {
            r = {
              id: addressId + "-" + address,
              source: addressId,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
              },
              target: address,
              data: data,
              type: "timeValueEdge",
            };
          }
        }
      }
      if (
        (txDirection && direction !== "LEFT") ||
        (!txDirection && direction !== "RIGHT")
      ) {
        if (addressId !== address) {
          const foundRel = edges.find((element) => element.id === r.id);
          // if (foundRel === undefined) {
          //   edges.push(r);
          // }

          if (
            !edgeIdSetTemp.includes(r.source + "-" + r.target) &&
            foundRel === undefined
          ) {
            edges.push(r);
          }
          if (!nodeIdSet.includes(addressId)) {
            adList.push(addressId);
            addrDict[addressId] = {
              id: addressId,
              type: addrType,

              data: {
                address: addressId,
                isRight: txDirection,
                motherNode: address,
                mainNet: mainNet,
              },
            };
          }
        }
      }
    }
    mainAddress.data.childNodes = [...new Set(adList)];
  }
  return {
    mainAddress: mainAddress,
    addrNodes: addrDict,
    edges: edges,
  };
}

/**
 * 주어진 배열에서 비어 있는 가장 작은 양의 정수를 찾는 함수
 * Finds the smallest missing positive integer in the given array.
 *
 * @param {Array} arr - 숫자의 배열 (Array of numbers).
 * @returns {number} - 비어 있는 가장 작은 양의 정수 (Smallest missing positive integer).
 */
function findMissingPositive(arr) {
  arr.sort((a, b) => a - b); // 배열을 오름차순으로 정렬
  let missingPositive = 0; // 찾고자 하는 양의 정수 초기화

  // 배열을 순회하며 비어 있는 정수를 찾음
  // Iterate through the array to find the missing positive integer
  for (let i = 0; i < arr.length; i++) {
    if (parseInt(arr[i]) === missingPositive) {
      missingPositive++;
    } else if (parseInt(arr[i]) > missingPositive) {
      break;
    }
  }
  // 비어 있는 가장 작은 정수를 반환
  // Return the smallest missing positive integer
  return missingPositive;
}

/**
 * 주어진 addrNodes에 대해 각 노드의 위치를 계산하고, mainNode의 좌측과 우측 노드를 정렬하여 반환.
 * Calculates the positions of nodes in addrNodes and organizes them into left and right sides of mainNode.
 *
 * @param {Object} mainNode - 메인 노드 정보 (Main node information).
 * @param {Object} addrNodes - 주소 노드 객체 (Address node object).
 * @param {number} x - X축의 기본 좌표 (Default X coordinate).
 * @param {number} y - Y축의 기본 좌표 (Default Y coordinate).
 * @param {Object} allPositionDict
 * @returns {Array} - [addrNodes, left, right] 형태로 반환 (Returns in the form of [addrNodes, left, right]).
 */
export const getPositionNotBTC = (
  mainNode,
  addrNodes,
  x,
  y,
  allPositionDict
) => {
  let left = {}; // 좌측 노드를 저장할 객체
  let right = {}; // 우측 노드를 저장할 객체
  let addrValues = Object.values(addrNodes); // addrNodes 객체의 값을 배열로 변환

  // mainNode의 left와 right 속성이 존재하는지 확인하고 초기화
  // Initialize left and right properties if they exist in mainNode
  if (mainNode.hasOwnProperty("left")) {
    left = mainNode.left;
  }
  if (mainNode.hasOwnProperty("right")) {
    right = mainNode.right;
  }

  // addrNodes에 포함된 모든 노드의 위치를 계산
  // Calculate positions for all nodes in addrNodes
  for (let i = 0; i < addrValues.length; i++) {
    const node = addrValues[i];

    // 노드가 우측(right)에 배치될 경우
    // If the node is placed on the right side
    if (node.data.isRight) {
      const keys = Object.keys(right);
      const smallestInteger = keys.length > 0 ? findMissingPositive(keys) : 0;
      const yGap =
        smallestInteger % 2 === 0
          ? (smallestInteger / 2) * FLOW_MAP_DEFAULT_Y_GAP
          : ((1 + smallestInteger) / -2) * FLOW_MAP_DEFAULT_Y_GAP;
      const newInt = smallestInteger;
      right[newInt] = node.id;
      let initY = y
      if (allPositionDict[x + FLOW_MAP_DEFAULT_X_GAP_NOT_BTC]) {
        if (allPositionDict[x + FLOW_MAP_DEFAULT_X_GAP_NOT_BTC].has(y)) {
          const maxInSet = Math.max(...allPositionDict[x + FLOW_MAP_DEFAULT_X_GAP_NOT_BTC]);
          initY = maxInSet + FLOW_MAP_DEFAULT_Y_GAP;
        }
      }

      if (!allPositionDict[x + FLOW_MAP_DEFAULT_X_GAP_NOT_BTC]) {
        allPositionDict[x + FLOW_MAP_DEFAULT_X_GAP_NOT_BTC] = new Set();
      }

      if (allPositionDict[x + FLOW_MAP_DEFAULT_X_GAP_NOT_BTC] instanceof Set) {
        while (allPositionDict[x + FLOW_MAP_DEFAULT_X_GAP_NOT_BTC].has(initY)) {
          initY += FLOW_MAP_DEFAULT_Y_GAP;
        }
      }
      allPositionDict[x + FLOW_MAP_DEFAULT_X_GAP_NOT_BTC].add(initY);

      addrNodes[node.id]["position"] = {
        x: x + FLOW_MAP_DEFAULT_X_GAP_NOT_BTC,
        y: y + yGap,
      };
    } else {
      // 노드가 좌측(left)에 배치될 경우
      // If the node is placed on the left side
      const keys = Object.keys(left);
      const smallestInteger = keys.length > 0 ? findMissingPositive(keys) : 0;
      const yGap =
        smallestInteger % 2 === 0
          ? (smallestInteger / 2) * FLOW_MAP_DEFAULT_Y_GAP
          : ((1 + smallestInteger) / 2) * -FLOW_MAP_DEFAULT_Y_GAP;
      const newInt = smallestInteger;
      left[newInt] = node.id;

      let initY = y
      if (allPositionDict[x - FLOW_MAP_DEFAULT_X_GAP_NOT_BTC]) {
        if (allPositionDict[x - FLOW_MAP_DEFAULT_X_GAP_NOT_BTC].has(y)) {
          const maxInSet = Math.max(...allPositionDict[x - FLOW_MAP_DEFAULT_X_GAP_NOT_BTC]);
          initY = maxInSet + defaultYGap;
        }
      }

      if (!allPositionDict[x - FLOW_MAP_DEFAULT_X_GAP_NOT_BTC]) {
        allPositionDict[x - FLOW_MAP_DEFAULT_X_GAP_NOT_BTC] = new Set();
      }

      if (allPositionDict[x - FLOW_MAP_DEFAULT_X_GAP_NOT_BTC] instanceof Set) {
        while (allPositionDict[x - FLOW_MAP_DEFAULT_X_GAP_NOT_BTC].has(initY)) {
          initY += FLOW_MAP_DEFAULT_Y_GAP;
        }
      }
      allPositionDict[x - FLOW_MAP_DEFAULT_X_GAP_NOT_BTC].add(initY);
      addrNodes[node.id]["position"] = {
        x: x - FLOW_MAP_DEFAULT_X_GAP_NOT_BTC,
        y: y + yGap,
      };
    }
  }
  // 노드가 좌측(left)에 배치될 경우
  // If the node is placed on the left side
  return [addrNodes, left, right, allPositionDict];
};

/**
 * Find the closest valid coordinates based on the default grid spacing.
 * 기본 그리드 간격에 따라 가장 가까운 유효 좌표를 찾음.
 *
 * @param {number} x - Current x-coordinate of the node.
 * @param {number} y - Current y-coordinate of the node.
 * @returns {Object} Closest valid coordinates with x and y.
 */
export function findClosestCoordinates(
  x,
  y,
) {
  const closestX = Math.round(x / FLOW_MAP_DEFAULT_X_GAP) * FLOW_MAP_DEFAULT_X_GAP + FLOW_MAP_DEFAULT_X; // Snap x to nearest grid.
  const closestY = Math.round(y / FLOW_MAP_DEFAULT_Y_GAP) * FLOW_MAP_DEFAULT_Y_GAP + FLOW_MAP_DEFAULT_Y; // Snap y to nearest grid.
  return { x: closestX, y: closestY }; // Return the adjusted coordinates.
}

export const getPosition = (
  txsNodes,
  addrNodes,
  xInput,
  yInput,
  allPositionDict,
  flowNodeList
) => {
  // 노드의 위치를 저장할 딕셔너리 초기화
  // Initialize a dictionary to store node positions
  let positionDict = {};
  const nodeIdSet = flowNodeList.map((element) => element.id);

  // 기본 x, y 좌표 설정 (NaN인 경우 대체값 사용)
  // Set default x and y coordinates (use fallback values if NaN)
  const x = isNaN(xInput) ? 750 : xInput;
  const y = isNaN(yInput) ? 200 : yInput;
  positionDict[x + FLOW_MAP_DEFAULT_X_GAP] = { main: [] };
  positionDict[x + 2 * FLOW_MAP_DEFAULT_X_GAP] = {};
  positionDict[x - FLOW_MAP_DEFAULT_X_GAP] = { main: [] };
  positionDict[x - 2 * FLOW_MAP_DEFAULT_X_GAP] = {};

  // 트랜잭션 노드의 위치 계산 대상 선정
  // Select the target for calculating the location of the transaction node
  let nodeValues = Object.values(txsNodes);
  let addrValues = Object.values(addrNodes);
  for (let i = 0; i < nodeValues.length; i++) {
    const node = nodeValues[i];

    // 오른쪽 방향 노드
    // Right-direction nodes
    if (node.data.isRight) {
      positionDict[x + FLOW_MAP_DEFAULT_X_GAP].main.push(node.id);
      positionDict[x + FLOW_MAP_DEFAULT_X_GAP * 2][node.id] = [];
    } else {
      // 왼쪽 방향 노드
      // Left-direction nodes
      positionDict[x - FLOW_MAP_DEFAULT_X_GAP].main.push(node.id);
      positionDict[x - FLOW_MAP_DEFAULT_X_GAP * 2][node.id] = [];
    }
  }

  // 주소 노드의 위치 계산 대상 선정
  // Select the target for calculating the location of the address node
  for (let i = 0; i < addrValues.length; i++) {
    const node = addrValues[i];
    // 변경
    if (
      positionDict[x + FLOW_MAP_DEFAULT_X_GAP * 2][node.data.motherNode] &&
      node.data.isRight
    ) {
      positionDict[x + FLOW_MAP_DEFAULT_X_GAP * 2][node.data.motherNode].push(
        node.id
      );
    } else if (
      positionDict[x - FLOW_MAP_DEFAULT_X_GAP * 2][node.data.motherNode] &&
      !node.data.isRight
    ) {
      positionDict[x - FLOW_MAP_DEFAULT_X_GAP * 2][node.data.motherNode].push(
        node.id
      );
    } else {
      // 유효하지 않은 노드는 삭제
      // Remove invalid nodes
      delete addrNodes[node.id];
    }
  }

  // 추가 위치 계산 및 노드 배치
  // Perform additional position calculations and arrange nodes
  // 첫 번째 루프: positionDict를 순회하며 각 키(key)에 대한 하위 키(subKey)의 노드 위치를 계산
  // First loop: Iterate over positionDict to calculate node positions for each key (key) and subKey.
  for (const key in positionDict) {
    // 각 subKey를 처리하여 노드의 위치를 계산
    // Process each subKey to calculate the positions of nodes
    for (const subKey in positionDict[key]) {
      let initY = y; // 초기 Y 좌표 설정
      let subKeyLength = positionDict[key][subKey].length;

      // 특정 조건에 따라 위치 계산 (주로 주소와 관련)
      // Calculate positions based on specific conditions (mainly related to address)
      if (
        subKeyLength > 0 &&
        (Number(key) === x + 2 * FLOW_MAP_DEFAULT_X_GAP ||
          Number(key) === x - 2 * FLOW_MAP_DEFAULT_X_GAP)
      ) {
        for (let i = 0; i < positionDict[key][subKey].length; i++) {
          let motherX = 0;

          // 부모 노드의 X 좌표 결정
          // Determine the X-coordinate of the parent node
          if (Number(key) === x + 2 * FLOW_MAP_DEFAULT_X_GAP) {
            motherX = x + FLOW_MAP_DEFAULT_X_GAP;
          }
          if (Number(key) === x - 2 * FLOW_MAP_DEFAULT_X_GAP) {
            motherX = x - FLOW_MAP_DEFAULT_X_GAP;
          }

          // 부모 X 좌표에서 이미 사용된 Y 값을 확인하여 중복을 방지
          // Check existing Y values at the parent X-coordinate to avoid overlaps
          if (allPositionDict[motherX]) {
            if (allPositionDict[motherX].has(initY)) {
              const maxInSet = Math.max(...allPositionDict[motherX]);
              initY = maxInSet + FLOW_MAP_DEFAULT_Y;
            }
          }
          // 현재 key의 Set이 없으면 새로 생성
          // Create a new Set for the current key if it does not exist
          let element = positionDict[key][subKey][i];
          if (!allPositionDict[key]) {
            allPositionDict[key] = new Set();
          }
          // Y 좌표 중복 방지를 위한 조정
          // Adjust Y-coordinates to prevent overlaps
          if (allPositionDict[key] instanceof Set) {
            while (allPositionDict[key].has(initY)) {
              initY += FLOW_MAP_DEFAULT_Y_GAP;
            }
          }
          // addrNodes에 해당 노드의 위치를 설정
          // Set the position for the node in addrNodes
          if (!addrNodes[element].position && !nodeIdSet.includes(element)) {
            allPositionDict[key].add(initY);
            addrNodes[element]["position"] = { x: Number(key), y: initY };
          }
          // 부모 노드의 위치 설정
          // Set the position of the parent node
          if (
            !txsNodes[addrNodes[element]?.data?.motherNode]?.position &&
            !nodeIdSet.includes(addrNodes[element]?.data?.motherNode)
          ) {
            if (allPositionDict[motherX] === undefined) {
              allPositionDict[motherX] = new Set();
            }
            if (allPositionDict[motherX] instanceof Set) {
              while (allPositionDict[motherX].has(initY)) {
                initY += FLOW_MAP_DEFAULT_Y_GAP;
              }
            }
            allPositionDict[motherX].add(initY);
            txsNodes[addrNodes[element]?.data?.motherNode].position = {
              x: motherX,
              y: initY,
            };
          }
        }
      }
    }
  }

  // 두 번째 루프: 특정 조건에서 txsNodes의 위치를 계산
  // Second loop: Calculate the positions of txsNodes under specific conditions
  for (const key in positionDict) {
    for (const subKey in positionDict[key]) {
      let subKeyLength = positionDict[key][subKey].length;

      // address을 제외한 경우에만 처리
      // Process only if the x condition is not met (only for transactions)
      if (
        subKeyLength > 0 &&
        Number(key) !== x + 2 * FLOW_MAP_DEFAULT_X_GAP &&
        Number(key) !== x - 2 * FLOW_MAP_DEFAULT_X_GAP
      ) {
        for (let i = 0; i < positionDict[key][subKey].length; i++) {
          let element = positionDict[key][subKey][i];

          // txsNodes의 위치가 설정되지 않은 경우에만 처리
          // Process only if the position of txsNodes is not set
          if (!txsNodes[element]["position"] && !nodeIdSet.includes(element)) {
            let txsY = Infinity;

            // 자식 노드의 Y 좌표를 기반으로 부모 Y 좌표 설정
            // Set the parent Y-coordinate based on the Y-coordinates of child nodes

            for (const child in txsNodes[element].childNodes) {
              const childPosition = addrNodes[child].position;
              if (txsY > childPosition.y) {
                txsY = childPosition.y;
              }
            }

            // 자식 노드가 없는 경우 기본 Y 좌표 사용
            // Use default Y-coordinate if no child nodes exist
            if (txsY === Infinity) {
              txsY = y;
            }

            // 현재 key에 대한 Set 생성
            // Create a Set for the current key
            if (!allPositionDict[key]) {
              allPositionDict[key] = new Set();
            }

            // Y 중복 방지를 위해 좌표 조정
            // Adjust coordinates to avoid Y overlaps

            if (allPositionDict[key] instanceof Set) {
              while (allPositionDict[key].has(txsY)) {
                txsY += FLOW_MAP_DEFAULT_Y_GAP;
              }
            }
            allPositionDict[key].add(txsY);
            txsNodes[element].position = { x: Number(key), y: txsY };
          }
        }
      }
    }
  }
  allPositionDict[0] = new Set();
  allPositionDict[0].add(0);
  return [txsNodes, addrNodes, allPositionDict];
};

/**
 * setNthDataGraph 함수 / setNthDataGraph Function
 *
 * 특정 N차 데이터(`nthData`)를 기반으로 그래프 노드와 엣지를 생성하는 함수
 * 현재 비효율적인 n차 데이터 저장 방식에 맞춰 프론트 코드를 작성하다 보니 매우 비효율 적임, 향후 db 구조 및 서버 코드 변경 필요
 * Builds graph nodes and edges based on N-th level data (`nthData`)
 * It is very inefficient to write the front code according to the current inefficient n-th data storage method, and needs to change the db structure and server code in the future
 * @param {string} walletAddress - 그래프의 메인 노드로 설정될 지갑 주소
 *                                Wallet address to be set as the main node in the graph
 * @param {Array} nthData - N차 데이터를 포함하는 배열
 *                         Array containing N-th level data
 *                         Example: [{type: '1th', txHash: 'hash1', walletAddress: 'addr1'}]
 *
 * 개선 방향 / Improvement Suggestions:
 * 1. 복잡한 로직을 유틸 함수로 분리하여 가독성 및 재사용성 개선
 *    Extract complex logic into utility functions for better readability and reusability
 * 2. 중복되는 API 호출을 최소화하거나  최적화 필요 Requires minimizing or optimizing overlapping API calls
 * 3. 함수 내부 로직을 분리하여 단일 책임 원칙(SRP)을 유지 Maintain Single Responsibility Principle (SRP) by separating logic inside functions
 */
export async function setNthDataGraph(
  walletAddress,
  nthData,
  positionDict,
  mainNet
) {
  let newNodes = []; // 생성될 새 노드 리스트 / List of newly created nodes
  let newEdges = []; // 생성될 새 엣지 리스트 / List of newly created edges
  let newAddrNodesDict = {}; // 주소별 노드 데이터 저장용 딕셔너리 / Dictionary to store node data by address
  let newNodesDict = {}; // 노드 ID별 데이터 저장용 딕셔너리 / Dictionary to store node data by ID
  let mainNode = {}; // 메인 노드 초기화 / Initialize the main node
  let allPositionDict = positionDict;
  // 모든 노드 위치 데이터를 저장하는 구조 초기화
  // Initialize a structure to store positions of all nodes
  allPositionDict[FLOW_MAP_DEFAULT_X] = new Set();
  allPositionDict[FLOW_MAP_DEFAULT_X].add(FLOW_MAP_DEFAULT_Y);

  // 메인 노드 데이터 설정
  // Configure main node data
  let mainAddress = {
    id: walletAddress,
    data: { address: walletAddress, mainNet: mainNet },
  };
  const params1 = { address: walletAddress };
  let coin = mainNet.toLowerCase();
  if (coin === "usdt") {
    coin = "eth"; // USDT는 ETH로 처리 / Treat USDT as ETH
  }

  // 지갑 주소 데이터 API 호출 및 화이트/블랙리스트 여부 설정
  // Fetch wallet address data and determine if it's on the whitelist/blacklist
  const addressInfo = await GraphApiService.sendPostToGraph(
    coin + "/address",
    params1
  );
  if (addressInfo?.data?.adrsData?.whitelistYn) {
    mainAddress.type = "mainWhiteNode"; // 화이트리스트 노드 / Whitelisted node
  } else if (addressInfo?.data?.adrsData?.blacklistYn) {
    mainAddress.type = "mainBlackNode"; // 블랙리스트 노드 / Blacklisted node
  } else {
    mainAddress.type = "mainNode"; // 일반 노드 / General node
  }
  let edges = []; // 엣지 리스트 / List of edges
  let transactions = []; // 트랜잭션 해시 리스트 / List of transaction hashes
  let transactionDicts = []; // 트랜잭션 데이터 저장 딕셔너리 / Dictionary to store transaction data
  let txDict = {}; // 트랜잭션 ID별 데이터 저장 / Store data by transaction ID
  let addrDict = {}; // 주소별 데이터 저장 / Store data by address

  // type 형태에 따라 몇차인지 결정 / Decide how many times depending on the type type
  let address0info = nthData.find(
    (item) =>
      item.type.includes("1th") &&
      !item.type.includes("Potential") &&
      !item.type.includes("Sent")
  );
  let address1info = nthData.find(
    (item) =>
      item.type.includes("1th") &&
      (item.type.includes("Potential") || item.type.includes("Sent"))
  );
  let address2info = nthData.find(function (item) {
    return item.type.includes("2th");
  });
  let address3info = nthData.find(function (item) {
    return item.type.includes("3th");
  });
  let addressNth = nthData.length;

  // N차 데이터를 순회하며 트랜잭션 해시를 수집
  // Iterate over N-th level data to collect transaction hashes
  for (let val of nthData) {
    transactions.push(val.txHash);
  }
  // 트랜잭션 해시 중복 제거
  // Remove duplicate transaction hashes
  let uniqueList = [...new Set(transactions)];

  // 트랜잭션 정보를 가져오기 위해 API 호출
  // Fetch transaction information using API calls
  for (let val of uniqueList) {
    const txId = val;
    let params = { tx_id: txId };
    const transactionResponse = await GraphApiService.sendPostToGraph(
      "btc/transaction",
      params
    );
    let tx = {
      addressList: transactionResponse.data.addressList,
      txId: txId,
    };
    transactionDicts.push(tx);
  }

  let firstConnect = address0info;
  if (addressNth > 0) {
    firstConnect = address0info;
  }

  // n차 연결 주소들의 좌우 방향 초기화 / Left and right initialization of nth connection addresses
  let a0Direction = -1;
  let a1Direction = -1;
  let a2Direction = -1;
  let a01Direction = -1;
  let a11Direction = -1;
  let a21Direction = -1;

  /**
   * 첫 번째 주소와 연결 설정
   * Configure the connection to the first address
   */
  if (addressNth > 1) {
    firstConnect = address1info;
    const addressTxList = transactionDicts.find(
      (item) => item.txId === address0info.txHash
    );

    // 전송량에 따라 방향 설정
    const valueDict = calAddressValueList(addressTxList.addressList);
    let netValueDirection = false;
    // 엣지 생성 (전송량에 따라 방향 설정)
    // Create edges based on the transaction value direction Create an edge between first-order addresses and transactions
    let rel = {};
    if (valueDict[address1info.walletAddress] > 0) {
      netValueDirection = true;
      a0Direction = 1;
      rel = {
        id: `${address1info.walletAddress}-${address0info.txHash}`,
        source: address1info.walletAddress,
        target: address0info.txHash,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        data: {
          value: valueDict[address1info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
    } else {
      netValueDirection = false;
      rel = {
        id: `${address0info.txHash}-${address1info.walletAddress}`,
        source: address0info.txHash,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        target: address1info.walletAddress,
        data: {
          value: -valueDict[address1info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
    }
    edges.push(rel);

    let rel1 = {};
    // 0차 주소와 트랜잭션 간 엣지 생성 / Create an edge between zero-order addresses and transactions
    if (valueDict[address0info.walletAddress] > 0) {
      rel1 = {
        id: `${address0info.walletAddress}-${address0info.txHash}`,
        source: address0info.walletAddress,
        target: address0info.txHash,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        data: {
          value: valueDict[address0info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
    } else {
      rel1 = {
        id: `${address0info.txHash}-${address0info.walletAddress}`,
        source: address0info.txHash,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        target: address0info.walletAddress,
        data: {
          value: -valueDict[address0info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
      a01Direction = 1;
    }
    edges.push(rel1);

    if (addrDict[address0info.walletAddress]?.data) {
      addrDict[address0info.walletAddress].data.motherNode =
        address0info.txHash;
    } else {
      addrDict[address0info.walletAddress] = {
        id: address0info.walletAddress,
        type: "blacklistNode",
        data: {
          address: address0info.walletAddress,
          isRight: netValueDirection,
          // 삭제시 트리 구조에 의해 자식들이 삭제 되어야 하므로 부모 노드 설정 / Set the parent node because deleting requires the children to be deleted by the tree structure
          motherNode: address0info.txHash,
          mainNet: mainNet,
        },
      };
    }
    txDict[address0info.txHash] = {
      id: address0info.txHash,
      type: "transactionNode",
      data: {
        txId: address0info.txHash,
        isRight: netValueDirection,
        block: addressTxList?.addressList[0]?.transaction?.block,
        value: addressTxList?.addressList[0]?.transaction?.value,
        // 삭제시 트리 구조에 의해 자식들이 삭제 되어야 하므로 부모, 자식 노드 설정
        childNodes: [address0info.walletAddress],
        motherNode: address1info.walletAddress,
      },
    };
  }

  /**
   * 두 번째 주소와 연결 설정
   * Configure the connection to the second address
   */
  if (addressNth > 2) {
    firstConnect = address2info;
    //12 연결
    const addressTxList = transactionDicts.find(
      (item) => item.txId === address1info.txHash
    );
    const valueDict = calAddressValueList(addressTxList.addressList);
    let netValueDirection = false;
    let rel = {};
    if (valueDict[address2info.walletAddress] > 0) {
      a1Direction = 1;
      netValueDirection = true;
      rel = {
        id: `${address2info.walletAddress}-${address1info.txHash}`,
        source: address2info.walletAddress,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        target: address1info.txHash,
        data: {
          value: valueDict[address2info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
    } else {
      netValueDirection = false;
      rel = {
        id: `${address1info.txHash}-${address2info.walletAddress}`,
        source: address1info.txHash,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        target: address2info.walletAddress,
        data: {
          value: -valueDict[address2info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
    }
    edges.push(rel);

    let rel1 = {};
    if (valueDict[address1info.walletAddress] > 0) {
      rel1 = {
        id: `${address1info.walletAddress}-${address1info.txHash}`,
        source: address1info.walletAddress,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        target: address1info.txHash,
        data: {
          value: valueDict[address1info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
    } else {
      a11Direction = 1;
      rel1 = {
        id: `${address1info.txHash}-${address1info.walletAddress}`,
        source: address1info.txHash,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        target: address1info.walletAddress,
        data: {
          value: -valueDict[address1info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
    }
    edges.push(rel1);

    if (addrDict[address1info.walletAddress]?.data) {
      addrDict[address1info.walletAddress].data.motherNode =
        address1info.txHash;
    } else {
      addrDict[address1info.walletAddress] = {
        id: address1info.walletAddress,
        type: "blacklistNode",
        data: {
          address: address1info.walletAddress,
          isRight: netValueDirection,
          motherNode: address1info.txHash,
          mainNet: mainNet,
        },
      };
    }
    txDict[address1info.txHash] = {
      id: address1info.txHash,
      type: "transactionNode",
      data: {
        txId: address1info.txHash,
        isRight: netValueDirection,
        block: addressTxList?.addressList[0]?.transaction?.block,
        value: addressTxList?.addressList[0]?.transaction?.value,
        childNodes: [address1info.walletAddress],
        motherNode: address2info.walletAddress,
      },
    };
  }

  /**
   * 세 번째 주소와 연결 설정
   * Configure the connection to the third address
   */
  if (addressNth > 3) {
    firstConnect = address3info;
    //23 연결
    const addressTxList = transactionDicts.find(
      (item) => item.txId === address2info.txHash
    );
    const valueDict = calAddressValueList(addressTxList.addressList);
    let netValueDirection = false;
    let rel = {};
    if (valueDict[address3info.walletAddress] > 0) {
      netValueDirection = true;
      a2Direction = 1;
      rel = {
        id: `${address3info.walletAddress}-${address2info.txHash}`,
        source: address3info.walletAddress,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        target: address2info.txHash,
        data: {
          value: valueDict[address3info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
    } else {
      netValueDirection = false;
      rel = {
        id: `${address2info.txHash}-${address3info.walletAddress}`,
        source: address2info.txHash,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        target: address3info.walletAddress,
        data: {
          value: -valueDict[address3info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
    }
    edges.push(rel);

    let rel1 = {};
    if (valueDict[address2info.walletAddress] > 0) {
      rel1 = {
        id: `${address2info.walletAddress}-${address2info.txHash}`,
        source: address2info.walletAddress,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        target: address2info.txHash,
        data: {
          value: valueDict[address2info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
    } else {
      a21Direction = 1;
      rel1 = {
        id: `${address2info.txHash}-${address2info.walletAddress}`,
        source: address2info.txHash,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        target: address2info.walletAddress,
        data: {
          value: -valueDict[address2info.walletAddress],
          time: addressTxList.addressList[0].transaction.timestamp,
          token: mainNet,
        },
        type: "timeValueEdge",
      };
    }
    edges.push(rel1);
    if (addrDict[address2info.walletAddress]?.data) {
      addrDict[address2info.walletAddress].data.motherNode =
        address2info.txHash;
    } else {
      addrDict[address2info.walletAddress] = {
        id: address2info.walletAddress,
        type: "blacklistNode",
        data: {
          address: address2info.walletAddress,
          isRight: netValueDirection,
          motherNode: address2info.txHash,
          mainNet: mainNet,
        },
      };
    }
    txDict[address2info.txHash] = {
      id: address2info.txHash,
      type: "transactionNode",
      data: {
        txId: address2info.txHash,
        isRight: netValueDirection,
        block: addressTxList?.addressList[0]?.transaction?.block,
        value: addressTxList?.addressList[0]?.transaction?.value,
        childNodes: [address2info.walletAddress],
        motherNode: address3info.walletAddress,
      },
    };
  }

  /**
   * 메인 주소와 연결 설정
   * Configure the connection to the main(0 order) address
   */
  const addressTxList = transactionDicts.find(
    (item) => item.txId === firstConnect.txHash
  );
  const valueDict = calAddressValueList(addressTxList.addressList);
  let netValueDirection = false;
  let rel = {};
  if (valueDict[walletAddress] > 0) {
    netValueDirection = true;
    rel = {
      id: `${walletAddress}-${firstConnect.txHash}`,
      source: walletAddress,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      target: firstConnect.txHash,
      data: {
        value: valueDict[walletAddress],
        time: addressTxList.addressList[0].transaction.timestamp,
        token: mainNet,
      },
      type: "timeValueEdge",
    };
  } else {
    netValueDirection = false;
    rel = {
      id: `${firstConnect.txHash}-${walletAddress}`,
      source: firstConnect.txHash,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      target: walletAddress,
      data: {
        value: -valueDict[walletAddress],
        time: addressTxList.addressList[0].transaction.timestamp,
        token: mainNet,
      },
      type: "timeValueEdge",
    };
  }
  edges.push(rel);

  let rel1 = {};
  if (valueDict[firstConnect.walletAddress] > 0) {
    rel1 = {
      id: `${firstConnect.walletAddress}-${firstConnect.txHash}`,
      source: firstConnect.walletAddress,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      target: firstConnect.txHash,
      data: {
        value: valueDict[firstConnect.walletAddress],
        time: addressTxList.addressList[0].transaction.timestamp,
        token: mainNet,
      },
      type: "timeValueEdge",
    };
  } else {
    rel1 = {
      id: `${firstConnect.txHash}-${firstConnect.walletAddress}`,
      source: firstConnect.txHash,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      target: firstConnect.walletAddress,
      data: {
        value: -valueDict[firstConnect.walletAddress],
        time: addressTxList.addressList[0].transaction.timestamp,
        token: mainNet,
      },
      type: "timeValueEdge",
    };
  }
  edges.push(rel1);

  // 위치값 결정 / Determining Position Values
  let positionCorrection = netValueDirection ? 1 : -1;
  const motherPosition = {
    x: FLOW_MAP_DEFAULT_X + 2 * positionCorrection * FLOW_MAP_DEFAULT_X_GAP,
    y: FLOW_MAP_DEFAULT_Y,
  };
  if (addrDict[firstConnect.walletAddress]?.data) {
    addrDict[firstConnect.walletAddress].data.motherNode = firstConnect.txHash;
  } else {
    addrDict[firstConnect.walletAddress] = {
      id: firstConnect.walletAddress,
      type: "blacklistNode",
      data: {
        address: firstConnect.walletAddress,
        isRight: netValueDirection,
        motherNode: firstConnect.txHash,
        mainNet: mainNet,
      },
      position: motherPosition,
    };
  }
  txDict[firstConnect.txHash] = {
    id: firstConnect.txHash,
    type: "transactionNode",
    data: {
      block: addressTxList?.addressList[0]?.transaction?.block,
      txId: firstConnect.txHash,
      isRight: netValueDirection,
      value: addressTxList?.addressList[0]?.transaction?.value,
      childNodes: [firstConnect.walletAddress],
      motherNode: walletAddress,
    },
    position: {
      x: FLOW_MAP_DEFAULT_X + positionCorrection * FLOW_MAP_DEFAULT_X_GAP,
      y: FLOW_MAP_DEFAULT_Y,
    },
  };

  // 전체 노드들의 위치 설정 / Setting the Position of All Nodes
  allPositionDict[
    FLOW_MAP_DEFAULT_X + positionCorrection * FLOW_MAP_DEFAULT_X_GAP
  ] = new Set();
  allPositionDict[
    FLOW_MAP_DEFAULT_X + positionCorrection * FLOW_MAP_DEFAULT_X_GAP
  ].add(FLOW_MAP_DEFAULT_Y);
  allPositionDict[motherPosition.x] = new Set();
  allPositionDict[motherPosition.x].add(motherPosition.y);

  //4차 까지 주소 존재시 4차까지 노드들의 위치 계산 / Calculate the positions of nodes up to the 4th when address exists up to the 4th
  if (addressNth === 4) {
    addrDict[firstConnect.walletAddress].data.childNodes = [
      address2info.txHash,
    ];

    const txPosition = getNodePosition(
      allPositionDict,
      motherPosition,
      a2Direction
    );
    txDict[address2info.txHash].position = txPosition;
    const adPosition = getNodePosition(
      allPositionDict,
      txPosition,
      a21Direction
    );
    addrDict[address2info.walletAddress].position = adPosition;

    addrDict[address2info.walletAddress].data.childNodes = [
      address1info.txHash,
    ];

    const tx1Position = getNodePosition(
      allPositionDict,
      adPosition,
      a1Direction
    );
    txDict[address1info.txHash].position = tx1Position;
    const ad1Position = getNodePosition(
      allPositionDict,
      tx1Position,
      a11Direction
    );
    addrDict[address1info.walletAddress].position = ad1Position;

    addrDict[address1info.walletAddress].data.childNodes = [
      address0info.txHash,
    ];

    const tx2Position = getNodePosition(
      allPositionDict,
      ad1Position,
      a0Direction
    );
    txDict[address0info.txHash].position = tx2Position;
    addrDict[address0info.walletAddress].position = getNodePosition(
      allPositionDict,
      tx2Position,
      a01Direction
    );
  }
  //3차 까지 주소 존재시 3차까지 노드들의 위치 계산 / Calculate the positions of nodes up to the third order
  if (addressNth === 3) {
    addrDict[firstConnect.walletAddress].data.childNodes = [
      address1info.txHash,
    ];
    const txPosition = getNodePosition(
      allPositionDict,
      motherPosition,
      a1Direction
    );
    txDict[address1info.txHash].position = txPosition;
    const adPosition = getNodePosition(
      allPositionDict,
      txPosition,
      a11Direction
    );
    addrDict[address1info.walletAddress].position = adPosition;

    addrDict[address1info.walletAddress].data.childNodes = [
      address0info.txHash,
    ];
    const tx1Position = getNodePosition(
      allPositionDict,
      adPosition,
      a0Direction
    );
    txDict[address0info.txHash].position = tx1Position;
    addrDict[address0info.walletAddress].position = getNodePosition(
      allPositionDict,
      tx1Position,
      a01Direction
    );
  }
  //2차 까지 주소 존재시 2차까지 노드들의 위치 계산 / Calculate the positions of nodes up to the second order
  if (addressNth === 2) {
    addrDict[firstConnect.walletAddress].data.childNodes = [
      address0info.txHash,
    ];
    const txPosition = getNodePosition(
      allPositionDict,
      motherPosition,
      a0Direction
    );
    txDict[address0info.txHash].position = txPosition;
    addrDict[address0info.walletAddress].position = getNodePosition(
      allPositionDict,
      txPosition,
      a01Direction
    );
  }

  // 메인 노드 설정 / Main Node Settings
  mainAddress.data.childNodes = [firstConnect.txHash];
  mainNode = mainAddress;
  mainNode.position = { x: FLOW_MAP_DEFAULT_X, y: FLOW_MAP_DEFAULT_Y - 8 };
  newNodesDict = txDict;
  newAddrNodesDict = addrDict;
  newEdges = edges;
  for (let key in newNodesDict) {
    newNodes.push(newNodesDict[key]);
  }
  for (let key in newAddrNodesDict) {
    newNodes.push(newAddrNodesDict[key]);
  }
  // 최종적으로 업데이트된 그래프를 상태 및 변수에 전달 / Passing the last updated graph to status and variables
  newNodes.push(mainNode);

  const flowNodeList = newNodes;
  const flowEdgeList = newEdges;
  return {
    flowNodeList,
    flowEdgeList,
    allPositionDict: allPositionDict,
  };
}

export const getTransactionMap = async ({
  addedNodes,
  address,
  start,
  end,
  limit = 100,
  page = 0,
}) => {
  const rendered = [];
  const unrendered = [];
  let params = {
    address: address,
    offset: page * 100,
    limit: limit,
    start: start,
    end: end,
  };
  const transactionListResponse = await GraphApiService.sendPostToGraph(
    "btc/transaction-map/recent",
    params
  );
  if (
    transactionListResponse &&
    transactionListResponse.data &&
    transactionListResponse.data.transactionToTxList
  ) {
    const transactionToTxList =
      transactionListResponse.data.transactionToTxList;
    const returnData = [];
    let checked = 0;
    transactionToTxList.map((t, id) => {
      const index = addedNodes.findIndex((x) => x.id === t.txId);
      const temp = t;
      if (index === -1) {
        unrendered.push(t.txId);
        temp.checkbox = false;
      } else {
        rendered.push(t.txId);
        temp.checkbox = true;
        checked = checked + 1;
      }
      returnData.push(temp);
      return null;
    });
    return {
      list: returnData.sort((a, b) => b.checkbox - a.checkbox),
      checked: checked,
      rendered,
      unrendered,
    };
  }
  return null;
};

/**
 * getTransactionList
 * 주소를 기준으로 트랜잭션 목록을 가져오는 함수
 * Fetches a list of transactions based on a given address
 *
 * @param {string} address - 조회할 대상 주소
 *                           The address to fetch transactions for
 * @param {number} page - 페이징 처리를 위한 페이지 번호 (기본값: 0)
 *                        Page number for pagination (default: 0)
 */
export const getTransactionList = async (
  undisplayedTransactionList,
  displayedTransactionList,
  address,
  mainNet,
  addressDictList,
  flowNodeList,
  setTransactionPage,
  startTime,
  endTime,
  page = 0,
  limit = 100,
  isAppend = true
) => {
  let undisplayedTransactionListTemp = undisplayedTransactionList;
  let displayedTransactionListTemp = displayedTransactionList;
  let addressDictListTemp = addressDictList;
  const nodeIdSet = flowNodeList.map((element) => element.id);
  if (!isAppend) {
    undisplayedTransactionListTemp = [];
    displayedTransactionListTemp = [];
  }
  if (mainNet === "BTC") {
    // BTC 네트워크 트랜잭션 데이터를 요청
    // Request BTC network transaction data
    let params = {
      address: address,
      offset:  Math.floor(page * limit / 2 ) ,
      limit: Math.floor(limit / 2),
      start: startTime || null,
      end: endTime || null,
    };
    const transactionListResponse = await GraphApiService.sendPostToGraph(
      "btc/transaction-map/recent",
      params
    );
    if (
      transactionListResponse &&
      transactionListResponse.data &&
      transactionListResponse.data.transactionToTxList
    ) {
      // addressDictList에 트랜잭션 데이터 추가
      // Append transaction data to addressDictList
      const index = addressDictListTemp.findIndex(
        (item) =>
          item.txId === transactionListResponse.data.transactionToTxList.txId
      );
      if (isAppend) {
        if (index === -1) {
          addressDictListTemp = [
            ...addressDictListTemp,
            ...transactionListResponse.data.transactionToTxList,
          ];
        }
      } else {
        addressDictListTemp = transactionListResponse.data.transactionToTxList;
      }

      // 표시되지 않은 트랜잭션과 이미 표시된 트랜잭션을 분리
      // Separate undisplayed transactions from displayed ones
      const txIdList = [
        ...undisplayedTransactionListTemp,
        ...transactionListResponse.data.transactionToTxList.map(
          (item) => item.txId
        ),
      ];
      const addedTransaction = txIdList.filter((txId) =>
        nodeIdSet.includes(txId)
      );
      displayedTransactionListTemp = [
        ...displayedTransactionListTemp,
        ...addedTransaction,
      ];
      undisplayedTransactionListTemp = txIdList.filter(
        (tx_id) => !displayedTransactionListTemp.includes(tx_id)
      );
    } else {
      ComUtil.showPopUp("조건에 해당하는 트랜잭션이 없습니다.");
    }

    // 다음 페이지를 처리하도록 상태 업데이트
    // Update the state to process the next page
    setTransactionPage((page) => page + 1);
  } else {
    // 비-BTC 네트워크 트랜잭션 처리
    // Handle transactions for non-BTC networks
    let endpoint = "";
    let params = {
      address: address,
      offset: Math.floor(page * limit / 2),
      limit: Math.floor(limit / 2),
      start: startTime || null,
      end: endTime || null,
      count: limit,
      direction: 'ALL'
    };

    if (mainNet === "") {
      mainNet = ComUtil.inqMainNet(address);
    }

    // 네트워크에 따른 API 엔드포인트 설정
    // Set API endpoints based on the network type
    if (mainNet === "ETH") {
      endpoint = "eth/map";
    }
    if (mainNet === "erc") {
      endpoint = "eth/map/internal";
      params.tokenId = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    }
    if (mainNet === "TRX") {
      endpoint = "trx/map";
    }
    if (mainNet === "XRP") {
      endpoint = "xrp/map";
    }
    const transactionListResponse = await GraphApiService.sendPostToGraph(
      endpoint,
      params
    );

    if (
      transactionListResponse.status === 200 &&
      transactionListResponse.data &&
      transactionListResponse.data.addressList
    ) {
      // addressDictList에 새 데이터를 추가
      // Add new data to addressDictList
      const index = addressDictListTemp.findIndex(
        (item) =>
          item.txId === transactionListResponse.data.transactionToTxList.txId
      );
      if (isAppend) {
        if (index === -1) {
          addressDictListTemp = [
            ...addressDictListTemp,
            ...transactionListResponse.data.transactionToTxList,
          ];
        }
      } else {
        addressDictListTemp = transactionListResponse.data.transactionToTxList;
      }
      if (mainNet !== "XRP") {
        const txIdList = [
          ...new Set([
            ...undisplayedTransactionListTemp,
            ...transactionListResponse.data.addressList.map(
              (item) => item.address.addr
            ),
          ]),
        ];
        const addedTransaction = txIdList.filter((txId) =>
          nodeIdSet.includes(txId)
        );
        displayedTransactionListTemp = [
          ...new Set([...displayedTransactionListTemp, ...addedTransaction]),
        ];
        undisplayedTransactionListTemp = txIdList.filter(
          (tx_id) => !displayedTransactionListTemp.includes(tx_id)
        );
      } else {
        const txIdList = [
          ...new Set([
            ...undisplayedTransactionListTemp,
            ...transactionListResponse.data.addressList.map(
              (item) => item.address.addr
            ),
          ]),
        ];
        const addedTransaction = txIdList.filter((txId) =>
          nodeIdSet.includes(txId)
        );
        displayedTransactionListTemp = [
          ...new Set([...displayedTransactionListTemp, ...addedTransaction]),
        ];
        undisplayedTransactionListTemp = txIdList.filter(
          (tx_id) => !displayedTransactionListTemp.includes(tx_id)
        );
      }
      addressDictList = [...new Map(addressDictList.map(item => [item.transaction.txHash, item])).values()];
    } else {
      undisplayedTransactionListTemp = [];
      if (!isAppend) {
        displayedTransactionListTemp = [];
        addressDictListTemp = [];
      }
    }
    setTransactionPage((page) => page + 1);
  }
  return {
    undisplayedTransactionList: undisplayedTransactionListTemp,
    displayedTransactionList: displayedTransactionListTemp,
    addressDictList: addressDictListTemp,
  };
};

/**
 * getTransactionInfo
 * 특정 트랜잭션의 세부 정보를 가져오는 함수
 * Fetches detailed information for a specific transaction
 *
 * @param {string} transaction - 조회할 트랜잭션 ID
 *                               Transaction ID to fetch details for
 */
export const getTransactionInfo = async (
  transaction,
  flowNodeList,
  addressDictList,
  setTransactionPage
) => {
  // API 요청을 위한 파라미터 설정
  // Set parameters for API request
  let params = { tx_id: transaction };
  let displayedAddressList = [];
  let undisplayedAddressList = [];
  let addressDictListTemp = addressDictList;
  // let undisplayedTransactionList = [];
  // 트랜잭션 정보를 API에서 요청
  // Request transaction information from the API
  const transactionResponse = await GraphApiService.sendPostToGraph(
    "btc/transaction",
    params
  );
  // 응답이 성공적이고 주소 목록이 있는 경우
  // If the response is successful and contains an address list
  if (
    transactionResponse.status === 200 &&
    transactionResponse.data &&
    transactionResponse.data.addressList
  ) {
    // 기존 표시되지 않은 주소 목록과 API에서 가져온 주소 목록 병합
    // Merge the existing undisplayed addresses with the new addresses from the API
    const addressList = [
      ...undisplayedAddressList,
      ...transactionResponse.data.addressList.map((item) => item.address.addr),
    ];
    // 표시된 주소 목록을 필터링하여 추가
    // Filter and add addresses that are already displayed
    let nodeIdSet = flowNodeList.map((element) => element.id);
    const addedAddress = addressList.filter((address) =>
      nodeIdSet.includes(address)
    );
    displayedAddressList = [...displayedAddressList, ...addedAddress];
    // 표시되지 않은 주소 목록 업데이트
    // Update the undisplayed address list
    undisplayedAddressList = addressList.filter(
      (address) => !displayedAddressList.includes(address)
    );

    // 주소 데이터 딕셔너리에 새로운 주소 추가
    // Add new addresses to the address dictionary list
    addressDictListTemp = [
      ...addressDictList,
      ...transactionResponse.data.addressList,
    ];
  } else {
    // 데이터가 없거나 실패한 경우 초기화
    // Reset data in case of failure or missing data
    // undisplayedTransactionList = [];
    addressDictListTemp = [];
  }
  // 다음 페이지를 처리하도록 상태 업데이트
  // Increment the page state for the next batch of data
  setTransactionPage((page) => page + 1);
  return {
    displayedAddressList,
    undisplayedAddressList,
    addressDictList: addressDictListTemp,
    addressList: transactionResponse.data.addressList,
  };
};

/**
 * Recursively deletes a node and all its child nodes from the flow graph.
 * 플로우 그래프에서 특정 노드와 그 하위 노드를 재귀적으로 삭제.
 *
 * @param {Object} element - The node to delete.
 */
export function deleteNode(element, flowNodeList, allPositionDict) {
  let flowNodeListTemp = flowNodeList;
  // Check if the node has child nodes to delete.
  if (element.data.hasOwnProperty("childNodes")) {
    // If the node is a child of the current element, delete it recursively.
    flowNodeList.forEach((node) => {
      if (element.data.childNodes.includes(node.id)) {
        deleteNode(node, flowNodeList, allPositionDict); // Recursive call for child nodes.
        // flowNodeListTemp.delete(node.id); // Remove the node ID from the global set.
        flowNodeListTemp = flowNodeListTemp.filter((n) => n.id !== node.id);
      }
    });
    // Remove child nodes from the flow graph and state.
    flowNodeListTemp = flowNodeListTemp.filter(
      (node) => !element.data.childNodes.includes(node.id)
    );
  }
  // Remove the current node from the flow graph and state.
  flowNodeListTemp = flowNodeListTemp.filter((node) => node.id !== element.id);

  // Remove the node ID from the global set.
  // nodeIdSetTemp.delete(element.id);
  const position = element.position;
  const currentPosition = allPositionDict[position.x];
  const arrayPos = Array.from(currentPosition);
  arrayPos.map((pos) => {
    if (pos === position.y) {
      currentPosition.delete(pos);
    }
  });
  return { flowNodeList: flowNodeListTemp };
}

/**
 * Dynamically adds a new node to the flow graph based on the provided node ID and type.
 * 제공된 노드 ID와 타입에 따라 동적으로 새 노드를 플로우 그래프에 추가.
 *
 * @param {string|Object} nodeId - The ID of the node to add or node data object.
 * @param {string} type - The type of the node (default is 'Address').
 */
export async function addNode(
  nodeId,
  currentModalAddress,
  tempY,
  positionDict,
  mainNet,
  flowNodeList,
  flowEdgeList,
  type = "Address"
) {
  let flowNodeListTemp = flowNodeList;
  let flowEdgeListTemp = flowEdgeList;
  let allPositionDict = positionDict;
  let position = { x: currentModalAddress.positionAbsolute.x, y: tempY }; // Initialize position based on modal.
  let yPosition = tempY;
  // Add Transaction Node
  if (type === "Transaction") {
    let params = { tx_id: nodeId };
    const transactionResponse = await GraphApiService.sendPostToGraph(
      "btc/transaction",
      params
    );
    const addressList =
      transactionResponse.status === 200
        ? transactionResponse.data.addressList
        : [];
    const foundAddr = addressList.find(
      (addr) => addr.address.addr === currentModalAddress.data.address
    );
    const direction =
      foundAddr !== undefined ? foundAddr.relationType === "OUT" : true; // Determine direction.
    const value = foundAddr !== undefined ? foundAddr.relationValue : 0;
    const txTime =
      foundAddr !== undefined ? foundAddr.transaction.timestamp : 0;

    // Adjust position based on direction (left or right of the current node).
    if (direction) {
      position.x =
        currentModalAddress.positionAbsolute.x + FLOW_MAP_DEFAULT_X_GAP;
    } else {
      position.x =
        currentModalAddress.positionAbsolute.x - FLOW_MAP_DEFAULT_X_GAP;
    }

    // Ensure the position dictionary has an entry for the x-coordinate.
    // todo need to fix
    if (allPositionDict[position.x] === undefined) {
      allPositionDict[position.x] = new Set();
    }
    if (allPositionDict[position.x] instanceof Set) {
      while (allPositionDict[position.x].has(yPosition)) {
        yPosition += FLOW_MAP_DEFAULT_Y_GAP; // Adjust y-position to avoid overlap.
      }
    }
    position.y = yPosition;
    allPositionDict[position.x].add(yPosition); // Add y-position to the position dictionary.
    let addNode = {
      id: nodeId,
      type: "transactionNode",
      data: {
        txId: nodeId,
        isRight: direction,
        motherNode: currentModalAddress.data.address,
        time: txTime,
        value: foundAddr?.transaction?.value,
        block: foundAddr?.transaction?.block,
      },
      position: position,
    };
    tempY += FLOW_MAP_DEFAULT_Y_GAP;

    // Add relationship (edge) between the current modal address and the new node.
    let rel = {
      id: direction
        ? `${currentModalAddress.data.address}-${nodeId}`
        : `${nodeId}-${currentModalAddress.data.address}`,
      source: direction ? currentModalAddress.data.address : nodeId,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      target: direction ? nodeId : currentModalAddress.data.address,
      data: { value: value, time: txTime, token: mainNet },
      type: "timeValueEdge",
    };

    // Update child nodes of the current modal address.
    currentModalAddress.data.childNodes = currentModalAddress.data.childNodes
      ? [...currentModalAddress.data.childNodes, nodeId]
      : [nodeId];
    const isElementInList = flowNodeList.some((node) => node.id === addNode.id);
    if (!isElementInList) {
      flowNodeList = [...flowNodeList, addNode];
    }

    const isElementInEdgeList = flowEdgeList.some((edge) => edge.id === rel.id);
    if (!isElementInEdgeList) {
      flowEdgeList = [...flowEdgeList, rel];
    }
    flowEdgeListTemp.push(rel);
    flowNodeListTemp.push(addNode);
  } else {
    // Add Address Node
    // Similar logic to Transaction Node with adjustments for Address Node.
    let direction =
      (nodeId.relationType === "IN" && mainNet === "BTC") ||
      (nodeId.relationType === "OUT" && mainNet !== "BTC");
    let txBlock = nodeId.block;
    let txValue = nodeId.relationValue ? nodeId.relationValue : nodeId.value;
    let txTime = 0;
    let txId = "";
    let tkId = "";
    let logIndex = "";
    let internal = false;
    let curruncy = "";
    let dt = 0;
    let dataRel = {};

    let addrType = "addressNode";
    if (nodeId.address.blacklistYn === "Y") {
      addrType = "blacklistNode";
    }
    if (nodeId.address.whitelistYn === "Y") {
      addrType = "whitelistNode";
    }

    let motherNode =
      mainNet === "BTC"
        ? currentModalAddress.data.txId
        : currentModalAddress.data.address;
    if (mainNet === "ETH") {
      txTime = nodeId?.transaction?.timestamp;
      txId = nodeId.tx_hash;
      dataRel = {
        value: txValue,
        block: txBlock,
        time: txTime,
        txHash: txId,
        internal: internal,
      };
    }
    if (mainNet === "erc") {
      direction = nodeId.relationType === "OUT";
      txValue = nodeId?.value;
      txBlock = nodeId?.transaction?.block;
      txTime = nodeId?.transaction?.timestamp;
      txId = nodeId?.transaction?.txHash;
      tkId = nodeId?.tokenId;
      logIndex = nodeId?.logIndex;
      internal = true;

      dataRel = {
        value: txValue,
        block: txBlock,
        time: txTime,
        txHash: txId,
        txId: tkId,
        logIndex: logIndex,
        internal: internal,
        token: mainNet,
      };
    }
    if (mainNet === "TRX") {
      txId = nodeId.tx_hash;
      txTime = nodeId?.transaction?.timestamp;
      txValue = nodeId?.transaction?.value;
      dataRel = {
        value: txValue,
        block: txBlock,
        txHash: txId,
        time: txTime,
        token: mainNet,
      };
    }
    if (mainNet === "XRP") {
      curruncy = nodeId.curruncy;
      dt = nodeId.dt;
      txTime = nodeId?.transaction?.timestamp;
      txValue = nodeId?.value;
      txId = direction
        ? motherNode + "-" + nodeId.address.addr
        : nodeId.address.addr + "-" + motherNode;
      dataRel = {
        value: txValue,
        block: txBlock,
        curruncy: curruncy,
        dt: dt,
        time: txTime,
        token: mainNet,
      };
    }
    if (mainNet === "BTC") {
      txTime = nodeId?.transaction.timestamp;
      dataRel = { value: nodeId.relationValue, time: txTime, token: mainNet };
    }

    if (direction) {
      position.x =
        currentModalAddress.positionAbsolute.x + FLOW_MAP_DEFAULT_X_GAP;
    } else {
      position.x =
        currentModalAddress.positionAbsolute.x - FLOW_MAP_DEFAULT_X_GAP;
    }

    if (position.x === 0 && allPositionDict[position.x] === undefined) {
      allPositionDict[position.x] = new Set();
      allPositionDict[position.x].add(0);
    }

    if (allPositionDict[position.x] === undefined) {
      allPositionDict[position.x] = new Set();
    }
    if (allPositionDict[position.x] instanceof Set) {
      while (allPositionDict[position.x].has(yPosition)) {
        yPosition += FLOW_MAP_DEFAULT_Y_GAP;
      }
    }

    allPositionDict[position.x].add(yPosition);
    position.y = yPosition;

    let addNode = {
      id: nodeId.address.addr,
      type: addrType,
      data: {
        address: nodeId.address.addr,
        isRight: direction,
        motherNode: currentModalAddress.data.txId,
        mainNet: mainNet,
      },
      position: position,
    };
    tempY += FLOW_MAP_DEFAULT_Y_GAP;
    let rel = {
      id: direction
        ? `${motherNode}-${nodeId.address.addr}`
        : `${nodeId.address.addr}-${motherNode}`,
      source: direction ? motherNode : nodeId.address.addr,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      target: direction ? nodeId.address.addr : motherNode,
      data: dataRel,
      type: "timeValueEdge",
    };
    currentModalAddress.data.childNodes = currentModalAddress.data.childNodes
      ? [...currentModalAddress.data.childNodes, nodeId.address.addr]
      : [nodeId.address.addr];
    const isElementInList = flowNodeList.some((node) => node.id === addNode.id);
    if (!isElementInList) {
      flowNodeList = [...flowNodeList, addNode];
    }
    const isElementInEdgeList = flowEdgeList.some((edge) => edge.id === rel.id);
    if (!isElementInEdgeList) {
      flowEdgeList = [...flowEdgeList, rel];
    }
    // if (mainNet === "BTC") {
    //   edgeIdSetTemp.add(rel.id);
    // } else {
    //   edgeIdSetTemp.add(rel.source + "-" + rel.target);
    // }
    flowEdgeListTemp.push(rel);
    flowNodeListTemp.push(addNode);
  }
  return {
    flowEdgeList: flowEdgeListTemp,
    flowNodeList: flowNodeListTemp,
    allPositionDict: allPositionDict,
  };
}

export const processDenyList = async (denyList, currentNode, mainNet) => {
  let returnNode = currentNode;
  let returnEdge = [];
  const sourceDetails = denyList.sourceDetails;
  const pos0 = currentNode.find((c) => {
    return c.position.x === 0;
  });
  returnNode = [pos0];
  if (sourceDetails.length === 0) return { returnNode, returnEdge };
  let nodeData = await processNode(returnNode, mainNet, sourceDetails);
  returnNode = nodeData.returnNode;
  returnEdge = await processEdge(
    returnEdge,
    returnNode,
    mainNet,
    nodeData.txs,
    nodeData.addresses
  );

  return { returnNode, returnEdge };
};

const addEdge = async (tx, leftAddress, rightAddress, mainNet, edges) => {
  const txDetails = await getTxDetail(tx.id, mainNet);
  const outAddress2 = txDetails.addressList.filter(
    (t) => t.address.addr === rightAddress.id
  )[0];
  const inAddress1 = txDetails.addressList.filter(
    (t) => t.address.addr === leftAddress.id
  )[0];
  const edgeLeft = {
    id: leftAddress.id + "-" + tx.id,
    source: leftAddress.id,
    target: tx.id,
    data: {
      time: outAddress2.transaction.timestamp,
      token: mainNet,
      value: outAddress2.relationValue,
    },
    markerEnd: {
      type: "arrowclosed",
      width: 20,
      height: 20,
      source: leftAddress.id,
    },
    type: "timeValueEdge",
  };
  edges.push(edgeLeft);
  const edgeRight = {
    id: tx.id + "-" + rightAddress.id,
    source: tx.id,
    target: rightAddress.id,
    data: {
      time: inAddress1.transaction.timestamp,
      token: mainNet,
      value: inAddress1.relationValue,
    },
    markerEnd: {
      type: "arrowclosed",
      width: 20,
      height: 20,
      source: rightAddress.id,
    },
    type: "timeValueEdge",
  };
  edges.push(edgeRight);
};

const processEdge = async (returnEdge, returnNode, mainNet, txs, addresses) => {
  let edges = returnEdge;
  for (let i = 0; i < txs.length; i++) {
    await addEdge(
      txs[i],
      returnNode[i * 2],
      returnNode[i * 2 + 2],
      mainNet,
      edges
    );
  }
  return edges;
};

const addHopToNode = async (
  returnNode,
  currentNode,
  mainNet,
  processHops,
  currentPos
) => {
  const nodes = returnNode;
  const hop = processHops.filter((h) => h.walletAddress === currentNode.id)[0];
  const subProcessHops = processHops.filter(
    (h) => h.walletAddress !== currentNode.id
  );
  const txDetails = await getTxDetail(hop.transactionHash, mainNet);
  const tx = {
    id: hop.txHash,
    type: "transactionNode",
    data: {
      isRight: true,
      motherNode: hop.walletAddress,
      txId: hop.txHash,
      time: txDetails.addressList[0].transaction.timestamp,
      value: txDetails.addressList[0].transaction.value,
      block: txDetails.addressList[0].transaction.block,
      childNodes: [hop.walletAddress, hop.prevAddress],
    },
    position: {
      x: currentPos + 300,
      y: 0,
    },
  };
  nodes.push(tx);
  const address = {
    id: hop.prevAddress,
    type: await checkType(hop.prevAddress, mainNet),
    data: {
      isRight: true,
      mainNet: mainNet,
      motherNode: tx.id,
      address: hop.prevAddress,
    },
    position: {
      x: currentPos + 600,
      y: 0,
    },
  };
  nodes.push(address);
  const newPos = currentPos + 600;
  return { nodes, subProcessHops, newPos, tx, address };
};

const processNode = async (returnNode, mainNet, hops) => {
  let processHops = hops;
  let currentPos = 0;
  let txs = [];
  let addresses = [];

  do {
    const processData = await addHopToNode(
      returnNode,
      returnNode[returnNode.length - 1],
      mainNet,
      processHops,
      currentPos
    );
    returnNode = processData.nodes;
    processHops = processData.subProcessHops;
    currentPos = processData.newPos;
    txs.push(processData.tx);
    addresses.push(processData.address);
  } while (processHops.length > 0);
  return { returnNode, txs, addresses };
};

const checkType = async (address, mainNet) => {
  let addrType = "addressNode";

  const params1 = { address: address };
  const addressInfo = await GraphApiService.sendPostToGraph(
    mainNet.toLowerCase() + "/address",
    params1
  );
  if (addressInfo?.data?.adrsData?.whitelistYn) {
    addrType = "whitelistNode";
  } else if (addressInfo?.data?.adrsData?.blacklistYn) {
    addrType = "blacklistNode";
  } else {
    addrType = "addressNode";
  }
  return addrType;
};

const getTxDetail = async (id, mainNet) => {
  let params = { tx_id: id };
  const transactionResponse = await GraphApiService.sendPostToGraph(
    mainNet.toLowerCase() + "/transaction",
    params
  );
  const txDetail = transactionResponse.data;
  return txDetail;
};

export const getDenylistData = async (address) => {
  const date = new Date();
  const currentTime = date
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
  const body = {
    walletAddress: address,
    tranDtm: currentTime,
    tranNo: "transight_web_page",
  };
  return ApiService.sendPost("wallet/highRiskSearch1", body).then(function a(
    response
  ) {
    if (response) {
      let denyList;
      // let mainNet = "";
      if (
        response.data.rspCode === "0000" ||
        response.data.rspCode === "A0000"
      ) {
        let data = response.data;

        // if (data.isDenylist === "Y" && response.data.nthList) {
        //   if (data.denylistDetail.walletType === "ERC-20(USDT)") {
        //     mainNet = "USDT";
        //   } else {
        //     mainNet = data.denylistDetail.walletType;
        //   }
        // }

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
