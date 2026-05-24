# ChatbotForm Fix TODO

## Status: [ ] In Progress

1. [ ] Create ErrorBoundary.jsx and Spinner.jsx for safe rendering
2. [ ] Refactor ChatbotForm.jsx: 
   - Add ErrorBoundary wrapper
   - Lazy load heavy deps (tesseract, pdf-lib)
   - Fix useEffect deps and sequential loading
   - Fix file drop handler (use useCallback, update stylePrompt)
   - Add fallback UI for failed fetches
3. [ ] Update create/page.jsx with Suspense
4. [ ] Test: npm run dev, check form renders
5. [ ] Re-enable advanced features if stable
6. [ ] attempt_completion

**Next Step**: Implement ErrorBoundary and basic skeleton in ChatbotForm.jsx

