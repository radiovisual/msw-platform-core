# Popup Window MockUI Approach

This branch demonstrates an alternative approach to solve z-index stacking context issues by opening MockUI in a separate popup window.

## The Problem

Even with maximum z-index values (`2147483647`), MockUI can still be hidden behind other elements due to CSS stacking context isolation. This happens when:

- Parent components use `transform`, `opacity < 1`, `filter`, etc.
- The page has complex stacking contexts
- Third-party libraries create their own stacking contexts

## The Solution: Popup Windows

Instead of fighting stacking contexts, we open MockUI in a completely separate browser window that has its own document context.

## Implementation

### 1. Simple Popup (`PopupMockUI`)

Basic HTML rendering with essential functionality:

```tsx
import { PopupMockUI } from 'msw-platform-core';

function App() {
  return (
    <>
      {/* Your app */}
      <PopupMockUI platform={platform} />
    </>
  );
}
```

**Features:**
- Basic endpoint toggling
- Simple HTML interface
- Keyboard shortcuts (Ctrl+M, Escape)
- Minimal overhead

### 2. Advanced Popup (`PopupMockUIAdvanced`)

Styled interface with more features:

```tsx
import { PopupMockUIAdvanced } from 'msw-platform-core';

function App() {
  return (
    <>
      {/* Your app */}
      <PopupMockUIAdvanced platform={platform} />
    </>
  );
}
```

**Features:**
- Tabbed interface (Endpoints, Feature Flags, Settings)
- Better styling and UX
- Real-time state synchronization
- Feature flag toggles
- Platform status information

## Benefits

✅ **No Z-Index Issues**: Runs in separate window context  
✅ **More Screen Space**: Can be larger than modal overlays  
✅ **Persistent**: Stays open while working in main app  
✅ **Keyboard Shortcuts**: Ctrl+M toggles, Escape closes  
✅ **Simple Implementation**: No complex portal or extension setup  
✅ **Real-time Updates**: Changes sync between popup and main app  

## Considerations

⚠️ **Popup Blockers**: Users may need to allow popups for your domain  
⚠️ **Window Management**: Additional window to manage  
⚠️ **React Rendering**: Complex to render full React components in popup  
⚠️ **Browser Focus**: User needs to switch between windows  

## Usage

1. **Import** the component you prefer
2. **Add** it to your app (typically replaces regular MockUI)
3. **Click** the floating button or press **Ctrl+M** to open popup
4. **Use** MockUI in the popup window
5. **Close** with the close button, **Ctrl+M**, or **Escape**

## Keyboard Shortcuts

- **Ctrl+M**: Toggle popup window open/close
- **Escape**: Close popup window (when popup has focus)

## Demo

Run Storybook to see the popup approach in action:

```bash
npm run storybook
```

Navigate to "MockUI/Popup Window Approach" to see:
- Basic popup demo
- Advanced popup demo  
- Comparison with high z-index scenarios

## When to Use

**Use Popup Approach When:**
- Standard MockUI is hidden by page elements
- Z-index solutions don't work
- You need more screen real estate
- Users are comfortable with popup windows

**Use Standard MockUI When:**
- No z-index issues
- Prefer integrated experience
- Popup blockers are a concern
- Mobile/touch devices (less popup-friendly)

## Future Enhancements

Possible improvements to the popup approach:

1. **Full React Rendering**: Use iframe or advanced techniques to render complete React components
2. **Window Positioning**: Remember window position and size
3. **Drag & Drop**: Allow dragging content between windows
4. **Multi-Monitor**: Smart positioning for multi-monitor setups
5. **Theme Sync**: Sync theme/styling with parent window

## Technical Notes

The popup approach works by:

1. Creating a new `Window` object with `window.open()`
2. Injecting HTML, CSS, and JavaScript into the popup
3. Setting up communication bridge between parent and popup
4. Monitoring popup state and handling cleanup
5. Synchronizing platform state changes in real-time

The implementation is designed to be lightweight and doesn't require additional dependencies beyond what MockUI already uses.