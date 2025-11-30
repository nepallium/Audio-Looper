import React, { useState, useEffect, useMemo } from "react";
import { clearAudios, deleteAudio, getAudios } from "../../api/indexedDB";
import AudioList from "./AudioList";
import SearchBar from "./SearchBar";
import { SyncLoader } from "react-spinners";
import getCssVar from "../../utils/getCssVar";
import Modal from "react-modal";
import { IoWarning } from "react-icons/io5";

const AudiosSearchPage = () => {
  const [allAudios, setAllAudios] = useState(null); // Full database
  const [filteredAudios, setFilteredAudios] = useState(null); // Filtered/displayed audios
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    isSingle: false,
    audioId: null,
  });

  // Load initial audios from DB
  useEffect(() => {
    async function loadAudios() {
      try {
        const res = await getAudios();

        if (res === null || res === undefined) {
          setError("No audios found or unexpected response.");
          setAllAudios([]);
          setFilteredAudios([]);
        } else {
          setAllAudios(res);
          setFilteredAudios(res);
        }
      } catch (err) {
        console.error("Could not load existing audios:", err);
        setError("Failed to load audio data.");
        setAllAudios([]);
        setFilteredAudios([]);
      }
    }

    loadAudios();
  }, []);

  // Calculate total DB size (based on allAudios, not filtered)
  const totalSizeInMB = useMemo(() => {
    if (!allAudios) return null;

    let totalSize = 0;
    for (const audio of allAudios) {
      const metadata = { ...audio, blobObj: undefined };
      const metadataSize = new Blob([JSON.stringify(metadata)]).size;
      const blobSize = audio.blobObj?.size || 0;
      totalSize += metadataSize + blobSize;
    }

    return (totalSize / (1024 * 1024)).toFixed(2);
  }, [allAudios]);

  function openModal(isSingle = false, audioId = null) {
    setDeleteModal({ isOpen: true, isSingle, audioId });
  }

  function closeModal() {
    setDeleteModal({ isOpen: false, isSingle: false, audioId: null });
  }

  async function onDeleteSingle(id) {
    const success = await deleteAudio(id);
    if (success) {
      setAllAudios((prev) => prev.filter((audio) => audio.id !== id));
      setFilteredAudios((prev) => prev.filter((audio) => audio.id !== id));
    }
    closeModal();
  }

  async function onDeleteAll() {
    if (allAudios.length > 0) {
      const ok = await clearAudios();
      if (!ok) {
        console.log("Could not clear database");
      } else {
        setAllAudios([]);
        setFilteredAudios([]);
      }
    }
    closeModal();
  }

  if (error) {
    return (
      <div className="page-layout text-base-light">
        <p className="text-error font-bold">Error: {error}</p>
      </div>
    );
  }

  if (allAudios === null) {
    return (
      <div className="page-layout text-base-light flex justify-center items-center h-full">
        <SyncLoader color={getCssVar("--text-color")} size={10} />
      </div>
    );
  }

  return (
    <div className="flex flex-col page-layout text-base-light">
      <h1 className="header">Saved Audios</h1>

      <div className="p-4 flex flex-col flex-1 min-h-0">
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <p className="ml-2">
              {`${allAudios.length} saved ${
                allAudios.length === 1 ? "audio" : "audios"
              } | ${totalSizeInMB}MB`}
            </p>
            <button className="regular-button" onClick={() => openModal()}>
              Delete All
            </button>
          </div>
          <div className="flex flex-col gap-4 bg-surface-200 rounded-lg p-2 flex-1 min-h-0">
            <SearchBar
              allAudios={allAudios}
              setFilteredAudios={setFilteredAudios}
            />
            {filteredAudios.length === 0 ? (
              <p className="text-center text-lg mt-4">
                {allAudios.length === 0
                  ? "Saved audios will appear here"
                  : "No audios found with search term"}
              </p>
            ) : (
              <AudioList audios={filteredAudios} openModal={openModal} />
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        onRequestClose={closeModal}
        className="flex flex-col gap-8 bg-surface-200 max-w-[400px] w-[80%] text-lg text-base-light px-6 py-4 rounded-md"
        overlayClassName="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-[50]"
        contentLabel="Delete Audio Modal"
      >
        <p className="font-bold tracking-wide text-2xl mb-3">
          {deleteModal.isSingle ? "Delete loop" : "Delete all loops"}
        </p>
        <div className="flex gap-3 items-center justify-center">
          <IoWarning size="2rem" color={getCssVar("--error-color")} />
          <p className="text-lg text-error font-semibold">
            This action is irreversible
          </p>
        </div>
        <div className="flex flex-row gap-6 justify-end">
          <button
            onClick={closeModal}
            className="regular-button bg-primary-100 text-base-dark"
          >
            Cancel
          </button>
          <button
            className="regular-button bg-surface-100 opacity-90"
            onClick={() => {
              if (deleteModal.isSingle) {
                onDeleteSingle(deleteModal.audioId);
              } else {
                onDeleteAll();
              }
            }}
          >
            {deleteModal.isSingle ? "Delete" : "Delete All"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AudiosSearchPage;
