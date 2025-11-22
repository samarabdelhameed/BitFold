interface OrdinalInfo {
  inscription_id: string
  content_type: string
  content_preview?: string
  metadata?: string
}

interface OrdinalPreviewProps {
  ordinal: OrdinalInfo
}

function OrdinalPreview({ ordinal }: OrdinalPreviewProps) {
  const isImage = ordinal.content_type.startsWith('image/')
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h4 className="font-semibold mb-2">Ordinal NFT</h4>
      <div className="space-y-2">
        <div>
          <span className="text-sm text-gray-600">Inscription ID:</span>
          <p className="text-xs font-mono break-all">{ordinal.inscription_id}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Content Type:</span>
          <p className="text-sm">{ordinal.content_type}</p>
        </div>
        {isImage && ordinal.content_preview && (
          <div className="mt-2">
            <img 
              src={ordinal.content_preview} 
              alt="Ordinal preview" 
              className="max-w-full h-auto rounded"
            />
          </div>
        )}
        {ordinal.metadata && (
          <div className="mt-2">
            <span className="text-sm text-gray-600">Metadata:</span>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {ordinal.metadata}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdinalPreview

