# X-Tracer
X-Tracer is a React-based application designed for visualizing and analyzing transaction maps. 
  * Note: This repository contains only a part of the full project and is still under active development. Future updates will expand functionality and refine the user experience.

## Features
- **Transaction Visualization:**  
  Display transaction flows and relationships in an interactive map.

- **Interactive UI:**  
  Clickable nodes to reveal detailed transaction information and analysis.

- **Real-Time Data Integration (Upcoming):**  
  Planned support for WebSocket and REST API integration for live updates.

- **Scalable Architecture:**  
  Designed to easily incorporate additional features like advanced search, filtering, and multi-source data integration.

## Development Status

- **Early Development:**  
  The project is in its early stages, and many features are still under construction.

- **Partial Implementation:**  
  This repository includes only a portion of the full React project. Expect further enhancements and additional components in future updates.

## Technology Stack

- **React:**  
  For building the user interface.

- **State Management:**  
  Zustand to handle application state (implementation TBD).

- **Data Visualization:**  
  Integration with libraries such as ReactFlow planned for sophisticated transaction mapping.

## Installation and Running

1. **Installation:** 
  Ensure your project has the required dependencies to support React and any additional libraries used by the component.

2. **Copy the Component:**  
  Copy the `TransactionMap.jsx` file (and any related hooks or style files, if applicable) into your existing React project.

3. **Import the Component:**  
  In the React file where you want to use the transaction map, import the component as follows:
  ```
  import TransactionMap from './path/to/TransactionMap';
  ```
Adjust the path as necessary.

4. **Usage:**  
You can now include the <TransactionMap /> component within your JSX code:
  ```
    function App() {
      return (
        <div>
          <h1>Transaction Map Analyzer</h1>
          <TransactionMap />
        </div>
      );
    }
  ```

## Project Structure
```
├── context/
│   ├── ExportFileContext.jsx
│   ├── SlidingPanelContext.jsx
│   ├── TransactionContext.jsx
│   └── TransactionDetailContext.jsx
├── edges/
│   └── timeValueEdge.jsx
├── nodes/
│   ├── AddressNode.jsx
│   ├── BlacklistNode.jsx
│   ├── ExchangeNode.jsx
│   ├── MainBlackNode.jsx
│   ├── MainNode.jsx
│   ├── MainWhiteNode.jsx
│   ├── TransactionNode.jsx
│   └── WhitelistNode.jsx
└── transactionFlowMap/
    ├── components/
    │   └── TransactionFlowMapTemp.jsx
    ├── ApiService.jsx
    ├── TransactionMap.jsx
    └── TransactionService.jsx
```
- context/
  Contains various context providers (e.g., ExportFileContext, SlidingPanelContext) for managing global states or configurations.

- edges/
  Includes custom edge definitions (e.g., timeValueEdge.jsx) for rendering special edges or connections in a flow or graph.

- nodes/
  Contains node components (e.g., AddressNode.jsx, BlacklistNode.jsx) used to represent different types of entities or data points in a transaction map or flow.

- transactionFlowMap/

  - components/
    Houses sub-components related to the transaction flow map (e.g., TransactionFlowMapTemp.jsx).
  - ApiService.jsx
    Manages API calls and data fetching logic for the transaction flow map.
  - TransactionMap.jsx
    Main component for rendering and orchestrating the transaction flow map visualization.
  - TransactionService.jsx
    Provides business logic or utility functions for handling transaction data.


## Future Plans
  - Enhanced Features:
    - Advanced filtering and search capabilities.
    - Detailed transaction analysis pages.
  - Performance Optimizations:
    - Improve support for large data sets.
    - Enhance rendering performance.
  - Testing:
    - Implement unit and integration tests for increased stability.
  - UI/UX Improvements:
    - Refine design and interactions based on user feedback.


## License
This project is currently an internal component for our company's React application and is under active development. No public license is provided at this time.

## Contact
If you have any questions or suggestions, please open an issue on GitHub or contact us at [jin@traverse.kr].

