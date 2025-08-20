export default function VideoPreview({ fileId, size = 'sm' }) {
  const preview = `https://drive.google.com/file/d/${fileId}/preview`
  const direct = `https://drive.google.com/uc?export=download&id=${fileId}`
  const widthClass = size === 'sm' ? 'w-80 sm:w-96' : 'w-[560px]'
  return (
    <div className="grid gap-2">
      <div className={`aspect-video ${widthClass} mx-auto overflow-hidden rounded-md border border-neutral-800`}>
        <iframe
          src={preview}
          allow="autoplay; fullscreen"
          loading="lazy"
          className="w-full h-full"
          title={`Preview ${fileId}`}
        />
      </div>
      <div className="text-xs text-neutral-400">Direct link (Discord autoplay): {direct}</div>
    </div>
  )
}
