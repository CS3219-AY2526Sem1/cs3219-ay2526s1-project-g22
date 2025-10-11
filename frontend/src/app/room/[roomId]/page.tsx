import CodeEditor from "../_components/CodeEditor";
import EndSessionButton from "../_components/EndSessionBtn";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return (
    <div className="flex h-screen">
      {/* Sidebar on the left */}
      <div className="w-1/4 bg-gray-800 text-white p-4">
        <div className="mt-6">
          {/* To fetch data from question bank after question is selected based on both users' preferences */}
          <p className="text-lg font-extrabold">Question Title</p>
          <p>Question Text</p>
        </div>
      </div>

      {/* Code Editor on the right */}
      <div className="w-3/4 h-full p-4 bg-gray-50">
        <CodeEditor sessionId={roomId} />
      </div>
    </div>
  );
}
