# Demo Project

## ag-Grid Styling

The SearchableTable component uses ag-Grid for table functionality. ag-Grid comes with default styling, but you can customize it with CSS overrides.

### Basic ag-Grid Styling Pattern

To customize ag-Grid styling, target the `.ag-theme-alpine` class in your component's LESS/CSS file:

```less
.table-container {
  .ag-theme-alpine {
    // CSS custom properties for global theme changes
    --ag-font-size: 14px;
    --ag-header-height: 40px;
    --ag-row-height: 35px;
    --ag-border-color: #ddd;
    --ag-header-foreground-color: #333;
    --ag-header-background-color: #f8f9fa;
    
    // Component-specific styling
    .ag-header-cell-label {
      font-weight: 600;
    }
    
    .ag-cell {
      padding: 0 8px;
      display: flex;
      align-items: center;
    }
    
    // Row styling
    .ag-row {
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: #f8f9fa;
      }
      
      &.ag-row-selected {
        background-color: rgba(0, 123, 255, 0.1) !important;
      }
    }
    
    // Pagination styling
    .ag-paging-panel {
      border-top: 1px solid #ddd;
      background-color: #f8f9fa;
      padding: 8px 12px;
    }
    
    // Checkbox column styling
    .ag-cell-wrapper {
      &:has(.ag-selection-checkbox) {
        justify-content: center;
      }
    }
    
    .ag-checkbox-input-wrapper {
      border-radius: 3px;
    }
  }
}
```

### Common ag-Grid CSS Custom Properties

- `--ag-font-size`: Base font size
- `--ag-font-family`: Font family
- `--ag-row-height`: Height of data rows
- `--ag-header-height`: Height of header row
- `--ag-border-color`: Color of borders
- `--ag-header-background-color`: Header background
- `--ag-header-foreground-color`: Header text color
- `--ag-odd-row-background-color`: Zebra striping color
- `--ag-selected-row-background-color`: Selected row background

### Useful ag-Grid Class Selectors

- `.ag-row`: Individual table rows
- `.ag-cell`: Individual table cells
- `.ag-header-cell`: Header cells
- `.ag-paging-panel`: Pagination controls
- `.ag-selection-checkbox`: Checkboxes for row selection
- `.ag-row-selected`: Selected rows
- `.ag-row-hover`: Hovered rows

For more styling options, see the [ag-Grid Theme Customization docs](https://www.ag-grid.com/javascript-data-grid/themes-customising/).