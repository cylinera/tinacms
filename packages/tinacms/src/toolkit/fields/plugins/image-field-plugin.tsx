import * as React from 'react'
import { wrapFieldsWithMeta } from './wrap-field-with-meta'
import { InputProps, ImageUpload } from '../components'
import { Media } from '@toolkit/core'
import { useCMS } from '@toolkit/react-core'
import { useState } from 'react'
import { FileError } from 'react-dropzone'

interface ImageProps {
  path: string
  uploadDir?(formValues: any): string
  clearable?: boolean
}

export const ImageField = wrapFieldsWithMeta<InputProps, ImageProps>(
  (props) => {
    const ref = React.useRef(null)
    const cms = useCMS()
    const { value } = props.input
    const src = value?.src
    const [isImgUploading, setIsImgUploading] = useState(false)
    let onClear: any
    if (props.field.clearable) {
      onClear = () => props.input.onChange('')
    }

    React.useEffect(() => {
      if (ref.current && props.field.experimental_focusIntent) {
        ref.current.focus()
      }
    }, [props.field.experimental_focusIntent, ref])

    async function onChange(media: Media) {
      props.input.onChange({ id: media.id, src: media.src })
    }
    const uploadDir =
      props.field.uploadDir ||
      (() => {
        if (src) {
          return decodeURIComponent(new URL(src).pathname)
            .split('/')
            .slice(2, -1)
            .join('/')
        }
        return ''
      })

    return (
      <ImageUpload
        ref={ref}
        value={value}
        src={src}
        loading={isImgUploading}
        onClick={() => {
          const directory = uploadDir(props.form.getState().values)
          cms.media.open({
            allowDelete: true,
            directory,
            id: value?.id,
            onSelect: onChange,
          })
        }}
        onDrop={async ([file]: File[], fileRejections) => {
          setIsImgUploading(true)
          try {
            if (file) {
              const directory = uploadDir(props.form.getState().values)
              const [media] = await cms.media.persist([
                {
                  directory: directory,
                  file,
                },
              ])
              if (media) {
                await onChange(media)
              }
            }

            // Codes here https://github.com/react-dropzone/react-dropzone/blob/c36ab5bd8b8fd74e2074290d80e3ecb93d26b014/typings/react-dropzone.d.ts#LL13-L18C2
            const errorCodes = {
              'file-invalid-type': 'Invalid file type',
              'file-too-large': 'File too large',
              'file-too-small': 'File too small',
              'too-many-files': 'Too many files',
            }

            const printError = (error: FileError) => {
              const message = errorCodes[error.code]
              if (message) {
                return message
              }
              console.error(error)
              return 'Unknown error'
            }

            // Upload Failed
            if (fileRejections.length > 0) {
              const messages = []
              fileRejections.map((fileRejection) => {
                messages.push(
                  `${fileRejection.file.name}: ${fileRejection.errors
                    .map((error) => printError(error))
                    .join(', ')}`
                )
              })
              // @ts-ignore
              cms.alerts.error(() => {
                return (
                  <>
                    Upload Failed. <br />
                    {messages.join('. ')}.
                  </>
                )
              })
            }
          } catch (error) {
            console.error('Error uploading media asset: ', error)
          } finally {
            setIsImgUploading(false)
          }
        }}
        onClear={onClear}
      />
    )
  }
)

export const ImageFieldPlugin = {
  name: 'image',
  Component: ImageField,
  parse: (value, name, field) => {
    if (field.type === 'reference' || field.mode === 'compat') {
      return value ? JSON.stringify(value) : ''
    } else {
      return value.src
    }
  },
  format: (value, name, field) => {
    if (field.type === 'reference') {
      return value ? JSON.parse(value) : null
    } else if (field.mode === 'compat') {
      if (!value) return null
      try {
        return JSON.parse(value)
      } catch (e) {
        return { id: value, src: value }
      }
    } else if (value) {
      return { id: value, src: value }
    } else {
      return null
    }
  },
  validate(value: any, values: any, meta: any, field: any) {
    if (field.required && !value) return 'Required'
  },
}
