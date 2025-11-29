import React, { useState, useEffect } from "react";
import { getAudios } from "../../api/indexedDB";
import AudioList from "./AudioList";
import SearchBar from "./SearchBar";
import { SyncLoader } from "react-spinners";
import getCssVar from "../../utils/getCssVar";

const AudiosSearchPage = () => {
  const [audios, setAudios] = useState(null);
  const [error, setError] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);

  useEffect(() => {
    async function loadAudios() {
      try {
        const res = await getAudios();

        if (res === null || res === undefined) {
          // Handle case where getAudios returns nothing/unexpected value
          setError("No audios found or unexpected response.");
          setAudios([]); // Set to empty array if no data
        } else {
          setAudios(res);

          // Calculate approximate size
          const sizeInBytes = new Blob([JSON.stringify(res)]).size;
          const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

          setStorageInfo({
            usedMB: sizeInMB,
            quotaMB: "Unknown",
            percentUsed: "Unknown",
          });
          console.log("Sample audio object:", res[0]);

          console.log(`Approximate data size: ${sizeInMB} MB`);
        }
      } catch (err) {
        console.error("Could not load existing audios:", err);
        setError("Failed to load audio data.");
        setAudios([]); // Set to empty array on error to safely render list
      }
    }

    loadAudios();
  }, []);

  if (error) {
    return (
      <div className="page-layout text-base-light">
        <p className="text-error font-bold">Error: {error}</p>
      </div>
    );
  }

  if (audios === null) {
    // Show a loading indicator if data hasn't arrived yet
    return (
      <div className="page-layout text-base-light flex justify-center items-center h-full">
        <SyncLoader color={getCssVar("--text-color")} size={10} />
      </div>
    );
  }

  return (
    <div className="flex flex-col page-layout text-base-light">
      <h1 className="header">Saved Audios</h1>

      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {audios.length === 0 ? (
          <p className="text-center text-lg mt-4">
            Saved audios will appear here
          </p>
        ) : (
          <>
            <p>{`${audios.length} saved ${
              audios.length > 1 ? "audios" : "audio"
            } 
            `}</p>
            <SearchBar setAudios={setAudios} />
            <AudioList audios={audios} />
          </>
        )}
      </div>
    </div>
  );
};

export default AudiosSearchPage;
