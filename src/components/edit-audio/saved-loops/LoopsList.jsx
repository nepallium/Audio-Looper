import { useEffect, useState } from "react";
import { getLoopRegions } from "../../../api/indexedDB";
import LoopCard from "./LoopCard";

export default function LoopsList({ videoId, displayRegion }) {
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    async function loadRegions() {
      const loaded = await getLoopRegions(videoId);
      let nameIdx = 1;
      const loadedRegions = loaded.map((region) => {
        let name;
        if (!region.name) {
          name = `Loop ${nameIdx++}`;
        }

        return (
          <LoopCard
            onClick={() => {
              displayRegion(region);
              //todo close modal
            }}
            key={region.id}
            name={name}
            {...region}
          />
        );
      });
      setRegions(loadedRegions);
    }
    loadRegions();
  }, []);

  return <div>{regions}</div>;
}
