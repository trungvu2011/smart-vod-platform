import { useMemo } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { ArrowLeft } from "lucide-react";

function useTemplateParams() {
  return useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    return {
      serverUrl: q.get("url") || "",
      token: q.get("token") || "",
      layout: q.get("layout") || "grid",
    };
  }, []);
}

function RecordingHeader() {
  const room = useRoomContext();
  const roomName = room?.name || "Meeting";

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a2e] border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg text-zinc-400">
          <ArrowLeft size={18} />
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm">Meeting Recording</h2>
          <p className="text-zinc-500 text-xs">Room: {roomName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 text-sm font-medium">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        REC
      </div>
    </div>
  );
}

export default function MeetingRecordingTemplatePage() {
  const { serverUrl, token, layout } = useTemplateParams();

  if (!serverUrl || !token) {
    return (
      <div className="grid h-screen w-screen place-items-center bg-[#111317] text-base font-medium leading-[1.4] text-white">
        Missing egress template params.
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden bg-[#111317] [&_.lk-chat]:hidden [&_.lk-connection-quality]:hidden [&_.lk-control-bar]:hidden [&_.lk-focus-layout-wrapper]:h-full [&_.lk-grid-layout-wrapper]:h-full [&_.lk-participant-placeholder]:bg-[#5e6167] [&_.lk-participant-tile]:overflow-hidden [&_.lk-participant-tile]:rounded-xl [&_.lk-room-container]:h-full [&_.lk-room-container]:w-full [&_.lk-settings-menu-modal]:hidden [&_.lk-toast]:hidden [&_.lk-video-conference]:h-full [&_.lk-video-conference]:w-full [&_.lk-video-conference-inner]:h-full [&_.lk-video-conference-inner]:w-full"
      data-layout={layout}
    >
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        audio={false}
        video={false}
        onConnected={() => {
          // LiveKit Egress waits for this marker before starting capture.
          console.log("START_RECORDING");
        }}
        onDisconnected={() => {
          console.log("END_RECORDING");
        }}
        onError={(e) => {
          console.error("[EGRESS TEMPLATE]", e.message);
        }}
        data-lk-theme="default"
        style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        <RecordingHeader />
        <div className="flex-1 overflow-hidden">
          <VideoConference />
          <RoomAudioRenderer />
        </div>
      </LiveKitRoom>
    </div>
  );
}
