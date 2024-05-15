import { Media } from '@toolkit/core'
import React from 'react'
import { BiFile } from 'react-icons/bi'
import { CopyField } from './copy-field'
import { isImage, isVideo, absoluteImgURL } from './utils'

const DefaultMediaPreview = ({ media }: { media: Media }) => {
  const thumbnail = media.thumbnails['1000x1000']
  return (
    <div className="flex flex-col gap-3 px-6 py-5">
      {isImage(thumbnail) ? (
        <div className="w-full max-h-[75%]">
          <img
            className="block border border-gray-100 rounded-md overflow-hidden object-center object-contain max-w-full max-h-full m-auto shadow"
            src={thumbnail}
            alt={media.filename}
          />
        </div>
      ) : isVideo(thumbnail) ? (
        <div className="w-full max-h-[75%]">
          <video
            className="block border border-gray-100 rounded-md overflow-hidden object-center object-contain max-w-full max-h-full m-auto shadow"
            src={thumbnail}
            muted
            autoPlay
            loop
          />
        </div>
      ) : (
        <span className="p-3 border border-gray-100 rounded-md overflow-hidden bg-gray-50 shadow">
          <BiFile className="w-14 h-auto fill-gray-300" />
        </span>
      )}
      <div className="grow h-full w-full shrink flex flex-col gap-3 items-start justify-start">
        <CopyField value={absoluteImgURL(media.src)} label="URL" />
      </div>
    </div>
  )
}

export default DefaultMediaPreview
