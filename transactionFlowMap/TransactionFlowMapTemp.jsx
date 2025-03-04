import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import ReactFlow, { applyEdgeChanges, applyNodeChanges, Controls, MiniMap } from 'reactflow';
import AddressNode from '../nodes/AddressNode';
import TransactionNode from '../nodes/TransactionNode';
import MainNode from '../nodes/MainNode';
import BlacklistNode from '../nodes/BlacklistNode';
import GraphApiService from '../../common/ApiService';
import ComUtil from '../../common/ComUtil';

const nodeTypes = {
  addressNode: AddressNode,
  transactionNode: TransactionNode,
  mainNode: MainNode,
  blacklistNode: BlacklistNode,
};

let flowNodeList = [];
let flowEdgeList = [];
let nodeIdSet = new Set();
let edgeIdSet = new Set();
let changed = [];
const TransactionFlowMapTemp = forwardRef((props, ref) => {
  const [addedNodes, setAddedNodes] = useState([]);
  const [addedEdges, setAddedEdges] = useState([]);
  const [clicked, setClicked] = useState({});
  const [searchAddress, setSearchAddress] = useState('');

  const flowRef = useRef(null);
  const defaultX = 1300;
  const defaultY = 450;
  const defaultXGap = 150;
  const defaultYGap = 50;
  let positionDict = {};

  const init = (walletAddress) => {
    setSearchAddress(walletAddress.walletAddress);
    searchAddressBtnClick(walletAddress);
  };
  useImperativeHandle(ref, () => ({
    // 부모 컴포넌트에서 사용할 함수를 선언
    init,
  }));

  function randomTrueOrFalse() {
    return Math.random() < 0.15;
  }

  const getGraph = async (address, direction = 'ALL') => {
    let params = { address: address, offset: 0, limit: 1000 };
    let mainAddress = { id: address, data: { address: address } };
    let edges = [];
    let addressList = [address];
    let txDict = {};
    let addrDict = {};

    const transactionMapResponse = await GraphApiService.sendPostToGraph('map/transaction-map', params);
    if (transactionMapResponse && transactionMapResponse.status === 200 && transactionMapResponse.data.transactionList) {
      let txList = [];
      for (let val of transactionMapResponse.data.transactionList) {
        let r = {};
        let txDirection = true;
        const txId = val['transaction'].txId;
        const txValue = val.transaction.value;
        let childAddress = [];

        if (val.direction === 'RECEIVE_FROM' && direction !== 'RIGHT') {
          txList.push(txId);
          r = { id: `${txId}-${address}`, source: txId, target: address, data: { value: txValue } };
          edges.push(r);
          txDirection = false;
          let params = { tx_id: txId, limit: 3 };
          const transactionSendResponse = await GraphApiService.sendPostToGraph('map/transaction/send', params);
          if (transactionSendResponse.status === 200 && transactionSendResponse.data.addressList) {
            for (let sendVal of transactionSendResponse.data.addressList) {
              const sendAddress = sendVal['address'].addr;
              const isBlacklist = sendVal['address'].blacklistYn;
              const sendValue = sendVal.value;
              childAddress.push(sendAddress);
              let addrType = 'addressNode';
              if (isBlacklist === 'Y') {
                addrType = 'blacklistNode';
              }
              addrDict[sendAddress] = {
                id: sendAddress,
                type: addrType,
                data: { address: sendAddress, isRight: txDirection, motherNode: txId },
              };
              let rel = {
                id: `${sendAddress}-${txId}`,
                source: sendAddress,
                target: txId,
                data: { value: sendValue },
              };
              const foundElement = edges.find((element) => element.id === rel.id);
              if (foundElement) {
                foundElement.data.value += rel.data.value;
              } else {
                edges.push(rel);
              }
            }
          }
          const uniqueChild = [...new Set(childAddress)];
          txDict[txId] = {
            id: txId,
            type: 'transactionNode',
            data: {
              txId: txId,
              isRight: txDirection,
              block: val.transaction.block,
              value: txValue,
              childNodes: uniqueChild,
              motherNode: address,
            },
          };
          const foundElement = edges.find((element) => element.id === r.id);
          if (foundElement) {
            foundElement.data.value += r.data.value;
          } else {
            edges.push(r);
          }
        }
        if (val.direction === 'SEND_TO' && direction !== 'LEFT') {
          txList.push(txId);
          r = { id: `${address}-${txId}`, source: address, target: txId, data: { value: txValue } };
          edges.push(r);
          txDirection = true;
          let params = { tx_id: txId, limit: 3 };
          const transactionReceiveResponse = await GraphApiService.sendPostToGraph('map/transaction/receive', params);
          if (transactionReceiveResponse.status === 200 && transactionReceiveResponse.data.addressList) {
            for (let receiveVal of transactionReceiveResponse.data.addressList) {
              const receiveAddress = receiveVal['address'].addr;
              const isBlacklist = receiveVal['address'].blacklistYn;
              const receiveValue = receiveVal.value;
              childAddress.push(receiveAddress);
              let addrType = 'addressNode';
              if (isBlacklist === 'Y') {
                addrType = 'blacklistNode';
              }
              addrDict[receiveAddress] = {
                id: receiveAddress,
                type: addrType,
                data: { address: receiveAddress, isRight: txDirection, motherNode: txId },
              };
              let rel = {
                id: `${txId}-${receiveAddress}`,
                source: txId,
                target: receiveAddress,
                data: { value: receiveValue },
              };

              const foundElement = edges.find((element) => element.id === rel.id);
              if (foundElement) {
                foundElement.data.value += rel.data.value;
              } else {
                edges.push(rel);
              }
            }
          }
          const uniqueChild = [...new Set(childAddress)];
          txDict[txId] = {
            id: txId,
            type: 'transactionNode',
            data: {
              txId: txId,
              isRight: txDirection,
              block: val.transaction.block,
              value: txValue,
              childNodes: uniqueChild,
              motherNode: address,
            },
          };
          const foundElement = edges.find((element) => element.id === r.id);
          if (foundElement) {
            foundElement.data.value += r.data.value;
          } else {
            edges.push(r);
          }
        }
      }
      txList = [...new Set(txList)];
      mainAddress.data.childNodes = txList;
    }
    return { mainAddress: mainAddress, txsNodes: txDict, addrNodes: addrDict, edges: edges };
  };

  const getPosition = (txsNodes, addrNodes, x = defaultX, y = defaultY) => {
    let positionDict = {};
    positionDict[x + defaultXGap] = { main: [] };
    positionDict[x + 2 * defaultXGap] = {};
    positionDict[x - defaultXGap] = { main: [] };
    positionDict[x - 2 * defaultXGap] = {};
    let nodeValues = Object.values(txsNodes);
    let addrValues = Object.values(addrNodes);
    for (let i = 0; i < nodeValues.length; i++) {
      const node = nodeValues[i];
      if (node.data.isRight) {
        positionDict[x + defaultXGap].main.push(node.id);
        positionDict[x + defaultXGap * 2][node.id] = [];
      } else {
        positionDict[x - defaultXGap].main.push(node.id);
        positionDict[x - defaultXGap * 2][node.id] = [];
      }
    }

    for (let i = 0; i < addrValues.length; i++) {
      const node = addrValues[i];
      if (node.data.isRight) {
        positionDict[x + defaultXGap * 2][node.data.motherNode].push(node.id);
      } else {
        positionDict[x - defaultXGap * 2][node.data.motherNode].push(node.id);
      }
    }

    for (const key in positionDict) {
      let totalSubKey = 0;
      for (const subKey in positionDict[key]) {
        totalSubKey += positionDict[key][subKey].length;
      }
      let initY = y - Math.floor(totalSubKey / 2) * defaultYGap;

      for (const subKey in positionDict[key]) {
        let subKeyLength = positionDict[key][subKey].length;
        if (subKeyLength > 0) {
          for (let i = 0; i < positionDict[key][subKey].length; i++) {
            let element = positionDict[key][subKey][i];

            if (Number(key) === x + 2 * defaultXGap || Number(key) === x - 2 * defaultXGap) {
              addrNodes[element]['position'] = { x: Number(key), y: initY };
              if (addrNodes[element].type === 'blacklistNode') {
                initY += 15;
              }
            } else {
              txsNodes[element]['position'] = { x: Number(key), y: initY };
            }
            initY += defaultYGap;
          }
        }
      }
    }
    return [txsNodes, addrNodes];
  };

  async function searchAddressBtnClick(searchAddress) {
    let newNodes = [];
    let newEdges = [];
    let newAddrNodesDict = {};
    let newNodesDict = {};
    if (searchAddress === '') {
      alert('주소를 입력해주세요.');
    } else {
      await getGraph(searchAddress).then((result) => {
        let mainNode = result['mainAddress'];

        mainNode.type = 'mainNode';
        mainNode.position = { x: defaultX, y: defaultY };
        let positionList = getPosition(result['txsNodes'], result['addrNodes']);
        newNodesDict = positionList[0];
        newAddrNodesDict = positionList[1];

        for (let key in newNodesDict) {
          newNodes.push(newNodesDict[key]);
        }

        for (let key in newAddrNodesDict) {
          newNodes.push(newAddrNodesDict[key]);
        }
        newEdges = result['edges'];
        newNodes.push(mainNode);
        let newNodeIdList = newNodes.map((element) => element.id);
        let newEdgeIdList = newEdges.map((element) => element.id);
        nodeIdSet = new Set(newNodeIdList);
        edgeIdSet = new Set(newEdgeIdList);
        setAddedNodes(newNodes);
        flowNodeList = newNodes;
        flowEdgeList = newEdges;
        setAddedEdges(newEdges);
      });
    }
  }

  const onNodesChange = useCallback((changes) => setAddedNodes((nds) => applyNodeChanges(changes, nds)), [setAddedNodes]);

  const onEdgesChange = useCallback((changes) => setAddedEdges((eds) => applyEdgeChanges(changes, eds)), [setAddedEdges]);

  const onClickNode = useCallback(async (event, element) => {
    // Set the clicked element in local state
    setClicked({
      clickedElement: [element],
    });
    changed = [];
    if (element.data.hasOwnProperty('isDeleteClicked')) {
      deleteNode(element);
    } else if (element.data.hasOwnProperty('isClicked')) {
      let direction = 'LEFT';
      if (element.data.isRight) {
        direction = 'RIGHT';
      }

      let result = await getGraph(element.data.address, direction);

      let mainNode = result['mainAddress'];
      let newNodesList = flowNodeList;
      const foundElement = newNodesList.find((node) => node.id === element.id);

      if (foundElement) {
        foundElement.position = element.positionAbsolute;
        foundElement.data.childNodes = mainNode.data.childNodes;
      } else {
      }
      // 조회 횟수 업뎃 필요
      let plusPositionResult = getPosition(result['txsNodes'], result['addrNodes'], element.positionAbsolute.x, element.positionAbsolute.y);

      const positionDict = { ...plusPositionResult[0], ...plusPositionResult[1] };
      // // 트리 삽입 필요
      let newNodeId = [];
      for (let key in positionDict) {
        if (!nodeIdSet.has(key)) {
          newNodesList.push(positionDict[key]);
          newNodeId.push(key);
          nodeIdSet.add(key);
        }
      }

      foundElement.childNodes = newNodeId;

      flowNodeList = newNodesList;
      setAddedNodes(newNodesList);
      for (const edge of result['edges']) {
        const edgeId = edge.id;
        if (!edgeIdSet.has(edgeId)) {
          flowEdgeList.push(edge);
          edgeIdSet.add(edgeId);
          changed.push({ item: edge, type: 'add' });
        }
      }
      let newEdgeList = [...flowEdgeList, ...changed];
      setAddedEdges(newEdgeList);
    }
  }, []);

  // 재귀 함수를 사용하여 트리에서 특정 노드와 그 아래 모든 하위 노드를 삭제
  function deleteNode(element) {
    if (element.data.hasOwnProperty('childNodes')) {
      flowNodeList.forEach((node) => {
        if (element.data.childNodes.includes(node.id)) {
          deleteNode(node);
        }
      });
      flowNodeList = flowNodeList.filter((node) => !element.data.childNodes.includes(node.id));
      setAddedNodes((nds) => nds.filter((node) => !element.data.childNodes.includes(node.id)));
    }

    flowNodeList = flowNodeList.filter((node) => node.id !== element.id);
    setAddedNodes((nds) => nds.filter((node) => node.id !== element.id));
  }

  return (
    <ReactFlow
      ref={flowRef}
      nodes={addedNodes}
      edges={addedEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
      onNodeClick={onClickNode}
    >
      <Controls style={{ position: 'absolute', bottom: 80, left: 100 }} position='bottom-center' showInteractive={false} />
      <MiniMap style={{ position: 'absolute', bottom: 0, right: 'calc( -100vw + 285px)' }} zoomable pannable />
    </ReactFlow>
  );
});

export default TransactionFlowMapTemp;
