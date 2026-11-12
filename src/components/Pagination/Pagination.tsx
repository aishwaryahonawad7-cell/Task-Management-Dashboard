
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  function handlePrevious() {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }

  function handleNext() {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }

  return (
    <div className="pagination">
      <button
        type="button"
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={handlePrevious}
      >
        Previous
      </button>

      {pages.map((page) => (
        <button
          type="button"
          key={page}
          className={
            currentPage === page
              ? "active-page"
              : "page-number"
          }
          aria-current={
            currentPage === page ? "page" : undefined
          }
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={handleNext}
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
