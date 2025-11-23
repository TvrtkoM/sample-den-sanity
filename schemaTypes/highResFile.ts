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

  validation: Rule =>
    Rule.custom((value, context) => {
      if (!value) return 'You must upload a WAV file'
      if (!value.s3Key) return 'WAV upload missing or incomplete'
      if (!value.mp3AssetId) return 'MP3 preview was not generated'

      // Parent document
      const doc = context.parent as {
        previewFile?: { asset?: { _ref?: string } }
      }

      const previewAsset = doc?.previewFile?.asset?._ref

      if (!previewAsset)
        return 'Preview MP3 asset is missing — this should be created automatically.'

      if (value.mp3AssetId !== previewAsset)
        return 'Preview MP3 and WAV file do not match.'

      return true
    }),
})
