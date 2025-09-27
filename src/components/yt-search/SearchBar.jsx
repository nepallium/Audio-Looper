import React, { useState } from "react";

const SearchBar = ({ onFormSubmit }) => {
  const [term, setTerm] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();

    onFormSubmit(term);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <form onSubmit={onSubmit} className="w-full">
        <div className="flex flex-col gap-2">
          <label className="text-lg font-medium">Video Search</label>
          <input
            type="text"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search for a video..."
          />
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
