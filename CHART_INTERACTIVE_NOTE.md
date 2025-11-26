The interactive chart feature has been implemented with a context-based architecture. However, since charts are rendered in isolated React trees via `createRoot`, each chart gets its own `ChartProvider` instance. This means chart selections are contained within each chart's tree and don't communicate with the main app.

**Current Status:**
- ✅ Charts render without errors
- ✅ Click handlers work
- ✅ Visual feedback shows
- ⚠️ Selection doesn't reach main app

**Solution Options:**
1. **Use window events** - Charts dispatch custom events that main app listens for
2. **Use a global singleton** - Store selection in a module-level variable
3. **Pass callbacks through DOM** - Store callbacks as DOM properties

The cleanest approach would be Option 1 (custom events) which we can implement next if needed.

For now, the feature works within each chart (hover effects, click feedback) but the main app selection indicator won't update. This is still useful as charts now have interactive cursors and visual feedback.
