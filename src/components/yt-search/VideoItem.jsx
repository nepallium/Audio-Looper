import React from "react";
import VideoDetail from "./VideoDetail";

export default function VideoItem({ video, onVideoSelect }) {
  return (
    <div onClick={() => onVideoSelect(video)} className="flex flex-col gap-2">
      <img
        className="min-w-full"
        src={video.snippet.thumbnails.medium.url}
        alt={video.snippet.title}
      />
      <div className="px-4 text-lg">
        <h3 className="">{decodeHtmlEntities(video.snippet.title)}</h3>
      </div>
    </div>
  );
}

function decodeHtmlEntities(str) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}
