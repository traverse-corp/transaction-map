import React from 'react';


import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath
} from 'reactflow';
const Decimal = require('decimal.js');

export default function TimeValueEdge({
                                          id,
                                          sourceX,
                                          sourceY,
                                          targetX,
                                          targetY,
                                          sourcePosition,
                                          targetPosition,
                                          style = {},
                                          markerEnd,
                                          data
                                      }) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const date = new Date(data.time*1000);

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 8,
                        // everything inside EdgeLabelRenderer has no pointer events by default
                        // if you have an interactive element, set pointer-events: all
                        pointerEvents: 'all',
                        alignItems:"center",
                        flexDirection:"column",
                        display:"flex"

                    }}
                    className="nodrag nopan"
                >
                    <div className="time" style={{marginBottom:"2px",
                        background:"#f8f9fc"}}>{
                        date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' +
                        date.getUTCDate() + ' ' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' +
                        date.getUTCSeconds()+ ' (UTC)'}</div>
                    <div className="value" style={{textAlign:"center",
                        background:"#f8f9fc", width:"auto", display:"inline-block"}}>
                        {data.token === 'BTC' && Decimal(data.value).toFixed(5)}
                        {data.token === 'ETH' && (Decimal(data.value)/ 1000000000000000000).toFixed(5)}
                        {data.token === 'erc' && (Decimal(data.value)/100000).toFixed(5)}
                        {data.token === 'TRX' && (Decimal(data.value)/ 1000000).toFixed(5)}
                        {data.token === 'XRP' && (Decimal(data.value)/1000000).toFixed(5)}
                        &nbsp;
                        {data.token ==='erc' ? 'USDT' : data.token}
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
