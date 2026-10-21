'use client';

import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemLabel = 'items'
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems <= (itemsPerPage || 10))) {
    // If only 1 page and item count is low, show small item summary
    if (totalItems && totalItems > 0) {
      return (
        <div className={styles.paginationWrapper}>
          <div className={styles.summaryText}>
            Showing all {totalItems} {itemLabel}
          </div>
        </div>
      );
    }
    return null;
  }

  const startItem = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  const pagesArray = [];
  for (let i = 1; i <= totalPages; i++) {
    pagesArray.push(i);
  }

  return (
    <div className={styles.paginationWrapper}>
      <div className={styles.summaryText}>
        {totalItems && itemsPerPage ? (
          `Showing ${startItem}-${endItem} of ${totalItems} ${itemLabel}`
        ) : (
          `Page ${currentPage} of ${totalPages}`
        )}
      </div>

      <div className={styles.controls}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={styles.pageBtn}
          aria-label="Previous Page"
        >
          ‹ Prev
        </button>

        {pagesArray.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ''}`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={styles.pageBtn}
          aria-label="Next Page"
        >
          Next ›
        </button>
      </div>
    </div>
  );
};
