function Popover({ children }) {
  return (
    <>
      {/* Popover triangle */}
      <div className="inset-x-0 overflow-hidden absolute flex justify-center opacity-80 cursor-default z-50">
        <div className="h-5 w-5 bg-blue-gray-700 rotate-45 transform origin-bottom-left"></div>
      </div>

      {/* Popover wrapper, right-aligned (only current needed use-case) */}
      <div className="absolute bg-blue-gray-700 bg-opacity-80 mt-4 p-2 rounded-lg shadow min-w-full right-0 cursor-default z-50">
        {children}
      </div>
    </>
  );
}

export default Popover;
