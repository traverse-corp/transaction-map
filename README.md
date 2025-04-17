# X-Tracer: Transaction Map Visualization

X-Tracer is a React-based application designed for visualizing and analyzing cryptocurrency transaction flows. This document specifically covers the `transactionMap` feature module.


**Note:** This project is under active development. Future updates will expand functionality and refine the user experience.

## Features

* **Transaction Map Visualization:** Displays complex transaction flows and address relationships in a dynamic graph format.
* **Network Support:** Supports transaction lookups for Bitcoin (BTC) and major altcoins (ETH, XRP, TRX, etc.), handling network-specific data structures.
* **Interactive UI:**
    * **Node Click/Expansion:** Click nodes to view detailed information and expand connections to explore further transactions.
    * **Drag & Drop, Pan & Zoom:** Allows users to freely manipulate the graph layout.
    * **Tab-Based Interface:** Enables analysis of multiple addresses or transactions simultaneously.
* **Custom Nodes/Edges:** Utilizes distinct node styles based on data type (Address, Transaction, Whitelist, etc.) and displays transaction value/time information on edges.
* **Undo/Redo:** Supports undoing and redoing major user actions like node addition, deletion, and position changes (`Ctrl+Z` / `Ctrl+Shift+Z`).
* **Detail Panel:** Provides a sliding panel to show detailed information when a node or transaction is clicked.
* **Real-Time Data Integration:** Support for REST API integration for live updates.
* **(Upcoming) Advanced Features:** Planned additions include advanced search, filtering, and data export capabilities.

## Technology Stack

* **React:** For building the user interface.
* **Zustand:** For managing UI, Search, and Map state (nodes, edges, history, etc.).
* **Immer:** Used with Zustand to simplify immutable state updates.
* **React Flow:** Core data visualization library for rendering and interacting with the node-based graph.
* **Tanstack Query (React Query):** Handles server data fetching, caching, and state synchronization.
* **Tailwind CSS:** Utility-first framework for UI styling.
* **Vite:** Frontend build tool.

## Project Structure (`transactionMap` feature)
  ```bash
  transactionMap/
  ├── apis/
  │   └── api.js          # Manages API calls and data fetching logic.
  ├── components/
  │   ├── customEdges/
  │   │   └── TimeValueEdge.jsx # Custom edge component for displaying time/value.
  │   ├── customNodes/
  │   │   ├── AddressNode.jsx  # Component for standard address nodes.
  │   │   ├── NodeBase.jsx     # Base component providing common node layout/features.
  │   │   ├── TransactionNode.jsx # Component for transaction nodes.
  │   │   └── WhiteAddressNode.jsx # Component for whitelisted address nodes.
  │   ├── SearchBar.jsx      # Component for searching addresses/transactions and selecting networks.
  │   ├── SlidingPanel.jsx   # Component for displaying details (address/transaction).
  │   ├── TapHeader.jsx      # Component for managing multiple graph tabs.
  │   ├── ToolBar.jsx        # Component for graph interaction tools (zoom, etc.).
  │   └── TransactionMap.jsx # Main component orchestrating the React Flow canvas.
  ├── config/
  │   ├── constants.js       # Shared constant values (layout, types, etc.).
  │   └── networkConfig.js   # Configuration for different blockchain networks (API functions, processing logic mapping).
  ├── hooks/
  │   ├── useAddNode.js      # Hook for adding single nodes dynamically.
  │   └── useExpandGraph.js  # Hook handling the graph expansion logic (fetching, processing, positioning).
  ├── services/
  │   └── graphService.js    # Contains business logic for processing graph data (BTC/Non-BTC/Denylist differentiation).
  ├── stores/
  │   ├── useMapStore.js     # Zustand store for map state (nodes, edges, history, occupied positions).
  │   ├── useSearchStore.js  # Zustand store for search parameters and history.
  │   └── useUIStore.js      # Zustand store for UI state (e.g., side panel).
  └── utils/
  ├── ├── dateUtils.js       # Utility functions for date/time formatting.
  ├── ├── graphUtils.js      # Utility functions for creating graph nodes/edges.
  ├── ├── positionUtils.js   # Utility functions for calculating node positions.
  └── ├── valueFormatter.js  # Utility functions for formatting token values.
  ```
## Installation and Running

### Installation: 
* Ensure your project has the required dependencies to support React and any additional libraries used by the component.

### Copy the Component:
* Copy the TransactionMapPage component (and any related hooks or style files, if applicable) into your existing React project.

### Import the Component:
* In the React file where you want to use the transaction map, import the component as follows:

## Usage

After launching the application, use the search bar at the top to enter a cryptocurrency address or transaction hash you wish to analyze. Select the corresponding network (BTC, XRP, etc.) and click the search button. The results will be visualized as an interactive transaction map in a new tab.

* **Node Expansion:** Hover over an address node to reveal expansion buttons (left/right arrows). Click these to explore connected transactions.
* **Detailed Information:** Click on any node to open a side panel displaying its detailed information.
* **Map Interaction:** Use the mouse wheel to zoom in/out and drag the canvas to pan the map.
* **Undo/Redo:** Use keyboard shortcuts `Ctrl+Z` / `Ctrl+Shift+Z` (or `Cmd+Z` / `Cmd+Shift+Z` on Mac) to undo or redo your actions.

## Future Plans

* Enhance advanced filtering and search capabilities.
* Develop detailed transaction analysis pages/views.
* Optimize rendering performance and support for large datasets.
* Implement comprehensive unit and integration tests for increased stability.
* Refine UI design and interactions based on user feedback.

## License

This project is currently an internal component and is under active development. No public license is provided at this time.

## Contact

If you have any questions or suggestions, please open an issue on GitHub or contact us at [jin@traverse.kr].
