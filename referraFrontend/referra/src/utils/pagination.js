/**
 * Generate pagination pages with smart ellipsis
 * Shows 2 pages before and 2 pages after the active page
 * Active page is always in the middle when possible
 */
export const getPaginationPages = (currentPage, totalPages) => {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    // If 7 or fewer pages, show all
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const delta = 2; // 2 pages before and after

  // Case 1: Active page is at the start (page 1)
  if (currentPage === 1) {
    // Show first 5 pages (1, 2, 3, 4, 5), then "...", then last page
    for (let i = 1; i <= 5; i++) {
      pages.push(i);
    }
    if (totalPages > 5) {
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  // Case 2: Active page is at the end
  if (currentPage === totalPages) {
    // Show first page, then "...", then last 5 pages
    pages.push(1);
    if (totalPages > 5) {
      pages.push("...");
    }
    for (let i = Math.max(1, totalPages - 4); i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Case 3: Active page is near the start (pages 2-3)
  if (currentPage <= 3) {
    // Show first 5 pages, then "...", then last page
    for (let i = 1; i <= 5; i++) {
      pages.push(i);
    }
    pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  // Case 4: Active page is near the end
  if (currentPage >= totalPages - 2) {
    // Show first page, then "...", then last 5 pages
    pages.push(1);
    pages.push("...");
    for (let i = totalPages - 4; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Case 5: Active page is in the middle
  // Show first page, "...", 2 pages before, active, 2 pages after, "...", last page
  pages.push(1);
  pages.push("...");
  
  for (let i = currentPage - delta; i <= currentPage + delta; i++) {
    pages.push(i);
  }
  
  pages.push("...");
  pages.push(totalPages);
  
  return pages;
};
