export type Theme = 'dark' | 'light';

export interface ThemeClasses {
  // Core
  pageBg: string;
  pageText: string;
  selection: string;
  // Header
  headerBg: string;
  // Stats bar
  statsLabelText: string;
  statsValueText: string;
  statsDividerBg: string;
  // Search form wrapper
  searchFormBg: string;
  searchFormBorder: string;
  searchFormFocusRing: string;
  searchDividerBorder: string;
  // Type toggle
  toggleContainerBg: string;
  toggleContainerBorder: string;
  toggleActive: string;
  toggleInactive: string;
  toggleHintText: string;
  // Input text inside search form
  inputText: string;
  inputPlaceholder: string;
  // Submit (CTA) button
  ctaBg: string;
  ctaText: string;
  ctaBgHover: string;
  ctaSpinner: string;
  // Filter toggle button
  filterToggleActive: string;
  filterToggleClosed: string;
  // Results toolbar
  resultsCountText: string;
  sortLabelText: string;
  sortBg: string;
  sortText: string;
  sortBorder: string;
  sortHoverBorder: string;
  sortFocusBorder: string;
  // Empty state
  emptyIconBg: string;
  emptyIconColor: string;
  emptyTitleText: string;
  emptyDescText: string;
  // Pagination
  paginBtnBg: string;
  paginBtnBorder: string;
  paginBtnText: string;
  paginBtnHover: string;
  paginCurrentText: string;
  paginDividerText: string;
  // SEO & Footer (hidden in embed, but defined for completeness)
  seoBg: string;
  seoBorderTop: string;
  seoH1Text: string;
  seoBodyText: string;
  seoStrongText: string;
  footerBg: string;
  footerBorderTop: string;
  footerText: string;
  // Filter panel
  filterPanelBg: string;
  filterPanelBorder: string;
  filterInfoSemBg: string;
  filterInfoSemBorder: string;
  filterInfoSemAccent: string;
  filterInfoSemText: string;
  filterInfoClsBg: string;
  filterInfoClsBorder: string;
  filterInfoClsLabel: string;
  filterInfoClsText: string;
  filterFieldLabel: string;
  filterInputBg: string;
  filterInputText: string;
  filterInputPlaceholder: string;
  filterInputBorder: string;
  filterInputFocusBorder: string;
  filterInputFocusRing: string;
  filterCheckboxBorder: string;
  filterCheckboxBg: string;
  filterCheckboxChecked: string;
  filterCheckboxLabel: string;
  filterHoverBg: string;
  filterBorderTop: string;
  filterResetText: string;
  filterResetHover: string;
  // Searchable select dropdown
  selectTriggerBg: string;
  selectTriggerBorderNormal: string;
  selectTriggerBorderOpen: string;
  selectTriggerRingOpen: string;
  selectTriggerValueText: string;
  selectTriggerPlaceholderText: string;
  selectDropdownBg: string;
  selectDropdownBorder: string;
  selectSearchInputBg: string;
  selectSearchInputBorder: string;
  selectSearchText: string;
  selectSearchPlaceholder: string;
  selectSearchFocusBorder: string;
  selectItemAllActive: string;
  selectItemAllInactive: string;
  selectItemSelected: string;
  selectItemNormal: string;
  selectItemNotFound: string;
  // ResultCard
  cardBg: string;
  cardBgHover: string;
  cardBorder: string;
  cardShadowHover: string;
  cardCourtText: string;
  cardCaseText: string;
  cardCaseHover: string;
  cardDateBg: string;
  cardDateText: string;
  cardTagResultBg: string;
  cardTagResultText: string;
  cardTagJudgeBg: string;
  cardTagJudgeText: string;
  cardTagJudgeBorder: string;
  cardSnippetText: string;
  cardScoreText: string;
  cardFooterBorder: string;
  cardFooterLinkText: string;
  highlightBg: string;
  highlightText: string;
  // Modal
  modalOverlay: string;
  modalBg: string;
  modalBorder: string;
  modalHeaderBg: string;
  modalHeaderBorder: string;
  modalBadgeBg: string;
  modalBadgeText: string;
  modalDateText: string;
  modalCaseText: string;
  modalCourtText: string;
  modalCloseBtn: string;
  modalCloseBtnHover: string;
  modalSidesBg: string;
  modalSidesBorder: string;
  modalSidesLabel: string;
  modalSidesValue: string;
  modalSidesLoading: string;
  modalBodyText: string;
  modalBodyProse: string;
  modalFooterBg: string;
  modalFooterBorder: string;
  modalOriginalLink: string;
  modalOriginalLinkHover: string;
  // AI Analysis
  aiSectionBg: string;
  aiSectionBorder: string;
  aiIconText: string;
  aiTitle: string;
  aiLoadingText: string;
  aiProgressTrack: string;
  aiProgressFill: string;
  aiProgressLabel: string;
  aiSummaryBg: string;
  aiSummaryBorder: string;
  aiSummaryLabel: string;
  aiSummaryText: string;
  aiArgsBg: string;
  aiArgsBorder: string;
  aiArgsLabel: string;
  aiArgsText: string;
  aiRetryBg: string;
  aiRetryHover: string;
  aiActionBg: string;
  aiActionHover: string;
  aiActionDisabled: string;
  aiActionText: string;
}

