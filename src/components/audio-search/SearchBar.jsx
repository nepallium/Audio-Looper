import React, { useEffect, useState } from "react";
import { getAudiosByName } from "../../api/indexedDB";
import useDebounce from "../../hooks/useDebounce";

export default function SearchBar({ setFilteredAudios }) {
  const [term, setTerm] = useState("");

  const debouncedSearchTerm = useDebounce(term);

  useEffect(() => {
    async function searchAudios() {
      const audios = await getAudiosByName(debouncedSearchTerm);
      setFilteredAudios(audios);
    }

    searchAudios();
  }, [debouncedSearchTerm]);

  return (
    <div className="w-full max-w-xl mx-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="w-full"
      >
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
