import { defineType, defineField } from 'sanity'
import S3UploaderInput from '../components/S3UploaderInput'

export const highResFile = defineType({
  name: 'highResFile',
  title: 'High-Res WAV (private S3 storage)',
  type: 'object',
  fields: [
    defineField({
      name: 'fileName',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 's3Key',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'mp3AssetId',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'mp3Url',
      type: 'url',
      readOnly: true,
    }),
  ],
  components: {
    input: S3UploaderInput,
  },

  validation: (Rule) =>
    Rule.custom((value, context) => {
      if (!value) {
        return 'You must upload a WAV file'
      }

      if (!value.s3Key) {
        return 'WAV file missing. Please upload.'
      }

      if (!value.mp3AssetId) {
        return 'MP3 preview not generated yet.'
      }

      // Access the parent document:
      const doc = context.parent as {
        previewFile?: {
          asset?: { _ref?: string }
        }
      }

      const previewFile = doc.previewFile
      if (!previewFile)
        return 'Preview MP3 file missing.'

      const assetRef = previewFile?.asset?._ref
      if (!assetRef)
        return 'Preview MP3 asset reference is missing.'

      if (assetRef !== value.mp3AssetId)
        return 'Preview MP3 does not match uploaded WAV.'

      return true
    }),
})