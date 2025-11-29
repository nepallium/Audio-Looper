import React, { useState } from "react";

export default function SearchBar({ setAudios }) {
  const [term, setTerm] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();

    onFormSubmit(term);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={onSubmit} className="w-full">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="w-full p-3 text-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Search for a title"
          />
        </div>
      </form>
    </div>
  );
}
