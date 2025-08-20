export default function VideoPreview({ fileId }) {
  const preview = `https://drive.google.com/file/d/${fileId}/preview`
  const direct = `https://drive.google.com/uc?export=download&id=${fileId}`
  return (
    <div className="grid gap-2">
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-neutral-800">
        <iframe
          src={preview}
          allow="autoplay; fullscreen"
          className="w-full h-full"
          title={`Preview ${fileId}`}
        />
      </div>
      <div className="text-xs text-neutral-400">Direct link (Discord autoplay): {direct}</div>
    </div>
  )
}
