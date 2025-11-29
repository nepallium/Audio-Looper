import React, { useState, useEffect } from "react";
import { getAudios } from "../../api/indexedDB";
import AudioList from "./AudioList";
import SearchBar from "./SearchBar";
import { SyncLoader } from "react-spinners";
import getCssVar from "../../utils/getCssVar";
import Modal from "react-modal";
import { IoWarning } from "react-icons/io5";

const AudiosSearchPage = () => {
  const [audios, setAudios] = useState(null);
  const [error, setError] = useState(null);
  const [sizeInMB, setSizeInMB] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

          // Calculate approximate audios size in MB
          let totalSize = 0;

          for (const audio of res) {
            // Size of metadata (exclude blobObj from JSON calculation)
            const metadata = { ...audio, blobObj: undefined };
            const metadataSize = new Blob([JSON.stringify(metadata)]).size;

            // Size of actual audio blob
            const blobSize = audio.blobObj ? audio.blobObj.size : 0;

            totalSize += metadataSize + blobSize;
          }

          const size = (totalSize / (1024 * 1024)).toFixed(2);

          setSizeInMB(size);
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

      {/* main area: make it grow so inner scroll can be constrained */}
      <div className="p-4 flex flex-col flex-1 min-h-0">
        {audios.length === 0 ? (
          <p className="text-center text-lg mt-4">
            Saved audios will appear here
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              <div className="flex items-center justify-between">
                <p className="ml-2">{`${audios.length} saved ${
                  audios.length > 1 ? "audios" : "audio"
                } | ${sizeInMB}MB`}</p>
                <button
                  className="regular-button"
                  onClick={() => setIsModalOpen(true)}
                >
                  Delete All
                </button>
              </div>
              <div className="flex flex-col gap-4 bg-surface-200 rounded-lg p-2 flex-1 min-h-0">
                <SearchBar setAudios={setAudios} />
                <AudioList audios={audios} />
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center justify-center">
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="flex flex-col gap-8 bg-surface-200 max-w-[400px] w-[80%] text-lg text-base-light px-6 py-4 rounded-md"
          overlayClassName="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-[50]"
          contentLabel="Save Loops Modal"
        >
          <p className="font-bold tracking-wide text-2xl mb-3">
            Delete all loops
          </p>
          <div className="flex gap-3 items-center justify-center">
            <IoWarning size="2rem" color={getCssVar("--error-color")} />
            <p className="text-lg text-error font-semibold">
              This action is irreversible
            </p>
          </div>
          <div className="flex flex-row gap-6 justify-end">
            <button
              onClick={() => setIsModalOpen(false)}
              className="regular-button bg-primary-100 text-base-dark"
            >
              Cancel
            </button>
            <button className="regular-button bg-surface-100 opacity-90">
              Delete All
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AudiosSearchPage;