const dark: ThemeClasses = {
  pageBg: 'bg-black',
  pageText: 'text-[#f5f5f7]',
  selection: 'selection:bg-[#0A84FF] selection:text-white',
  headerBg: 'bg-black/80 backdrop-blur-xl border-b border-white/10',
  statsLabelText: 'text-[#86868b]',
  statsValueText: 'text-white',
  statsDividerBg: 'bg-white/10',
  searchFormBg: 'bg-[#1c1c1e]',
  searchFormBorder: 'border-white/5',
  searchFormFocusRing: 'focus-within:ring-2 focus-within:ring-[#0A84FF]/50 focus-within:border-[#0A84FF]/50',
  searchDividerBorder: 'border-white/5',
  toggleContainerBg: 'bg-[#1c1c1e]',
  toggleContainerBorder: 'border-white/5',
  toggleActive: 'bg-[#0A84FF] text-white shadow-lg shadow-blue-500/20',
  toggleInactive: 'text-[#86868b] hover:text-white',
  toggleHintText: 'text-[#86868b]',
  inputText: 'text-white',
  inputPlaceholder: 'placeholder-[#6e6e73]',
  ctaBg: 'bg-white',
  ctaText: 'text-black',
  ctaBgHover: 'hover:bg-[#f5f5f7]',
  ctaSpinner: 'border-black/30 border-t-black',
  filterToggleActive: 'bg-white/10 text-white',
  filterToggleClosed: 'text-[#86868b] hover:text-white',
  resultsCountText: 'text-[#86868b]',
  sortLabelText: 'text-[#6e6e73]',
  sortBg: 'bg-[#1c1c1e]',
  sortText: 'text-white',
  sortBorder: 'border-white/10',
  sortHoverBorder: 'hover:border-[#0A84FF]/50',
  sortFocusBorder: 'focus:border-[#0A84FF]',
  emptyIconBg: 'bg-[#1c1c1e]',
  emptyIconColor: 'text-[#86868b]',
  emptyTitleText: 'text-white',
  emptyDescText: 'text-[#86868b]',
  paginBtnBg: 'bg-[#1c1c1e]',
  paginBtnBorder: 'border-white/10',
  paginBtnText: 'text-white',
  paginBtnHover: 'hover:bg-[#2c2c2e]',
  paginCurrentText: 'text-[#86868b]',
  paginDividerText: 'text-[#424245]',
  seoBg: 'bg-black',
  seoBorderTop: 'border-white/5',
  seoH1Text: 'text-white',
  seoBodyText: 'text-[#86868b]',
  seoStrongText: 'text-white',
  footerBg: 'bg-black',
  footerBorderTop: 'border-white/5',
  footerText: 'text-[#424245]',
  filterPanelBg: 'bg-[#1c1c1e]',
  filterPanelBorder: 'border-white/5',
  filterInfoSemBg: 'bg-[#0A84FF]/10',
  filterInfoSemBorder: 'border-[#0A84FF]/20',
  filterInfoSemAccent: 'text-[#0A84FF]',
  filterInfoSemText: 'text-[#86868b]',
  filterInfoClsBg: 'bg-white/5',
  filterInfoClsBorder: 'border-white/10',
  filterInfoClsLabel: 'text-white',
  filterInfoClsText: 'text-[#86868b]',
  filterFieldLabel: 'text-[#86868b]',
  filterInputBg: 'bg-black/30',
  filterInputText: 'text-white',
  filterInputPlaceholder: 'placeholder-[#424245]',
  filterInputBorder: 'border-white/10',
  filterInputFocusBorder: 'focus:border-[#0A84FF]',
  filterInputFocusRing: 'focus:ring-1 focus:ring-[#0A84FF]',
  filterCheckboxBorder: 'border-white/20',
  filterCheckboxBg: 'bg-black/30',
  filterCheckboxChecked: 'checked:bg-[#0A84FF] checked:border-[#0A84FF]',
  filterCheckboxLabel: 'text-[#d1d1d6]',
  filterHoverBg: 'hover:bg-white/5',
  filterBorderTop: 'border-white/5',
  filterResetText: 'text-[#86868b]',
  filterResetHover: 'hover:text-white',
  selectTriggerBg: 'bg-black/30',
  selectTriggerBorderNormal: 'border-white/10 hover:border-white/20',
  selectTriggerBorderOpen: 'border-[#0A84FF]',
  selectTriggerRingOpen: 'ring-1 ring-[#0A84FF]',
  selectTriggerValueText: 'text-white',
  selectTriggerPlaceholderText: 'text-[#6e6e73]',
  selectDropdownBg: 'bg-[#2c2c2e]',
  selectDropdownBorder: 'border-white/10',
  selectSearchInputBg: 'bg-black/40',
  selectSearchInputBorder: 'border-white/10',
  selectSearchText: 'text-white',
  selectSearchPlaceholder: 'placeholder-[#424245]',
  selectSearchFocusBorder: 'focus:border-[#0A84FF]',
  selectItemAllActive: 'text-white bg-white/5',
  selectItemAllInactive: 'text-[#86868b] hover:bg-white/5 hover:text-white',
  selectItemSelected: 'text-[#0A84FF] bg-[#0A84FF]/10',
  selectItemNormal: 'text-white hover:bg-white/5',
  selectItemNotFound: 'text-[#424245]',
  cardBg: 'bg-[#1c1c1e]',
  cardBgHover: 'hover:bg-[#2c2c2e]',
  cardBorder: 'border-white/5',
  cardShadowHover: 'hover:shadow-2xl hover:shadow-black/50',
  cardCourtText: 'text-[#86868b]',
  cardCaseText: 'text-white',
  cardCaseHover: 'group-hover:text-[#0A84FF]',
  cardDateBg: 'bg-white/5',
  cardDateText: 'text-[#6e6e73]',
  cardTagResultBg: 'bg-[#0A84FF]/10',
  cardTagResultText: 'text-[#0A84FF]',
  cardTagJudgeBg: 'bg-white/5',
  cardTagJudgeText: 'text-[#86868b]',
  cardTagJudgeBorder: 'border-white/5',
  cardSnippetText: 'text-[#a1a1a6]',
  cardScoreText: 'text-[#6e6e73]',
  cardFooterBorder: 'border-white/5',
  cardFooterLinkText: 'text-[#0A84FF]',
  highlightBg: 'bg-[#0A84FF]/10',
  highlightText: 'text-[#0A84FF]',
  modalOverlay: 'bg-black/60 backdrop-blur-md',
  modalBg: 'bg-[#1c1c1e]',
  modalBorder: 'border-white/10',
  modalHeaderBg: 'bg-[#1c1c1e]/80 backdrop-blur-xl',
  modalHeaderBorder: 'border-white/5',
  modalBadgeBg: 'bg-[#0A84FF]',
  modalBadgeText: 'text-white',
  modalDateText: 'text-[#86868b]',
  modalCaseText: 'text-white',
  modalCourtText: 'text-[#a1a1a6]',
  modalCloseBtn: 'bg-white/5 text-[#86868b]',
  modalCloseBtnHover: 'hover:bg-white/10 hover:text-white',
  modalSidesBg: 'bg-black/20',
  modalSidesBorder: 'border-white/5',
  modalSidesLabel: 'text-[#86868b]',
  modalSidesValue: 'text-white',
  modalSidesLoading: 'text-[#86868b]',
  modalBodyText: 'text-[#d1d1d6]',
  modalBodyProse: 'prose-invert',
  modalFooterBg: 'bg-[#1c1c1e]/90 backdrop-blur-md',
  modalFooterBorder: 'border-white/5',
  modalOriginalLink: 'text-[#86868b]',
  modalOriginalLinkHover: 'hover:text-white',
  aiSectionBg: 'bg-black/30',
  aiSectionBorder: 'border-[#0A84FF]/20',
  aiIconText: 'text-[#0A84FF]',
  aiTitle: 'text-white',
  aiLoadingText: 'text-[#86868b]',
  aiProgressTrack: 'text-[#0A84FF]/20',
  aiProgressFill: 'text-[#0A84FF]',
  aiProgressLabel: 'text-white',
  aiSummaryBg: 'bg-[#0A84FF]/10',
  aiSummaryBorder: 'border-[#0A84FF]/30',
  aiSummaryLabel: 'text-[#0A84FF]',
  aiSummaryText: 'text-white',
  aiArgsBg: 'bg-white/5',
  aiArgsBorder: 'border-white/10',
  aiArgsLabel: 'text-[#86868b]',
  aiArgsText: 'text-[#d1d1d6]',
  aiRetryBg: 'bg-[#0A84FF]',
  aiRetryHover: 'hover:bg-[#0071e3]',
  aiActionBg: 'bg-[#0A84FF]',
  aiActionHover: 'hover:bg-[#0071e3]',
  aiActionDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  aiActionText: 'text-white',
};

