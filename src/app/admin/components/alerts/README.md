# Alerts Component Refactoring

This folder contains the refactored Alerts component, broken down into smaller, more maintainable pieces.

## File Structure

```
alerts/
├── README.md                 # This documentation
├── index.ts                  # Barrel export file
├── types.ts                  # TypeScript interfaces and types
├── useAlerts.ts             # Custom hook for alert data management
├── alertUtils.ts            # Utility functions for alert operations
├── AlertStats.tsx           # Statistics cards component
├── AlertFilters.tsx         # Search and filter controls component
├── AlertTable.tsx           # Main alerts table with expandable rows
└── AlertDetails.tsx         # Detailed alert view component
```

## Components

### AlertStats.tsx
- Displays alert statistics in card format
- Shows high priority, satellite, community, and new alert counts
- Handles loading states

### AlertFilters.tsx
- Search functionality across alert descriptions, locations, and IDs
- Filter by source type (All, Satellite, Community, System)
- Refresh button with loading states
- Live counts in filter options

### AlertTable.tsx
- Main table displaying all alerts
- Expandable rows for detailed view
- Sortable columns and action buttons
- Integrates with AlertDetails for expanded view

### AlertDetails.tsx
- Detailed alert information panel
- Displays satellite images when available
- Quick action buttons (Export PDF, Take Action)
- Coordinates and analysis data

## Hooks

### useAlerts.ts
- Custom hook for fetching and managing alert data
- Handles real-time updates from Supabase
- Manages loading, error, and refresh states
- Transforms data from multiple sources (satellite, community, system)

## Utilities

### alertUtils.ts
- PDF export functionality
- Navigation helpers for taking action
- Alert filtering logic
- Color utility functions for status/priority badges

## Types

### types.ts
- AlertsProps interface
- Alert interface with all properties
- AlertStats interface for statistics

## Usage

The main `Alerts.tsx` component now imports and uses these smaller components:

```tsx
import AlertStats from './alerts/AlertStats';
import AlertFilters from './alerts/AlertFilters';
import AlertTable from './alerts/AlertTable';
import { useAlerts } from './alerts/useAlerts';
import { filterAlerts, handleExportPDF, handleTakeAction } from './alerts/alertUtils';
```

## Benefits

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Maintainability**: Easier to debug and modify specific functionality
4. **Testing**: Individual components can be tested in isolation
5. **Code Organization**: Cleaner, more readable codebase
6. **Type Safety**: Centralized type definitions

## Data Flow

1. `useAlerts` hook fetches data from Supabase
2. Data is transformed and filtered using `alertUtils`
3. Components receive props and render UI
4. User interactions trigger callbacks that update state
5. Real-time updates refresh the data automatically
