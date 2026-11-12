interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <>
    <input
      type="search"
      placeholder="Search by ID, customer or subject..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Search tickets"
    />
    </>
  );
}

export default SearchBar;