const light: ThemeClasses = {
  pageBg: 'bg-[#f9f9fb]',
  pageText: 'text-[#1d1d1f]',
  selection: 'selection:bg-[#b4394e] selection:text-white',
  headerBg: 'bg-white/90 backdrop-blur-xl border-b border-black/[0.08]',
  statsLabelText: 'text-[#6e6e73]',
  statsValueText: 'text-[#1d1d1f]',
  statsDividerBg: 'bg-black/[0.10]',
  searchFormBg: 'bg-white',
  searchFormBorder: 'border-black/[0.08]',
  searchFormFocusRing: 'focus-within:ring-2 focus-within:ring-[#b4394e]/40 focus-within:border-[#b4394e]/50',
  searchDividerBorder: 'border-black/[0.07]',
  toggleContainerBg: 'bg-[#f2f2f7]',
  toggleContainerBorder: 'border-black/[0.06]',
  toggleActive: 'bg-[#b4394e] text-white shadow-lg shadow-[#b4394e]/20',
  toggleInactive: 'text-[#6e6e73] hover:text-[#1d1d1f]',
  toggleHintText: 'text-[#6e6e73]',
  inputText: 'text-[#1d1d1f]',
  inputPlaceholder: 'placeholder-[#8e8e93]',
  ctaBg: 'bg-[#b4394e]',
  ctaText: 'text-white',
  ctaBgHover: 'hover:bg-[#9b2f42]',
  ctaSpinner: 'border-white/30 border-t-white',
  filterToggleActive: 'bg-black/[0.08] text-[#1d1d1f]',
  filterToggleClosed: 'text-[#6e6e73] hover:text-[#1d1d1f]',
  resultsCountText: 'text-[#6e6e73]',
  sortLabelText: 'text-[#8e8e93]',
  sortBg: 'bg-white',
  sortText: 'text-[#1d1d1f]',
  sortBorder: 'border-black/[0.10]',
  sortHoverBorder: 'hover:border-[#b4394e]/50',
  sortFocusBorder: 'focus:border-[#b4394e]',
  emptyIconBg: 'bg-white',
  emptyIconColor: 'text-[#8e8e93]',
  emptyTitleText: 'text-[#1d1d1f]',
  emptyDescText: 'text-[#6e6e73]',
  paginBtnBg: 'bg-white',
  paginBtnBorder: 'border-black/[0.10]',
  paginBtnText: 'text-[#1d1d1f]',
  paginBtnHover: 'hover:bg-[#f5f5f7]',
  paginCurrentText: 'text-[#6e6e73]',
  paginDividerText: 'text-[#aeaeb2]',
  seoBg: 'bg-[#f9f9fb]',
  seoBorderTop: 'border-black/[0.06]',
  seoH1Text: 'text-[#1d1d1f]',
  seoBodyText: 'text-[#6e6e73]',
  seoStrongText: 'text-[#1d1d1f]',
  footerBg: 'bg-white',
  footerBorderTop: 'border-black/[0.06]',
  footerText: 'text-[#aeaeb2]',
  filterPanelBg: 'bg-white',
  filterPanelBorder: 'border-black/[0.08]',
  filterInfoSemBg: 'bg-[#b4394e]/10',
  filterInfoSemBorder: 'border-[#b4394e]/20',
  filterInfoSemAccent: 'text-[#b4394e]',
  filterInfoSemText: 'text-[#6e6e73]',
  filterInfoClsBg: 'bg-black/[0.04]',
  filterInfoClsBorder: 'border-black/[0.08]',
  filterInfoClsLabel: 'text-[#1d1d1f]',
  filterInfoClsText: 'text-[#6e6e73]',
  filterFieldLabel: 'text-[#6e6e73]',
  filterInputBg: 'bg-[#f5f5f7]',
  filterInputText: 'text-[#1d1d1f]',
  filterInputPlaceholder: 'placeholder-[#8e8e93]',
  filterInputBorder: 'border-black/[0.10]',
  filterInputFocusBorder: 'focus:border-[#b4394e]',
  filterInputFocusRing: 'focus:ring-1 focus:ring-[#b4394e]',
  filterCheckboxBorder: 'border-black/[0.20]',
  filterCheckboxBg: 'bg-[#f5f5f7]',
  filterCheckboxChecked: 'checked:bg-[#b4394e] checked:border-[#b4394e]',
  filterCheckboxLabel: 'text-[#3d3d3f]',
  filterHoverBg: 'hover:bg-black/[0.04]',
  filterBorderTop: 'border-black/[0.08]',
  filterResetText: 'text-[#6e6e73]',
  filterResetHover: 'hover:text-[#1d1d1f]',
  selectTriggerBg: 'bg-[#f5f5f7]',
  selectTriggerBorderNormal: 'border-black/[0.10] hover:border-black/[0.20]',
  selectTriggerBorderOpen: 'border-[#b4394e]',
  selectTriggerRingOpen: 'ring-1 ring-[#b4394e]',
  selectTriggerValueText: 'text-[#1d1d1f]',
  selectTriggerPlaceholderText: 'text-[#8e8e93]',
  selectDropdownBg: 'bg-white',
  selectDropdownBorder: 'border-black/[0.10]',
  selectSearchInputBg: 'bg-[#f5f5f7]',
  selectSearchInputBorder: 'border-black/[0.10]',
  selectSearchText: 'text-[#1d1d1f]',
  selectSearchPlaceholder: 'placeholder-[#8e8e93]',
  selectSearchFocusBorder: 'focus:border-[#b4394e]',
  selectItemAllActive: 'text-[#1d1d1f] bg-black/[0.05]',
  selectItemAllInactive: 'text-[#6e6e73] hover:bg-black/[0.04] hover:text-[#1d1d1f]',
  selectItemSelected: 'text-[#b4394e] bg-[#b4394e]/10',
  selectItemNormal: 'text-[#1d1d1f] hover:bg-black/[0.04]',
  selectItemNotFound: 'text-[#aeaeb2]',
  cardBg: 'bg-white',
  cardBgHover: 'hover:bg-[#f5f5f7]',
  cardBorder: 'border-black/[0.07]',
  cardShadowHover: 'hover:shadow-xl hover:shadow-black/[0.08]',
  cardCourtText: 'text-[#6e6e73]',
  cardCaseText: 'text-[#1d1d1f]',
  cardCaseHover: 'group-hover:text-[#b4394e]',
  cardDateBg: 'bg-black/[0.05]',
  cardDateText: 'text-[#8e8e93]',
  cardTagResultBg: 'bg-[#b4394e]/10',
  cardTagResultText: 'text-[#b4394e]',
  cardTagJudgeBg: 'bg-black/[0.05]',
  cardTagJudgeText: 'text-[#6e6e73]',
  cardTagJudgeBorder: 'border-black/[0.07]',
  cardSnippetText: 'text-[#3d3d3f]',
  cardScoreText: 'text-[#8e8e93]',
  cardFooterBorder: 'border-black/[0.07]',
  cardFooterLinkText: 'text-[#b4394e]',
  highlightBg: 'bg-[#b4394e]/10',
  highlightText: 'text-[#b4394e]',
  modalOverlay: 'bg-black/40 backdrop-blur-md',
  modalBg: 'bg-white',
  modalBorder: 'border-black/[0.10]',
  modalHeaderBg: 'bg-white/90 backdrop-blur-xl',
  modalHeaderBorder: 'border-black/[0.08]',
  modalBadgeBg: 'bg-[#b4394e]',
  modalBadgeText: 'text-white',
  modalDateText: 'text-[#6e6e73]',
  modalCaseText: 'text-[#1d1d1f]',
  modalCourtText: 'text-[#6e6e73]',
  modalCloseBtn: 'bg-black/[0.05] text-[#6e6e73]',
  modalCloseBtnHover: 'hover:bg-black/[0.10] hover:text-[#1d1d1f]',
  modalSidesBg: 'bg-black/[0.04]',
  modalSidesBorder: 'border-black/[0.08]',
  modalSidesLabel: 'text-[#6e6e73]',
  modalSidesValue: 'text-[#1d1d1f]',
  modalSidesLoading: 'text-[#6e6e73]',
  modalBodyText: 'text-[#3d3d3f]',
  modalBodyProse: 'prose-stone',
  modalFooterBg: 'bg-white/90 backdrop-blur-md',
  modalFooterBorder: 'border-black/[0.08]',
  modalOriginalLink: 'text-[#6e6e73]',
  modalOriginalLinkHover: 'hover:text-[#1d1d1f]',
  aiSectionBg: 'bg-black/[0.04]',
  aiSectionBorder: 'border-[#b4394e]/20',
  aiIconText: 'text-[#b4394e]',
  aiTitle: 'text-[#1d1d1f]',
  aiLoadingText: 'text-[#6e6e73]',
  aiProgressTrack: 'text-[#b4394e]/20',
  aiProgressFill: 'text-[#b4394e]',
  aiProgressLabel: 'text-[#1d1d1f]',
  aiSummaryBg: 'bg-[#b4394e]/10',
  aiSummaryBorder: 'border-[#b4394e]/30',
  aiSummaryLabel: 'text-[#b4394e]',
  aiSummaryText: 'text-[#1d1d1f]',
  aiArgsBg: 'bg-black/[0.04]',
  aiArgsBorder: 'border-black/[0.08]',
  aiArgsLabel: 'text-[#6e6e73]',
  aiArgsText: 'text-[#3d3d3f]',
  aiRetryBg: 'bg-[#b4394e]',
  aiRetryHover: 'hover:bg-[#9b2f42]',
  aiActionBg: 'bg-[#b4394e]',
  aiActionHover: 'hover:bg-[#9b2f42]',
  aiActionDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  aiActionText: 'text-white',
};

export const themes: Record<Theme, ThemeClasses> = { dark, light };
